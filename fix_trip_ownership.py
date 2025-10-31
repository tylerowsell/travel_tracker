#!/usr/bin/env python3
"""
Script to update trip ownership from dev-user-sub to actual user ID
"""
import os
import sys
from sqlalchemy import create_engine, text

# Get database URL from environment or use default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://travel_user:travel_pass@localhost:5432/travel_tracker"
)

def fix_ownership(old_user_sub: str, new_user_sub: str):
    """Update all trips owned by old_user_sub to new_user_sub"""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()

        try:
            # Update trips table
            result = conn.execute(
                text("UPDATE trips SET owner_sub = :new_sub WHERE owner_sub = :old_sub"),
                {"old_sub": old_user_sub, "new_sub": new_user_sub}
            )
            trips_updated = result.rowcount

            # Update trip_members table for owner entries
            result = conn.execute(
                text("UPDATE trip_members SET user_id = :new_sub WHERE user_id = :old_sub"),
                {"old_sub": old_user_sub, "new_sub": new_user_sub}
            )
            members_updated = result.rowcount

            # Update participants table
            result = conn.execute(
                text("UPDATE participants SET user_sub = :new_sub WHERE user_sub = :old_sub"),
                {"old_sub": old_user_sub, "new_sub": new_user_sub}
            )
            participants_updated = result.rowcount

            # Update trip_invites created_by
            result = conn.execute(
                text("UPDATE trip_invites SET created_by = :new_sub WHERE created_by = :old_sub"),
                {"old_sub": old_user_sub, "new_sub": new_user_sub}
            )
            invites_updated = result.rowcount

            # Commit transaction
            trans.commit()

            print(f"✅ Successfully updated ownership:")
            print(f"   - Trips: {trips_updated}")
            print(f"   - Trip members: {members_updated}")
            print(f"   - Participants: {participants_updated}")
            print(f"   - Invites: {invites_updated}")
            print(f"\nChanged from: {old_user_sub}")
            print(f"          to: {new_user_sub}")

        except Exception as e:
            trans.rollback()
            print(f"❌ Error: {e}")
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python fix_trip_ownership.py <old_user_sub> <new_user_sub>")
        print("\nExample:")
        print("  python fix_trip_ownership.py dev-user-sub abc123-real-user-id")
        sys.exit(1)

    old_sub = sys.argv[1]
    new_sub = sys.argv[2]

    print(f"⚠️  This will update all trips and related data from '{old_sub}' to '{new_sub}'")
    confirm = input("Are you sure? (yes/no): ")

    if confirm.lower() == "yes":
        fix_ownership(old_sub, new_sub)
    else:
        print("Cancelled.")
