# AI-Driven Expense Tracker — Notes

This repository contains frontend and backend code. Important security notes:

- Do NOT commit secrets (API keys, passwords, JWT secrets) to the repository.
- Use environment variables or the `backend/src/main/resources/application-secret.properties` file (gitignored) to store secrets locally.
- Enable the provided git hooks to prevent accidental commits of sensitive data:

```bash
git config core.hooksPath .githooks
```

See `backend/README.md` for backend-specific instructions.
