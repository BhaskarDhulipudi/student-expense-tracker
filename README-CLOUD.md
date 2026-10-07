# Cloud deployment preparation

This version is prepared for Render using Docker + Render Postgres.

## Important security note
The current MVP has no login/authentication and the API is not separated per user. **Do not publish it as a public multi-user expense app yet.** Anyone who can reach the public URL could potentially access the same shared expense data through the API.

Use cloud deployment only as a private/student test until authentication and per-user data isolation are added.

## What was added
- Dockerfile for Java 17 + Spring Boot
- PostgreSQL JDBC driver while keeping MySQL for local development
- Environment-based datasource configuration
- `PORT` environment support
- `render.yaml` for a Render Web Service + Render Postgres
- Singapore region selected for lower latency from India
- PWA remains compatible with HTTPS deployment

## Render setup
1. Put this project in a GitHub repository.
2. In Render, create a Blueprint from that repository.
3. Render will read `render.yaml` and create the web service and Postgres database.
4. The free Render web service has idle spin-down; the free Render Postgres database currently expires after 30 days. This is suitable for testing, not permanent storage.
5. Render provides HTTPS for deployed web services, which is required for normal PWA installation on Android.

## Local development
The default datasource remains MySQL:

`jdbc:mysql://localhost:3306/student_expenses...`

For local use, set `DB_PASSWORD` or change the password in your environment.

## Before production
Add:
- user registration/login
- password hashing
- per-user ownership on every expense
- authenticated API endpoints
- HTTPS-only cookies/tokens
- database backups
- CSRF/CORS policy appropriate to the final architecture
