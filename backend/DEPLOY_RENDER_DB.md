# Deploy `/backend` with Render Database

This fixes the SSL cert error:

`Could not open SSL root certificate file /root/.postgresql/root.crt`

## Required env vars on Render web service

Set these explicitly:

- `SPRING_DATASOURCE_URL=jdbc:postgresql://<render-host>:5432/<db-name>?sslmode=require`
- `SPRING_DATASOURCE_USERNAME=<db-user>`
- `SPRING_DATASOURCE_PASSWORD=<db-password>`
- `JWT_SECRET=<...>`
- `ADMIN_PASSCODE_HASH=<...>`
- `ALLOWED_ORIGINS=https://<frontend-domain>,https://<dev-frontend-domain>`

## Important

- Do not use a JDBC URL containing `sslmode=verify-full` unless you also provide a mounted CA cert file.
- For this backend, `sslmode=require` is the correct default for Render DB.
- App now prefers JDBC-safe env vars and avoids plain `DATABASE_URL` fallback.

## Health check

Use `/actuator/health`.
