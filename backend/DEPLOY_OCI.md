# OCI Backend Migration Guide

This guide provides the complete, copy-paste-ready commands and configurations needed to migrate from Render to an OCI Free-tier A1.Flex (ARM64) VM. 

> **ARM64 Architecture:** The OCI free-tier uses ARM64 processors. All software installed here (Docker, Java builds) natively targets ARM64.  
> **OCI Firewalls:** OCI has two firewall layers. You MUST configure both the web console Security List and the OS-level `ufw`/`iptables`.

---

## Step 1 — OCI Instance Setup

### Action Items
1. From the OCI Console, create an **A1.Flex** instance running **Ubuntu 22.04 LTS (aarch64)**.
2. Under Networking, assign a **Reserved Public IP** to this instance.
3. In your VCN **Security Lists**, add Ingress Rules for TCP ports `22`, `80`, and `443` (Source CIDR: `0.0.0.0/0`).

Once the VM is running, SSH into it as the default `ubuntu` user:
```bash
ssh -i /path/to/your/private_key.pem ubuntu@<YOUR_RESERVED_IP>
```

### Configure OS and Users

Run the following commands on the VM to set up the `deploy` user, harden SSH, and update firewalls:

```bash
# 1. Create deploy user (no password prompt)
sudo adduser deploy --gecos "" --disabled-password
sudo usermod -aG sudo deploy

# 2. Copy SSH keys from ubuntu to deploy user
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 3. Disable password authentication for SSH
sudo sed -i 's/^#*PasswordAuthentication yes/PasswordAuthentication no/g' /etc/ssh/sshd_config
sudo systemctl restart ssh

# 4. Configure UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 5. VERY IMPORTANT: Bypass OCI's default iptables DROP rules
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

**Verification:**  
Logout and SSH back in as the new user: `ssh -i <key> deploy@<YOUR_RESERVED_IP>`. It should connect without asking for a password.

---

## Step 2 — Install Docker & docker-compose

Still connected to the VM as `deploy`, install the ARM64 Docker Engine:

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

Create a working directory and your configuration files:

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
      # Override the DB URL to point to the db container
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/rico_db
    ports:
      # Binding to 127.0.0.1 prevents exposing port 8000 externally
      - "127.0.0.1:8000:8080"
    networks:
      - app-network

volumes:
  pg_data:

networks:
  app-network:
```

> Ensure you copy your backend source code (`src/` folder, `build.gradle`, `Dockerfile`, etc.) to `~/app` on the VM. 
> Also, create a `.env` file in `~/app` containing your `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, and JWT secrets. Add `.env` to `.gitignore`.

**Verification:**  
Run `docker compose config`. It should parse successfully without syntax errors.

---

## Step 4 — Initialize Database Schema

On your **local machine** (where you have PG tools installed):

```bash
# 1. Dump schema from Render
PGPASSWORD="<render_db_password>" pg_dump -h <render_host> -U <render_user> -d <render_db> --schema-only -f schema.sql

# 2. Transfer to OCI VM
scp -i /path/to/key schema.sql deploy@<YOUR_RESERVED_IP>:~/app/
```

On the **OCI VM** (ensure your database is running via `docker compose up -d db`):

```bash
# 3. Apply the schema
cat ~/app/schema.sql | docker exec -i rico_db psql -U <your_db_username_from_env> -d rico_db
```

**Verification:**  
Log into the DB to check if tables exist:  
`docker exec -it rico_db psql -U <your_db_username_from_env> -d rico_db -c "\dt"`

---

## Step 5 — Install Nginx & Configure Reverse Proxy

On the **OCI VM**:

```bash
sudo apt-get install -y nginx

# Create the config file
sudo nano /etc/nginx/sites-available/app.conf
```

**/etc/nginx/sites-available/app.conf:**

```nginx
server {
    listen 80;
    
    # Replace the underscore with your domain once you have it.
    # e.g., server_name yourdomain.com www.yourdomain.com;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        
        # Preserve client IPs and headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

**Verification:**  
Run `curl -I http://localhost` locally on the VM, or visit the Reserved IP in your browser to hit port `80` (should proxy to your Spring Boot app's health check/response).

---

## Step 6 — Let's Encrypt HTTPS

> **IMPORTANT:**  
> Skip this until you have purchased a domain. **Once you own a domain:**
> 1. Set the root `@` A record in your DNS provider to point to your **Reserved IP**.
> 2. Change `server_name _;` in `/etc/nginx/sites-available/app.conf` to `server_name yourdomain.com www.yourdomain.com;` and reload nginx.

Once DNS is propagated, install Certbot:

```bash
# Install core snap and certbot
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Issue certificates and auto-configure Nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically add the port `443` block to your `app.conf` and issue 301 redirects to enforce HTTPS.

**Verification:**  
1. `sudo systemctl status snap.certbot.renew.timer` (ensures certs auto-renew).
2. Visit `http://yourdomain.com`; it should instantly redirect to `https`.

---

## Step 7 — Update Netlify Environment Variables

1. Go to your **Netlify Dashboard** → **Site configuration** → **Environment variables**.
2. Locate your API baseURL variable (e.g., `REACT_APP_API_URL` or `VITE_API_URL`).
3. **Before domain setup:** Change to `http://<YOUR_RESERVED_IP>` (Note: Modern browsers block "Mixed Content"—HTTP requests from an HTTPS website—so testing must happen locally or with browser security flags off).
4. **After domain + Let's Encrypt:** Change to `https://yourdomain.com`
5. **Trigger Redeploy:** Go to Builds → Clear cache and deploy site.

**Verification:**  
Open your Netlify frontend, trigger a network request, and check your browser's Developer Tools (Network tab) to ensure it targets the correct URL.

---

## Step 8 — Production Hardening

Ensure Docker containers start automatically if the entire VM reboots (OCI instances restart occasionally for hardware maintenance).

Create a systemd service for docker-compose:
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

Enable and start your service:
```bash
sudo systemctl enable docker-compose-app.service
sudo systemctl start docker-compose-app.service
```

**Logs and Monitoring paths:**
- **App Logs:** `docker compose -f /home/deploy/app/docker-compose.yml logs -f app`
- **Nginx Access Log:** `tail -f /var/log/nginx/access.log`
- **Nginx Error Log:** `tail -f /var/log/nginx/error.log`

**Smoke Test:**
Run `curl -sk https://yourdomain.com/health` (or whatever your unauthenticated ping/health endpoint is) to verify everything is responding correctly.
