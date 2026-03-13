# Deploy `/backend` with Supabase (Postgres)

Supabase does **not** host Spring Boot apps directly. The standard setup is:

- Host this backend on Render/Railway/Fly.io (Docker)
- Use Supabase Postgres as the database

This repository is now configured for that flow.

## 1. Create Supabase DB credentials

In Supabase dashboard:

1. Open `Project Settings -> Database`
2. Copy Session Pooler host/port/user/password
3. Build JDBC URL format:

```text
jdbc:postgresql://<POOLER_HOST>:6543/postgres?sslmode=require
```

Use `backend/.env.supabase.example` as template.

## 2. Required environment variables for backend

Set these in your backend host (Render/Railway/Fly/etc):

- `SUPABASE_DB_JDBC_URL`
- `SUPABASE_DB_USER`
- `SUPABASE_DB_PASSWORD`
- `JWT_SECRET`
- `ADMIN_PASSCODE_HASH`
- `ALLOWED_ORIGINS`

Notes:

- App resolves datasource variables in this order:
  1. `SPRING_DATASOURCE_*`
  2. `SUPABASE_DB_*`
  3. `DATABASE_*`
- `sslmode=require` is needed for Supabase Postgres.

## 3. Deploy backend service (Docker)

### Render example

- Root Directory: `backend`
- Environment: `Docker`
- Health Check Path: `/actuator/health`
- Add env vars listed above

The Docker image starts with:

- `PORT` from platform (fallback `8080`)
- Java 17 runtime

## 4. Verify deployment

After deploy:

1. Open `https://<your-backend-domain>/actuator/health`
2. Confirm status is `UP`
3. Test API endpoint (example):

```bash
curl -X POST https://<your-backend-domain>/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"<your passcode>"}'
```

## 5. Optional: local run against Supabase DB

From `backend`:

```bash
set -a
source .env.supabase
set +a
./gradlew bootRun
```

(Use your own `.env.supabase` file; do not commit secrets.)
