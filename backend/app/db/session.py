from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import logging

from app.core.config import settings

# Set up logger
logger = logging.getLogger(__name__)

# Convert standard PostgreSQL URL to async format
postgres_url = str(settings.DATABASE_URL)
async_postgres_url = postgres_url.replace("postgresql://", "postgresql+asyncpg://")

logger.info(
    "Configuring database connection to %s",
    postgres_url.split('@')[1] if '@' in postgres_url else 'database'
)

# Create async engine
engine = create_async_engine(
    async_postgres_url,
    echo=False,
    future=True,
)

# Create async session factory

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)

# Base class for SQLAlchemy models
Base = declarative_base()


# Dependency for FastAPI endpoints
async def get_db():
    """
    Get database session dependency
    """
    logger.info("Opening new database connection")
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            logger.info("Closing database connection")
            await session.close()
