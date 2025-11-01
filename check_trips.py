#!/usr/bin/env python3
"""
Quick diagnostic script to check trip ownership in the database
"""
import os
import sys

# Add the API directory to the path
sys.path.insert(0, '/home/user/travel_tracker/apps/api')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = "postgresql+psycopg://tracker:tracker@localhost:5432/tracker"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_trips():
    db = SessionLocal()
    try:
        # Check all trips
        result = db.execute("SELECT id, title, owner_sub FROM trips ORDER BY id")
        trips = result.fetchall()

        print("\n=== ALL TRIPS IN DATABASE ===")
        if not trips:
            print("No trips found in database!")
        else:
            for trip in trips:
                print(f"Trip ID: {trip[0]}, Title: {trip[1]}, Owner: {trip[2]}")

        print(f"\nTotal trips: {len(trips)}")

        # Count by owner
        result = db.execute("SELECT owner_sub, COUNT(*) FROM trips GROUP BY owner_sub")
        owners = result.fetchall()
        print("\n=== TRIPS BY OWNER ===")
        for owner, count in owners:
            print(f"Owner: {owner}, Count: {count}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_trips()
