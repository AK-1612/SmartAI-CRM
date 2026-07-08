from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import activities, auth, contacts, dashboard, documents, ml
from app.core.config import settings
from app.core.database import Base, engine

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="AI CRM Contact Management API",
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

for router in (auth.router, contacts.router, activities.router, dashboard.router, ml.router, documents.router):
    app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"message": "AI CRM Backend Running Successfully"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
