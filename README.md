# SmartAI CRM

SmartAI CRM is an enterprise-grade AI-powered Customer Relationship Management platform scaffold. The repository is organized for a modular Django REST Framework backend, a React + TypeScript + Tailwind CSS frontend, PostgreSQL persistence, AI service workspaces, and Docker-based local development.

This repository intentionally contains scaffold code only. Business logic, database models, API contracts, and AI models are left as TODOs for future implementation.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React, TypeScript, Tailwind CSS, React Router, Axios, React Query |
| Backend | Django, Django REST Framework, Simple JWT |
| Database | PostgreSQL |
| AI Workspace | OpenAI API, LangChain, Scikit-learn, TensorFlow, FAISS |
| Infrastructure | Docker, Docker Compose, Nginx, GitHub Actions |

## Repository Structure

```text
smart-ai-crm/
├── frontend/        # React + TypeScript + Tailwind application
├── backend/         # Django REST Framework project and CRM apps
├── ai/              # AI assistant, scoring, forecasting, embeddings, and training workspace
├── database/        # Schema, migration notes, seed data, backups, and ERD docs
├── docs/            # Architecture, API, deployment, database, and module design docs
├── deployment/      # Nginx and deployment configuration
├── tests/           # Cross-cutting backend, frontend, API, and AI test planning
├── .github/         # CI workflows
├── docker-compose.yml
├── requirements.txt
├── package.json
├── .env.example
└── LICENSE
```

## Backend Modules

The backend follows the architecture's module boundaries. Each app contains placeholder files for `urls`, `views`, `serializers`, `services`, `repositories`, `models`, and `tests`.

- `authentication`
- `users`
- `leads`
- `contacts`
- `sales`
- `marketing`
- `support`
- `tasks`
- `workflow`
- `assistant`
- `analytics`
- `documents`
- `communication`
- `notifications`

Business logic should be implemented in each module's service layer. Views should remain thin, and repositories should own data-access helpers when needed.

## Frontend Modules

The frontend includes route-level placeholders for every feature area:

- Authentication
- User Management
- Lead Management
- Contact Management
- Sales Pipeline
- Marketing Automation
- Customer Support
- Task Management
- Workflow Engine
- AI Assistant
- Analytics
- Document Management
- Communication Hub
- Notifications

## Getting Started

### 1. Create Environment File

```bash
cp .env.example .env
```

Update `.env` with local secrets and credentials as needed.

### 2. Run with Docker Compose

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

### 3. Run Database Migrations

In a separate terminal:

```bash
docker compose exec backend python manage.py migrate
```

## Local Development Without Docker

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

The backend expects PostgreSQL connection values from `.env` or the shell environment.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Routing

The root Django URL configuration reserves the architecture-defined API namespaces:

```text
/api/auth/
/api/users/
/api/leads/
/api/contacts/
/api/sales/
/api/marketing/
/api/support/
/api/tasks/
/api/workflow/
/api/assistant/
/api/analytics/
/api/documents/
/api/communication/
/api/notifications/
```

Endpoint implementations are intentionally omitted until API contracts are designed.

## Development Rules

- Keep modules independent.
- Put business logic in service-layer files.
- Keep DRF views thin.
- Add database models only after domain design is complete.
- Do not add AI model code without requirements, data definitions, and evaluation criteria.
- Add tests with each implemented feature.

## Project Status

Current status: scaffold complete.

Next implementation steps:

1. Finalize domain models and API contracts per module.
2. Add authentication and RBAC design.
3. Implement one module at a time behind tests.
4. Add API documentation and module design documents under `docs/`.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.
