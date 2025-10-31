#!/usr/bin/env python3
"""
Script to list all user IDs in the database
"""
import os
from sqlalchemy import create_engine, text

# Get database URL from environment or use default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://travel_user:travel_pass@localhost:5432/travel_tracker"
)

def list_users():
    """List all users in the database"""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Get all unique user_subs from trips
        print("=== Users from trips table ===")
        result = conn.execute(
            text("SELECT DISTINCT owner_sub, COUNT(*) as trip_count FROM trips GROUP BY owner_sub")
        )
        for row in result:
            print(f"User Sub: {row.owner_sub}")
            print(f"  Trips owned: {row.trip_count}")
            print()

        # Get all users from users table
        print("\n=== Users from users table ===")
        result = conn.execute(
            text("SELECT id, email, display_name FROM users")
        )
        for row in result:
            print(f"User ID: {row.id}")
            print(f"  Email: {row.email}")
            print(f"  Name: {row.display_name}")
            print()

if __name__ == "__main__":
    list_users()
