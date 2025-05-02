from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from app.core.config import settings

# Convert standard PostgreSQL URL to async format
postgres_url = str(settings.DATABASE_URL)
async_postgres_url = postgres_url.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
engine = create_async_engine(
    async_postgres_url,
    echo=False,
    future=True,
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for SQLAlchemy models
Base = declarative_base()


# Dependency for FastAPI endpoints
async def get_db():
    """
    Get database session dependency
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
