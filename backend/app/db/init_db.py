from sqlalchemy.ext.asyncio import AsyncSession
import logging
from sqlalchemy.sql import text

from app.db.session import AsyncSessionLocal, engine, Base

# Import all models at once to ensure proper initialization order
from app.models import *
from app.db.seed_data import create_sample_data

logger = logging.getLogger(__name__)


async def create_tables():
    """Create database tables from SQLAlchemy models."""
    logger.info("Creating database tables...")
    async with engine.begin() as conn:
        # Drop all tables if they exist
        # await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully!")


async def check_connection():
    """Test database connection."""
    logger.info("Testing database connection...")
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            logger.info("Database connection successful: %s", result.scalar())
            return True
    except Exception as e:
        logger.error("Database connection failed: %s", str(e))
        return False


async def init_db():
    """Initialize database."""
    connection_ok = await check_connection()
    if connection_ok:
        await create_tables()
        # Add sample data for development
        await create_sample_data()
    else:
        logger.error("Database initialization skipped due to connection failure")
