# AI-Driven Expense Tracker — Notes

This repository contains frontend and backend code. Important security notes:

BudgetPilot — AI-Driven Expense Tracker & Budget Advisor

BudgetPilot is an end-to-end personal finance assistant that helps users track transactions, analyze spending, manage budgets, and receive AI-driven recommendations. The project combines a React + Vite frontend, a Spring Boot backend, MongoDB for persistence, and a generative AI (Gemini) integration to provide conversational, contextual financial advice.

---

## Important security notes

- Do NOT commit secrets (API keys, passwords, JWT secrets) to the repository.
- Use environment variables or the `backend/src/main/resources/application-secret.properties` file (gitignored) to store secrets locally.
- Enable the provided git hooks to prevent accidental commits of sensitive data:

```powershell
git config core.hooksPath .githooks
```

See `backend/README.md` for backend-specific instructions and sensitive-file examples.

---

## Contents of this README

- Project overview and goals
- Key features (user-facing and technical)
- Architecture and technology stack
- Folder structure and important files
- Local development and setup (backend & frontend)
- Environment variables and secrets
- Running & testing the app (API examples)
- Troubleshooting common issues (Gemini, ports, tokens)
- Contributing guidelines and license

---

## Project overview

BudgetPilot is designed to be a friendly, context-aware financial assistant that:

- Tracks transactions (income/expense) and stores them in MongoDB.
- Summarizes totals and category-wise spending for any period.
- Detects budget exceedances and surfaces budget alerts.
- Provides AI-driven analysis and personalized recommendations via Gemini.
- Offers a conversational UI: free-form chat with inline suggestions and persistent context.

### User flows supported

- Add, edit, and view transactions from the web UI.
- Open the chat assistant and ask free-form questions (e.g., "How can I save more on groceries?").
- Use assistant suggestions such as "Analyze my spending report" or "Check budget alerts".
- Export or backup data (features available in the frontend components).

---

## Key features (detailed)

- **Transaction management**
	- Create, update, delete transactions with fields: date, amount, type, category, description.
	- Persisted in MongoDB with indexed queries for user and date ranges.

- **Financial summaries**
	- Total income, total expense, net savings, savings rate.
	- Category breakdown (top categories) and recent transactions.

- **Budget monitoring**
	- Detect when category budgets are exceeded (backend hooks available to add budgets storage).
	- Assistant can proactively warn about overages.

- **Conversational AI assistant (BudgetPilot)**
	- Free-form chat window that keeps transaction context up-to-date.
	- Inline suggestion options (clickable) shown beneath assistant messages.
	- All user messages are sent to the backend, which builds a compact transaction summary and forwards the prompt to Gemini.
	- Gemini responses can be JSON-wrapped (preferred) or plain text; the backend parses both.

- **Security & production minded**
	- JWT-based authentication helpers in `AuthService` and `JwtUtil`.
	- Environment-driven configuration for secrets and API keys.

---

## Architecture & components

- **Frontend**: React 19 + Vite + Tailwind CSS 3
	- Source: `frontend/src`
	- Main UI pieces: `components/Chat/*`, `components/Dashboard/*`, `pages/*`.

- **Backend**: Spring Boot (Java) + MongoDB
	- Source: `backend/src/main/java/com/shanu/backend`
	- Key services: `ChatService`, `TransactionService`, `AuthService`, `GeminiClient`.

- **Database**: MongoDB (local or remote)

- **AI Integration**: Gemini (via `GeminiClient`) — configuration-driven model & endpoint

### High-level flow

1. User interacts with frontend (e.g., types a chat message).
2. Frontend calls backend endpoints in `ChatController`.
3. `ChatService` builds a compact transaction context (totals, categories, recent txns) and appends conversation history.
4. `GeminiClient` sends a single request containing the system prompt + transaction context + user message to Gemini.
5. Response is parsed by `ChatService.parseGeminiResponse` (JSON or plain text) and returned to the frontend.

---

## Folder structure (top-level)

- `backend/` — Spring Boot backend
	- `src/main/java/com/shanu/backend` — application code
	- `src/main/resources` — `application.properties` and optional `application-secret.properties`
	- `pom.xml`, `mvnw`, `mvnw.cmd`

- `frontend/` — React + Vite UI
	- `src/` — React components, pages, API helpers
	- `package.json`, `vite.config.js`

- Docs & notes: `README_AI.md`, `GEMINI_SETUP_DEBUG.md`, `HELP.md`, other project notes

---

## Technology stack

- Frontend: React 19, Vite, Tailwind CSS, Chart.js (for analytics)
- Backend: Java 21+, Spring Boot 3.x, Spring Data MongoDB
- DB: MongoDB (driver v5.x)
- AI: Gemini / Google Generative Language (via REST) — pluggable configuration in `GeminiClient`
- Auth: JWT (helper utilities in `JwtUtil`) and a basic local `AuthService` for development

---

## Environment variables & important config

The app is configured via environment variables or via `backend/src/main/resources/application-secret.properties` (gitignored). Important variables:

- `SERVER_PORT` — backend port (default 8080)
- `MONGODB_URI` — MongoDB connection string (default `mongodb://localhost:27017/mydb`)
- `jwt.secret` — secret used for signing JWTs (DO NOT COMMIT)
- Gemini / AI-related variables (critical):
	- `GEMINI_API_KEY` or `gemini.api.key` — your Gemini API key (required)
	- `GEMINI_API_URL` or `gemini.api.url` — base Gemini API URL (defaults to Google GL endpoint)
	- `GEMINI_MODEL` or `gemini.model` — model name (e.g., `gemini-2.5-flash`)
	- `CHAT_SYSTEM_PROMPT` — override system prompt for the assistant
	- `CHAT_RATE_LIMIT_PER_SEC` — requests per second rate limit per user (default 2)

Example `application-secret.properties` (create locally, do NOT commit):

```properties
# backend/src/main/resources/application-secret.properties
MONGODB_URI=mongodb://localhost:27017/budgetpilot
GEMINI_API_KEY=sk-REPLACE_WITH_YOURS
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models
GEMINI_MODEL=gemini-2.5-flash
jwt.secret=super-secret-dev-key_change_in_prod
MAIL_USERNAME=you@example.com
MAIL_PASSWORD=super-secret
```

---

## Local development: quick start

### Prerequisites

- Java 17+ (Java 21 recommended) and Maven
- Node.js 18+ and npm or pnpm/yarn
- MongoDB running locally (or set `MONGODB_URI` to your hosted DB)

### Backend

1. From repository root, switch to the backend folder:

```powershell
cd backend
```

2. Build and run (development):

```powershell
# With Maven wrapper if available
.\mvnw.cmd clean compile
.\mvnw.cmd spring-boot:run

# OR with system Maven
mvn clean compile
mvn spring-boot:run
```

3. The backend listens on port `8080` (or `SERVER_PORT`), and exposes endpoints under `/api`.

### Frontend

1. From repo root, switch to frontend directory:

```powershell
cd frontend
```

2. Install dependencies and run dev server:

```powershell
npm install
npm run dev
```

3. Production build:

```powershell
npm run build
```

4. The frontend dev server runs on port 5173 by default.

---

## API endpoints (most-used)

- `POST /api/chat/start` — start a new conversation. Requires Authorization header: `Bearer <token>`.
	- Response contains `conversationId` and an initial `assistantMessage`.

- `POST /api/chat/{id}/message` — send a user message to an existing conversation.
	- Body: `{ "text": "...", "option": "..." }` (either `text` or `option` required)

- `GET /api/chat/{id}` — fetch conversation by ID (ownership validated)

- `POST /api/chat/debug/gemini` — debug endpoint (local only) that sends a prompt directly to Gemini and returns the raw response (handy for diagnosing API key / request issues).

Example cURL to start a conversation (replace token):

```bash
curl -X POST http://localhost:8080/api/chat/start \
	-H "Authorization: Bearer <TOKEN>" \
	-H "Content-Type: application/json" \
	-d '{}'
```

Example cURL to reproduce Gemini raw error (no auth):

```bash
curl -X POST http://localhost:8080/api/chat/debug/gemini \
	-H "Content-Type: application/json" \
	-d '{"prompt":"Diagnostic ping"}'
```

---

## How the Gemini integration works (implementation notes)

- `GeminiClient` constructs a JSON request body and posts it to the configured `gemini.api.url` + `/{model}:generateContent` URI. It sets `Authorization: Bearer <GEMINI_API_KEY>`.
- The client expects candidate text under `candidates[0].content.parts[0].text` but includes fallback behavior if parsing fails.
- `ChatService` builds a compact transaction context (totals, category breakdown, top categories, and recent 5 transactions) and prepends it to the system prompt before calling Gemini.
- `ChatService.parseGeminiResponse(...)` attempts to parse a JSON code-fenced response first (```json ... ```), otherwise it returns the plain text with a fallback confidence score.

---

## Common failure modes & troubleshooting

- **"Gemini API key not configured" or 401/403 errors**:
	- Ensure `GEMINI_API_KEY` is set in environment or `application-secret.properties` and that the key has correct permissions for the chosen model.

- **400 / bad request from Gemini**:
	- The request body shape may not match the Gemini API version expected. Inspect `GeminiClient` and the debug endpoint response to see the raw error and adjust the request schema accordingly.

- **Request size / token limit errors**:
	- If you send too much transaction history, the model may reject the request. `ChatService` builds a summary and includes recent transactions — consider further truncation or summarization.

- **Backend port in use**:
	- If `8080` is in use, set `SERVER_PORT` to an available port or stop the process using port 8080.

---

## Testing

- Unit tests for backend services live under `backend/src/test/java` and are executed with `mvn test`.
- Frontend tests (if present) can be run with `npm test` from the `frontend` directory.

---

## Extending the project

- Add persistent budgets collection in MongoDB to enable full budget enforcement.
- Improve Gemini prompt engineering (system prompt stored in config) for consistent, structured outputs (prefer JSON responses from the model).
- Add streaming responses for long analyses and progressive rendering in the chat UI.

---

## Contributing

- Fork the repo, create a feature branch, and open a pull request. Write clear PR descriptions and include tests for backend logic changes.

---

## License

- This project includes a `LICENSE` file at the repository root. Verify and follow its terms when using or distributing this code.

---

If you'd like, I can also generate a concise `backend/README.md` or API reference from this file, or create a `docs/` set of markdown files by splitting the content above into smaller documents (setup, API, development). Which documentation would you like next?
See `backend/README.md` for backend-specific instructions.
