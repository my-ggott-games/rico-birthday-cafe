# GCP Backend Migration Guide

This guide provides the complete, copy-paste-ready commands and configurations needed to migrate your backend to a **Google Cloud Platform (GCP) Compute Engine** VM. 

> **Architecture:** GCP's `e2-micro`, `e2-small`, `e2-medium` instances use standard x86_64 architectures. Docker and Java builds function out of the box without ARM64-specific considerations.
> **GCP Firewalls:** You must open ports 80 and 443 at the VPC network level (often by simply checking the "Allow HTTP traffic" and "Allow HTTPS traffic" boxes when creating the VM).

---

## Step 1 — GCP VM Instance Setup

### Action Items
1. From the GCP Console, navigate to Compute Engine -> VM instances, and create a new instance.
2. **Machine type:** Select e.g., `e2-micro` (Free Tier) or `e2-medium` depending on your needs.
3. **Boot disk:** Change the OS to **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS (x86_64)**.
4. **Firewall:** Check both **"Allow HTTP traffic"** and **"Allow HTTPS traffic"**.
5. **Networking (Static IP):** Under Advanced Options -> Networking -> Network Interfaces, change the External IPv4 address from Ephemeral to a **Static external IP**. Reserve a new one.

Once the VM is running, you can connect via the **"SSH" button in the GCP console**, or use `gcloud` / standard SSH:
```bash
# If using standard SSH (requires adding your public key to GCP metadata):
ssh -i /path/to/your/private_key username@<YOUR_STATIC_IP>
```

### Configure OS and Users

GCP typically provisions your personal SSH user. It is best practice to create a dedicated `deploy` user.

Run the following commands on the VM:

```bash
# 1. Create deploy user (no password prompt)
sudo adduser deploy --gecos "" --disabled-password
sudo usermod -aG sudo deploy

# 2. Copy your authorized SSH keys to the deploy user
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 3. Disable password authentication for SSH (usually already off in GCP, but good to reinforce)
sudo sed -i 's/^#*PasswordAuthentication yes/PasswordAuthentication no/g' /etc/ssh/sshd_config
sudo systemctl restart ssh

# 4. Configure OS-level UFW firewall (Optional)
# GCP instances control firewall at the VPC level.
# If you get 'ufw: command not found', you can safely skip this step.
# sudo ufw allow 22/tcp
# sudo ufw allow 80/tcp
# sudo ufw allow 443/tcp
# sudo ufw --force enable
```

**Verification:**  
Logout and SSH back in as the new user: `ssh -i <key> deploy@<YOUR_STATIC_IP>`.

---

## Step 2 — Install Docker & docker-compose

Connected to the VM as `deploy`, install Docker Engine:

```bash
# Add Docker's official GPG key
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker packages
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add deploy user to docker group
sudo usermod -aG docker deploy
```

**Verification:**  
Run `newgrp docker` (or log out and back in) to refresh your group privileges, then run: `docker --version` and `docker compose version`.

---

## Step 3 — Write docker-compose.yml

Create a working directory and your configuration files on the VM:

```bash
mkdir -p ~/app
cd ~/app
nano docker-compose.yml
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: rico_db
    restart: always
    environment:
      # Picks up credentials from .env
      POSTGRES_USER: ${SPRING_DATASOURCE_USERNAME}
      POSTGRES_PASSWORD: ${SPRING_DATASOURCE_PASSWORD}
      POSTGRES_DB: rico_db
    volumes:
      - pg_data:/var/lib/postgresql/data
    networks:
      - app-network

  app:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: rico_app
    restart: always
    depends_on:
      - db
    env_file: 
      - .env
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/rico_db
    ports:
      # Binding to 127.0.0.1 prevents exposing port 8000 directly to the internet
      - "127.0.0.1:8000:8080"
    networks:
      - app-network

volumes:
  pg_data:

networks:
  app-network:
```

> Ensure you copy your backend source code (`src/` folder, `build.gradle`, `Dockerfile`, etc.) to `~/app` on the VM. 
> Also, create a `.env` file in `~/app` containing your database credentials and secrets.

---

## Step 4 — Initialize Database Schema

On your **local machine**:
```bash
# 1. Dump schema from previous Database (e.g. Render)
PGPASSWORD="<db_password>" pg_dump -h <db_host> -U <db_user> -d <database_name> --schema-only -f schema.sql

# 2. Transfer to GCP VM
scp -i /path/to/key schema.sql deploy@<YOUR_STATIC_IP>:~/app/
```

On the **GCP VM** (ensure DB is running via `docker compose up -d db`):
```bash
# 3. Apply the schema
cat ~/app/schema.sql | docker exec -i rico_db psql -U <your_db_username_from_env> -d rico_db
```

---

## Step 5 — Install Nginx & Configure Reverse Proxy

On the **GCP VM**:

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/app.conf
```

**/etc/nginx/sites-available/app.conf:**
```nginx
server {
    listen 80;
    
    # Replace with your actual domain when ready
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site and restart Nginx
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6 — Let's Encrypt HTTPS

> **IMPORTANT:**
> 1. Set the root `@` A record in your DNS provider to point to your **GCP Static IP**.
> 2. Change `server_name _;` in `/etc/nginx/sites-available/app.conf` to `server_name yourdomain.com www.yourdomain.com;` and reload nignx.

Install Certbot:
```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Issue certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Step 7 — Production Hardening

Auto-start docker-compose on reboot:
```bash
sudo nano /etc/systemd/system/docker-compose-app.service
```

**/etc/systemd/system/docker-compose-app.service:**
```ini
[Unit]
Description=Docker Compose Application Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/deploy/app
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable docker-compose-app.service
sudo systemctl start docker-compose-app.service
```

> **Logs:** `docker compose -f /home/deploy/app/docker-compose.yml logs -f app`
