from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.wsgi import WSGIMiddleware
from app.api.routes import activities, auth, contacts, dashboard, documents, ml, sales, marketing, notifications
from app.core.config import settings
from app.core.database import Base, engine

import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from config.wsgi import application as django_wsgi_app

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="AI CRM Unified API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FastAPI routes (Auth, Contacts, Activities, Dashboard, ML, Documents, Sales, Marketing, Notifications)
for router in (auth.router, contacts.router, activities.router, dashboard.router, ml.router, documents.router, sales.router, marketing.router, notifications.router):
    app.include_router(router, prefix="/api")


# Fallback for all other routes to Django WSGI application
app.mount("/", WSGIMiddleware(django_wsgi_app))

