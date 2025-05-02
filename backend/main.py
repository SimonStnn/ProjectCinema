from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.api.routes import auth, movies, bookings, cinemas, users, admin
from app.core.config import settings
from app.core.mqtt_client import setup_mqtt_for_app

app = FastAPI(
    title="Project Cinema API",
    description="Cinema booking system API with real-time seat reservations",
    version="0.1.0",
)

# Set up CORS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
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

# Include API routers
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["authentication"])
app.include_router(movies.router, prefix=settings.API_V1_STR, tags=["movies"])
app.include_router(bookings.router, prefix=settings.API_V1_STR, tags=["bookings"])
app.include_router(cinemas.router, prefix=settings.API_V1_STR, tags=["cinemas"])
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["users"])
app.include_router(admin.router, prefix=settings.API_V1_STR, tags=["admin"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Project Cinema API"} 
