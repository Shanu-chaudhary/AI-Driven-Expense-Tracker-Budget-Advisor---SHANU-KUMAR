# Backend: Secrets and local setup

This project expects secrets (JWT secret, mail credentials, DB URI) to be provided via environment variables or a local `application-secret.properties` file that is gitignored.

Quick setup

1. Copy the example secret file and add your real values locally (DO NOT commit):

   - `cp src/main/resources/application-secret.properties.example src/main/resources/application-secret.properties`

2. Or set environment variables (PowerShell example):

```powershell
$env:JWT_SECRET = "$(openssl rand -base64 32)"
$env:MAIL_USERNAME = "you@example.com"
$env:MAIL_PASSWORD = "your-mail-password"
mvn spring-boot:run
```

Enable commit hooks (recommended)

This repo includes hook scripts under `.githooks`. Enable them with:

```bash
git config core.hooksPath .githooks
```

The pre-commit hook will scan staged files for common secret patterns and block the commit if a potential secret is found.

If you need to bypass (not recommended):

```bash
git commit --no-verify
```

Rotate secrets immediately if they were ever committed to a public repo.
