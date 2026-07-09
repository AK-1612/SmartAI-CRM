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

Update `.env` with local secrets and credentials as needed. Make sure to specify `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` values.

### 2. Run with Docker Compose

```bash
docker compose up --build
```

Services:

- **Frontend**: `http://localhost:5173` (React application)
- **Backend (FastAPI + Django)**: `http://localhost:8000` (FastAPI handles core routes; Django mounts as a fallback handler under `/` to serve the rest of the endpoints)
- **PostgreSQL**: `localhost:5432` (Shared database)

### 3. Run Database Migrations

For Django migrations:
```bash
docker compose exec backend python manage.py migrate
```

For SQLAlchemy/FastAPI migrations (Alembic):
```bash
docker compose exec backend alembic upgrade head
```

---

## Local Development Without Docker

### Unified Backend (FastAPI + Django)

1. Activate your virtual environment and install the dependencies:
```bash
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

2. Run the database migrations:
```bash
# Django Migrations
python backend/manage.py migrate

# Alembic Migrations
cd backend && alembic upgrade head
```

3. Start the unified FastAPI + Django application:
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

*Note: FastAPI handles contacts, deals, campaigns, notifications, and auth endpoints. Unmatched endpoints fall back to the Django WSGI layer (e.g. leads, workflow, support, analytics, assistant, communication).*

### React Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing the Application

The CRM has test configurations for both backend frameworks:

### 1. Testing Django Apps
To run unit and integration tests for the Django modules (Leads, Assistant, Communication, Workflow, Support, Analytics):
```bash
python backend/manage.py test
```

### 2. Testing FastAPI Router
To run tests for the FastAPI router (Auth, Contacts, Activities, Documents, Dashboard, Deals, Campaigns, Notifications):
```bash
cd backend
pytest
```

---

## Project Status

Current status: **Core Modules and Integrations Complete**. 
The main branch contains all implemented backend routers, unified layout menus, and floating AI speech assistant capabilities.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

