"""
Add row and number columns to seat_reservations table
"""

from sqlalchemy import Column, String, Integer, MetaData, Table, create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings
import os

# Get database URL as a string from environment or settings
db_url = os.environ.get("DATABASE_URL") or str(settings.DATABASE_URL)

# Create engine connection
engine = create_engine(db_url)
metadata = MetaData()


def run_migration():
    print(
        "Running migration to add row and number columns to seat_reservations table..."
    )

    # Create separate connections for each operation to avoid transaction issues
    # Add row column
    with engine.connect() as connection:
        try:
            # First try to check if the column exists (in its own transaction)
            result = connection.execute(
                text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = 'seat_reservations' AND column_name = 'row'"
                )
            )
            if result.rowcount == 0:
                # Column doesn't exist, add it (in a fresh transaction)
                connection.execute(
                    text(
                        "ALTER TABLE seat_reservations ADD COLUMN row VARCHAR NOT NULL DEFAULT 'A'"
                    )
                )
                connection.commit()
                print("Added 'row' column to seat_reservations table")
            else:
                print("Column 'row' already exists, skipping...")
        except Exception as e:
            print(f"Error working with 'row' column: {e}")
            connection.rollback()

    # Add number column in a separate connection/transaction
    with engine.connect() as connection:
        try:
            # First try to check if the column exists
            result = connection.execute(
                text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = 'seat_reservations' AND column_name = 'number'"
                )
            )
            if result.rowcount == 0:
                # Column doesn't exist, add it
                connection.execute(
                    text(
                        "ALTER TABLE seat_reservations ADD COLUMN number INTEGER NOT NULL DEFAULT 1"
                    )
                )
                connection.commit()
                print("Added 'number' column to seat_reservations table")
            else:
                print("Column 'number' already exists, skipping...")
        except Exception as e:
            print(f"Error working with 'number' column: {e}")
            connection.rollback()

    print("Migration completed!")


if __name__ == "__main__":
    print(f"Using database URL: {db_url}")
    run_migration()
