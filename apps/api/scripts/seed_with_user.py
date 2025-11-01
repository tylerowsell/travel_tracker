#!/usr/bin/env python3
"""
Seed demo data with a specific user ID
Usage: python seed_with_user.py <user_id>
Example: python seed_with_user.py 76dd3007-4bea-47c2-bed0-bee4ed13e48f
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
from models import (
    Trip, Participant, Expense, ExpenseSplit, ItineraryItem,
    CategoryBudget, Accommodation, Settlement, ExchangeRate,
    UserProfile
)

def create_user_profile(db: Session, user_id: str, email: str = "user@example.com"):
    """Create or update user profile"""
    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()

    if not user:
        user = UserProfile(
            id=user_id,
            email=email,
            display_name=email.split('@')[0],
            avatar_url=None,
            bio=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        print(f"✓ Created user profile for {user_id}")
    else:
        print(f"✓ User profile already exists for {user_id}")

    return user

def clear_user_data(db: Session, user_id: str):
    """Clear all data for a specific user"""
    # Get all trips owned by this user
    trips = db.query(Trip).filter(Trip.owner_sub == user_id).all()
    trip_ids = [trip.id for trip in trips]

    if trip_ids:
        # Delete related data
        db.query(Settlement).filter(Settlement.trip_id.in_(trip_ids)).delete(synchronize_session=False)
        db.query(ExpenseSplit).filter(ExpenseSplit.expense_id.in_(
            db.query(Expense.id).filter(Expense.trip_id.in_(trip_ids))
        )).delete(synchronize_session=False)
        db.query(Expense).filter(Expense.trip_id.in_(trip_ids)).delete(synchronize_session=False)
        db.query(ItineraryItem).filter(ItineraryItem.trip_id.in_(trip_ids)).delete(synchronize_session=False)
        db.query(CategoryBudget).filter(CategoryBudget.trip_id.in_(trip_ids)).delete(synchronize_session=False)
        db.query(Accommodation).filter(Accommodation.trip_id.in_(trip_ids)).delete(synchronize_session=False)
        db.query(Participant).filter(Participant.trip_id.in_(trip_ids)).delete(synchronize_session=False)
        db.query(Trip).filter(Trip.id.in_(trip_ids)).delete(synchronize_session=False)
        db.commit()
        print(f"✓ Cleared {len(trip_ids)} existing trips for user {user_id}")

def seed_demo_trips(db: Session, user_id: str):
    """Create demo trips for the specified user"""
    print(f"\n🌍 Creating demo trips for user: {user_id}")
    print("=" * 60)

    # Import the original seed functions but modify owner_sub
    # Japan trip (ongoing)
    start_date = date.today() - timedelta(days=7)
    end_date = start_date + timedelta(days=14)

    japan = Trip(
        owner_sub=user_id,
        title="Japan Adventure 🇯🇵",
        destination="Tokyo, Kyoto, Osaka",
        home_currency="USD",
        start_date=start_date,
        end_date=end_date,
        total_budget=5000.00,
        per_diem_budget=180.00
    )
    db.add(japan)
    db.flush()

    # Add some participants
    alex = Participant(trip_id=japan.id, display_name="Alex", weight=1.0)
    jordan = Participant(trip_id=japan.id, display_name="Jordan", weight=1.0)
    sam = Participant(trip_id=japan.id, display_name="Sam", weight=1.2)
    db.add_all([alex, jordan, sam])
    db.flush()

    # Add category budgets
    budgets = [
        CategoryBudget(trip_id=japan.id, category="accommodation", planned_amount=1800.00),
        CategoryBudget(trip_id=japan.id, category="food", planned_amount=1400.00),
        CategoryBudget(trip_id=japan.id, category="transport", planned_amount=800.00),
        CategoryBudget(trip_id=japan.id, category="activities", planned_amount=700.00),
        CategoryBudget(trip_id=japan.id, category="shopping", planned_amount=300.00),
    ]
    db.add_all(budgets)

    # Add a few expenses
    expenses = [
        Expense(trip_id=japan.id, payer_id=alex.id, dt=start_date, amount=85.00, currency="USD",
                category="food", note="Sushi dinner", merchant_name="Sukiyabashi Jiro", fx_rate_to_home=1.0),
        Expense(trip_id=japan.id, payer_id=jordan.id, dt=start_date + timedelta(days=1), amount=32.00, currency="USD",
                category="activities", note="TeamLab tickets", merchant_name="TeamLab", fx_rate_to_home=1.0),
        Expense(trip_id=japan.id, payer_id=sam.id, dt=start_date + timedelta(days=2), amount=125.00, currency="USD",
                category="shopping", note="Anime merchandise", merchant_name="Animate", fx_rate_to_home=1.0),
    ]
    for exp in expenses:
        db.add(exp)
        db.flush()
        # Add splits
        splits = [
            ExpenseSplit(expense_id=exp.id, participant_id=alex.id, share_type="equal"),
            ExpenseSplit(expense_id=exp.id, participant_id=jordan.id, share_type="equal"),
            ExpenseSplit(expense_id=exp.id, participant_id=sam.id, share_type="equal"),
        ]
        db.add_all(splits)

    db.commit()
    print(f"✓ Created Japan trip (ID: {japan.id}) with {len(expenses)} expenses")

    # Paris trip (upcoming)
    start_date_paris = date.today() + timedelta(days=30)
    end_date_paris = start_date_paris + timedelta(days=5)

    paris = Trip(
        owner_sub=user_id,
        title="Paris Romance 🗼",
        destination="Paris, France",
        home_currency="USD",
        start_date=start_date_paris,
        end_date=end_date_paris,
        total_budget=3500.00,
        per_diem_budget=250.00
    )
    db.add(paris)
    db.flush()

    emma = Participant(trip_id=paris.id, display_name="Emma", weight=1.0)
    lucas = Participant(trip_id=paris.id, display_name="Lucas", weight=1.0)
    db.add_all([emma, lucas])
    db.flush()

    budgets_paris = [
        CategoryBudget(trip_id=paris.id, category="accommodation", planned_amount=1200.00),
        CategoryBudget(trip_id=paris.id, category="food", planned_amount=1000.00),
        CategoryBudget(trip_id=paris.id, category="transport", planned_amount=400.00),
        CategoryBudget(trip_id=paris.id, category="activities", planned_amount=600.00),
    ]
    db.add_all(budgets_paris)
    db.commit()
    print(f"✓ Created Paris trip (ID: {paris.id})")

    # Iceland trip (past)
    start_date_iceland = date.today() - timedelta(days=45)
    end_date_iceland = start_date_iceland + timedelta(days=7)

    iceland = Trip(
        owner_sub=user_id,
        title="Iceland Road Trip 🏔️",
        destination="Reykjavik & Ring Road",
        home_currency="USD",
        start_date=start_date_iceland,
        end_date=end_date_iceland,
        total_budget=4000.00,
        per_diem_budget=200.00
    )
    db.add(iceland)
    db.flush()

    maya = Participant(trip_id=iceland.id, display_name="Maya", weight=1.0)
    kai = Participant(trip_id=iceland.id, display_name="Kai", weight=1.0)
    db.add_all([maya, kai])
    db.flush()

    budgets_iceland = [
        CategoryBudget(trip_id=iceland.id, category="accommodation", planned_amount=900.00),
        CategoryBudget(trip_id=iceland.id, category="food", planned_amount=800.00),
        CategoryBudget(trip_id=iceland.id, category="transport", planned_amount=1500.00),
    ]
    db.add_all(budgets_iceland)
    db.commit()
    print(f"✓ Created Iceland trip (ID: {iceland.id})")

    print("\n" + "=" * 60)
    print("✨ Demo data seeding completed successfully!")
    print(f"\nCreated 3 trips for user {user_id}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python seed_with_user.py <user_id>")
        print("Example: python seed_with_user.py 76dd3007-4bea-47c2-bed0-bee4ed13e48f")
        sys.exit(1)

    user_id = sys.argv[1]

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create user profile if it doesn't exist
        create_user_profile(db, user_id)

        # Clear existing data for this user
        clear_user_data(db, user_id)

        # Seed new demo trips
        seed_demo_trips(db, user_id)

        print("\n✅ All done! Refresh your browser to see the trips.")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
