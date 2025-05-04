from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import asyncio

from app.api.routes import auth, movies, bookings, cinemas, users, admin, showings
from app.core.config import settings
from app.core.mqtt_client import setup_mqtt_for_app
from app.db.init_db import init_db

app = FastAPI(
    title="Project Cinema API",
    description="Cinema booking system API with real-time seat reservations",
    version="0.1.0",
)

# Set up CORS
# if settings.CORS_ORIGINS:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    # allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
    # allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.ENVIRONMENT != "development":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
    )

# Set up MQTT client
setup_mqtt_for_app(app)


# Add startup event to initialize database
@app.on_event("startup")
async def startup_db_client():
    await init_db()


# Include API routers
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["authentication"])
app.include_router(movies.router, prefix=settings.API_V1_STR, tags=["movies"])
app.include_router(bookings.router, prefix=settings.API_V1_STR, tags=["bookings"])
app.include_router(cinemas.router, prefix=settings.API_V1_STR, tags=["cinema"])
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["users"])
app.include_router(admin.router, prefix=settings.API_V1_STR, tags=["admin"])
app.include_router(showings.router, prefix=settings.API_V1_STR, tags=["showings"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Project Cinema API"}
