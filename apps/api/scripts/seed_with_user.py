#!/usr/bin/env python3
"""
Seed comprehensive demo data with a specific user ID
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
        # Delete related data (cascading should handle this, but being explicit)
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

def create_japan_trip(db: Session, user_id: str):
    """Create comprehensive Japan trip with full data"""
    print("\n🇯🇵 Creating Japan Adventure...")

    start_date = date.today() - timedelta(days=7)
    end_date = start_date + timedelta(days=14)

    trip = Trip(
        owner_sub=user_id,
        title="Japan Adventure 🇯🇵",
        destination="Tokyo, Kyoto, Osaka",
        home_currency="USD",
        start_date=start_date,
        end_date=end_date,
        total_budget=5000.00,
        per_diem_budget=180.00
    )
    db.add(trip)
    db.flush()

    # Participants
    alex = Participant(trip_id=trip.id, display_name="Alex", weight=1.0)
    jordan = Participant(trip_id=trip.id, display_name="Jordan", weight=1.0)
    sam = Participant(trip_id=trip.id, display_name="Sam", weight=1.2)
    db.add_all([alex, jordan, sam])
    db.flush()

    # Category budgets
    budgets = [
        CategoryBudget(trip_id=trip.id, category="accommodation", planned_amount=1800.00),
        CategoryBudget(trip_id=trip.id, category="food", planned_amount=1400.00),
        CategoryBudget(trip_id=trip.id, category="transport", planned_amount=800.00),
        CategoryBudget(trip_id=trip.id, category="activities", planned_amount=700.00),
        CategoryBudget(trip_id=trip.id, category="shopping", planned_amount=300.00),
    ]
    db.add_all(budgets)

    # Accommodations
    accommodations = [
        Accommodation(
            trip_id=trip.id, name="Shibuya Grand Hotel", type="hotel",
            check_in_date=start_date, check_out_date=start_date + timedelta(days=5),
            nightly_rate=120.00, total_cost=600.00, currency="USD",
            location_text="Shibuya, Tokyo", lat=35.6595, lng=139.7004,
            confirmation_code="HTL-JP-2024-891", notes="Near Shibuya Crossing, free breakfast"
        ),
        Accommodation(
            trip_id=trip.id, name="Kyoto Ryokan Serenity", type="ryokan",
            check_in_date=start_date + timedelta(days=5), check_out_date=start_date + timedelta(days=9),
            nightly_rate=150.00, total_cost=600.00, currency="USD",
            location_text="Gion, Kyoto", lat=35.0042, lng=135.7731,
            confirmation_code="RYK-KY-445", notes="Traditional Japanese inn with onsen"
        ),
        Accommodation(
            trip_id=trip.id, name="Osaka Central Apartment", type="airbnb",
            check_in_date=start_date + timedelta(days=9), check_out_date=end_date,
            nightly_rate=90.00, total_cost=450.00, currency="USD",
            location_text="Namba, Osaka", lat=34.6660, lng=135.5005,
            confirmation_code="ABB-OSA-7722", notes="Walking distance to Dotonbori"
        ),
    ]
    db.add_all(accommodations)

    # Itinerary items
    itinerary = [
        ItineraryItem(trip_id=trip.id, type="flight", title="SFO → NRT",
            start_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=8),
            end_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=22),
            location_text="San Francisco to Tokyo Narita",
            notes="United Airlines UA837, Seat 24A", conf_code="UA-837-XYZ"),
        ItineraryItem(trip_id=trip.id, type="flight", title="NRT → SFO",
            start_dt=datetime.combine(end_date, datetime.min.time()) + timedelta(hours=14),
            end_dt=datetime.combine(end_date, datetime.min.time()) + timedelta(hours=18),
            location_text="Tokyo Narita to San Francisco",
            notes="United Airlines UA838, Seat 24B", conf_code="UA-838-ABC"),
        ItineraryItem(trip_id=trip.id, type="activity", title="TeamLab Borderless Museum",
            start_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=9),
            end_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=17),
            location_text="Odaiba, Tokyo", lat=35.6247, lng=139.7753,
            notes="Digital art museum - book tickets in advance", conf_code="TLB-8891"),
        ItineraryItem(trip_id=trip.id, type="activity", title="Tsukiji Fish Market Tour",
            start_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=6),
            end_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=12),
            location_text="Tsukiji, Tokyo", lat=35.6654, lng=139.7707,
            notes="Early morning sushi breakfast"),
        ItineraryItem(trip_id=trip.id, type="transport", title="Shinkansen to Kyoto",
            start_dt=datetime.combine(start_date + timedelta(days=5), datetime.min.time()) + timedelta(hours=10),
            end_dt=datetime.combine(start_date + timedelta(days=5), datetime.min.time()) + timedelta(hours=12, minutes=30),
            location_text="Tokyo Station to Kyoto Station", notes="JR Pass, Nozomi Line"),
        ItineraryItem(trip_id=trip.id, type="activity", title="Fushimi Inari Shrine Hike",
            start_dt=datetime.combine(start_date + timedelta(days=6), datetime.min.time()) + timedelta(hours=8),
            end_dt=datetime.combine(start_date + timedelta(days=6), datetime.min.time()) + timedelta(hours=16),
            location_text="Fushimi Ward, Kyoto", lat=34.9671, lng=135.7727,
            notes="Thousands of red torii gates"),
        ItineraryItem(trip_id=trip.id, type="activity", title="Arashiyama Bamboo Grove & Monkey Park",
            start_dt=datetime.combine(start_date + timedelta(days=7), datetime.min.time()) + timedelta(hours=9),
            end_dt=datetime.combine(start_date + timedelta(days=7), datetime.min.time()) + timedelta(hours=15),
            location_text="Arashiyama, Kyoto", lat=35.0094, lng=135.6686,
            notes="Take scenic train, visit monkey sanctuary"),
        ItineraryItem(trip_id=trip.id, type="transport", title="Train to Osaka",
            start_dt=datetime.combine(start_date + timedelta(days=9), datetime.min.time()) + timedelta(hours=11),
            end_dt=datetime.combine(start_date + timedelta(days=9), datetime.min.time()) + timedelta(hours=12),
            location_text="Kyoto to Osaka", notes="JR Special Rapid"),
        ItineraryItem(trip_id=trip.id, type="activity", title="Osaka Castle & Museum",
            start_dt=datetime.combine(start_date + timedelta(days=10), datetime.min.time()) + timedelta(hours=10),
            end_dt=datetime.combine(start_date + timedelta(days=10), datetime.min.time()) + timedelta(hours=16),
            location_text="Chūō-ku, Osaka", lat=34.6873, lng=135.5262,
            notes="Historic castle, beautiful grounds"),
        ItineraryItem(trip_id=trip.id, type="activity", title="Universal Studios Japan",
            start_dt=datetime.combine(start_date + timedelta(days=11), datetime.min.time()) + timedelta(hours=14),
            end_dt=datetime.combine(start_date + timedelta(days=11), datetime.min.time()) + timedelta(hours=18),
            location_text="Konohana Ward, Osaka", lat=34.6654, lng=135.4321,
            notes="Super Nintendo World!", conf_code="USJ-445891"),
    ]
    db.add_all(itinerary)

    # Comprehensive expenses
    expenses_data = [
        (start_date, alex.id, 85.00, "food", "Sushi dinner", "Sukiyabashi Jiro", 35.6704, 139.7632),
        (start_date, jordan.id, 45.00, "transport", "Airport bus", "Tokyo Airport Transport", None, None),
        (start_date, sam.id, 18.00, "food", "Convenience store snacks", "7-Eleven", None, None),
        (start_date + timedelta(days=1), alex.id, 32.00, "activities", "TeamLab tickets", "TeamLab", 35.6247, 139.7753),
        (start_date + timedelta(days=1), jordan.id, 52.00, "food", "Ramen lunch", "Ichiran Shibuya", 35.6595, 139.7004),
        (start_date + timedelta(days=1), sam.id, 125.00, "shopping", "Anime merchandise", "Animate", 35.6983, 139.7731),
        (start_date + timedelta(days=1), alex.id, 68.00, "food", "Izakaya dinner", "Torikizoku", 35.6595, 139.7004),
        (start_date + timedelta(days=2), jordan.id, 95.00, "food", "Tsukiji sushi breakfast", "Sushi Dai", 35.6654, 139.7707),
        (start_date + timedelta(days=2), sam.id, 28.00, "transport", "Metro day pass", "Tokyo Metro", None, None),
        (start_date + timedelta(days=3), alex.id, 180.00, "shopping", "Designer goods", "Ginza Mitsukoshi", 35.6721, 139.7658),
        (start_date + timedelta(days=4), jordan.id, 55.00, "food", "Yakiniku dinner", "Gyukaku", 35.6895, 139.6917),
        (start_date + timedelta(days=6), sam.id, 38.00, "food", "Kaiseki lunch", "Gion Karyo", 35.0042, 135.7731),
        (start_date + timedelta(days=7), alex.id, 22.00, "transport", "Sagano train", "JR Sagano", 35.0094, 135.6686),
        (start_date + timedelta(days=8), jordan.id, 95.00, "activities", "Tea ceremony", "Camellia Tea House", 35.0116, 135.7681),
        (start_date + timedelta(days=10), sam.id, 75.00, "food", "Okonomiyaki dinner", "Kiji", 34.6993, 135.4937),
        (start_date + timedelta(days=11), alex.id, 85.00, "activities", "USJ express pass", "Universal Studios", 34.6654, 135.4321),
    ]

    for exp_date, payer_id, amount, category, note, merchant, lat, lng in expenses_data:
        exp = Expense(
            trip_id=trip.id, payer_id=payer_id, dt=exp_date, amount=amount,
            currency="USD", category=category, note=note, merchant_name=merchant,
            fx_rate_to_home=1.0, lat=lat, lng=lng,
            receipt_urls=[f"https://example.com/receipts/{merchant.replace(' ', '-').lower()}.jpg"] if merchant else None
        )
        db.add(exp)
        db.flush()
        splits = [
            ExpenseSplit(expense_id=exp.id, participant_id=alex.id, share_type="equal"),
            ExpenseSplit(expense_id=exp.id, participant_id=jordan.id, share_type="equal"),
            ExpenseSplit(expense_id=exp.id, participant_id=sam.id, share_type="equal"),
        ]
        db.add_all(splits)

    db.commit()
    print(f"✓ Japan trip created (ID: {trip.id}) with {len(expenses_data)} expenses, {len(itinerary)} itinerary items, {len(accommodations)} accommodations")
    return trip.id

def create_paris_trip(db: Session, user_id: str):
    """Create Paris trip"""
    print("\n🗼 Creating Paris Romance...")

    start_date = date.today() + timedelta(days=30)
    end_date = start_date + timedelta(days=5)

    trip = Trip(
        owner_sub=user_id, title="Paris Romance 🗼",
        destination="Paris, France", home_currency="USD",
        start_date=start_date, end_date=end_date,
        total_budget=3500.00, per_diem_budget=250.00
    )
    db.add(trip)
    db.flush()

    emma = Participant(trip_id=trip.id, display_name="Emma", weight=1.0)
    lucas = Participant(trip_id=trip.id, display_name="Lucas", weight=1.0)
    db.add_all([emma, lucas])
    db.flush()

    budgets = [
        CategoryBudget(trip_id=trip.id, category="accommodation", planned_amount=1200.00),
        CategoryBudget(trip_id=trip.id, category="food", planned_amount=1000.00),
        CategoryBudget(trip_id=trip.id, category="transport", planned_amount=400.00),
        CategoryBudget(trip_id=trip.id, category="activities", planned_amount=600.00),
        CategoryBudget(trip_id=trip.id, category="shopping", planned_amount=300.00),
    ]
    db.add_all(budgets)

    # Accommodation
    hotel = Accommodation(
        trip_id=trip.id, name="Le Marais Boutique Hotel", type="hotel",
        check_in_date=start_date, check_out_date=end_date,
        nightly_rate=200.00, total_cost=1000.00, currency="USD",
        location_text="Le Marais, Paris", lat=48.8566, lng=2.3522,
        confirmation_code="PARIS-HTL-991"
    )
    db.add(hotel)

    # Itinerary
    itinerary = [
        ItineraryItem(trip_id=trip.id, type="flight", title="JFK → CDG",
            start_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=18),
            end_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=8),
            location_text="New York to Paris", conf_code="AF-007-XYZ"),
        ItineraryItem(trip_id=trip.id, type="activity", title="Eiffel Tower",
            start_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=14),
            end_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=17),
            location_text="Champ de Mars, Paris", lat=48.8584, lng=2.2945),
        ItineraryItem(trip_id=trip.id, type="activity", title="Louvre Museum",
            start_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=10),
            end_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=16),
            location_text="Rue de Rivoli, Paris", lat=48.8606, lng=2.3376),
        ItineraryItem(trip_id=trip.id, type="activity", title="Versailles Palace",
            start_dt=datetime.combine(start_date + timedelta(days=3), datetime.min.time()) + timedelta(hours=9),
            end_dt=datetime.combine(start_date + timedelta(days=3), datetime.min.time()) + timedelta(hours=17),
            location_text="Versailles", lat=48.8049, lng=2.1204),
        ItineraryItem(trip_id=trip.id, type="flight", title="CDG → JFK",
            start_dt=datetime.combine(end_date, datetime.min.time()) + timedelta(hours=12),
            end_dt=datetime.combine(end_date, datetime.min.time()) + timedelta(hours=16),
            location_text="Paris to New York", conf_code="AF-008-ABC"),
    ]
    db.add_all(itinerary)

    # Sample expenses
    expenses = [
        Expense(trip_id=trip.id, payer_id=emma.id, dt=start_date + timedelta(days=1),
                amount=120.00, currency="USD", category="food", note="Seine river dinner cruise",
                merchant_name="Bateaux Parisiens", lat=48.8606, lng=2.2944, fx_rate_to_home=1.0),
        Expense(trip_id=trip.id, payer_id=lucas.id, dt=start_date + timedelta(days=2),
                amount=45.00, currency="USD", category="activities", note="Louvre tickets",
                merchant_name="Musée du Louvre", lat=48.8606, lng=2.3376, fx_rate_to_home=1.0),
    ]
    for exp in expenses:
        db.add(exp)
        db.flush()
        db.add_all([
            ExpenseSplit(expense_id=exp.id, participant_id=emma.id, share_type="equal"),
            ExpenseSplit(expense_id=exp.id, participant_id=lucas.id, share_type="equal"),
        ])

    db.commit()
    print(f"✓ Paris trip created (ID: {trip.id})")
    return trip.id

def create_iceland_trip(db: Session, user_id: str):
    """Create Iceland trip"""
    print("\n🏔️ Creating Iceland Road Trip...")

    start_date = date.today() - timedelta(days=45)
    end_date = start_date + timedelta(days=7)

    trip = Trip(
        owner_sub=user_id, title="Iceland Road Trip 🏔️",
        destination="Reykjavik & Ring Road", home_currency="USD",
        start_date=start_date, end_date=end_date,
        total_budget=4000.00, per_diem_budget=200.00
    )
    db.add(trip)
    db.flush()

    maya = Participant(trip_id=trip.id, display_name="Maya", weight=1.0)
    kai = Participant(trip_id=trip.id, display_name="Kai", weight=1.0)
    db.add_all([maya, kai])
    db.flush()

    budgets = [
        CategoryBudget(trip_id=trip.id, category="accommodation", planned_amount=900.00),
        CategoryBudget(trip_id=trip.id, category="food", planned_amount=800.00),
        CategoryBudget(trip_id=trip.id, category="transport", planned_amount=1500.00),
        CategoryBudget(trip_id=trip.id, category="activities", planned_amount=600.00),
    ]
    db.add_all(budgets)

    # Accommodations
    accommodations = [
        Accommodation(trip_id=trip.id, name="Reykjavik Hostel", type="hostel",
            check_in_date=start_date, check_out_date=start_date + timedelta(days=2),
            nightly_rate=60.00, total_cost=120.00, currency="USD",
            location_text="Reykjavik", lat=64.1466, lng=-21.9426),
        Accommodation(trip_id=trip.id, name="Vik Guesthouse", type="guesthouse",
            check_in_date=start_date + timedelta(days=2), check_out_date=start_date + timedelta(days=5),
            nightly_rate=90.00, total_cost=270.00, currency="USD",
            location_text="Vik", lat=63.4186, lng=-19.0059),
        Accommodation(trip_id=trip.id, name="Akureyri Cabin", type="cabin",
            check_in_date=start_date + timedelta(days=5), check_out_date=end_date,
            nightly_rate=100.00, total_cost=200.00, currency="USD",
            location_text="Akureyri", lat=65.6835, lng=-18.1059),
    ]
    db.add_all(accommodations)

    # Itinerary with activities
    itinerary = [
        ItineraryItem(trip_id=trip.id, type="transport", title="Car rental pickup",
            start_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=10),
            end_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=11),
            location_text="Keflavik Airport", conf_code="SIXT-IS-7721"),
        ItineraryItem(trip_id=trip.id, type="activity", title="Blue Lagoon",
            start_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=14),
            end_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=17),
            location_text="Grindavik", lat=63.8804, lng=-22.4495),
        ItineraryItem(trip_id=trip.id, type="activity", title="Golden Circle Tour",
            start_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=9),
            end_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=18),
            location_text="Thingvellir, Geysir, Gullfoss", lat=64.2558, lng=-20.0284),
        ItineraryItem(trip_id=trip.id, type="activity", title="Seljalandsfoss Waterfall",
            start_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=11),
            end_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=13),
            location_text="South Coast", lat=63.6156, lng=-19.9886),
        ItineraryItem(trip_id=trip.id, type="activity", title="Skogafoss Waterfall",
            start_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=14),
            end_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=16),
            location_text="South Coast", lat=63.5319, lng=-19.5108),
        ItineraryItem(trip_id=trip.id, type="activity", title="Black Sand Beach",
            start_dt=datetime.combine(start_date + timedelta(days=3), datetime.min.time()) + timedelta(hours=10),
            end_dt=datetime.combine(start_date + timedelta(days=3), datetime.min.time()) + timedelta(hours=12),
            location_text="Reynisfjara", lat=63.4040, lng=-19.0449),
        ItineraryItem(trip_id=trip.id, type="activity", title="Jokulsarlon Glacier Lagoon",
            start_dt=datetime.combine(start_date + timedelta(days=4), datetime.min.time()) + timedelta(hours=9),
            end_dt=datetime.combine(start_date + timedelta(days=4), datetime.min.time()) + timedelta(hours=14),
            location_text="Southeast Iceland", lat=64.0784, lng=-16.2306),
        ItineraryItem(trip_id=trip.id, type="activity", title="Northern Lights hunt",
            start_dt=datetime.combine(start_date + timedelta(days=5), datetime.min.time()) + timedelta(hours=22),
            end_dt=datetime.combine(start_date + timedelta(days=6), datetime.min.time()) + timedelta(hours=1),
            location_text="Near Akureyri"),
    ]
    db.add_all(itinerary)

    # Expenses
    expenses_data = [
        (start_date, maya.id, 450.00, "transport", "7-day car rental", "Sixt", None, None),
        (start_date, kai.id, 75.00, "activities", "Blue Lagoon tickets", "Blue Lagoon", 63.8804, -22.4495),
        (start_date + timedelta(days=1), maya.id, 95.00, "food", "Farm-to-table dinner", "Fridheimar", None, None),
        (start_date + timedelta(days=2), kai.id, 180.00, "transport", "Gas for road trip", "N1", None, None),
        (start_date + timedelta(days=3), maya.id, 65.00, "food", "Seafood lunch", "The Soup Company", None, None),
        (start_date + timedelta(days=4), kai.id, 120.00, "activities", "Glacier lagoon boat tour", "Jokulsarlon Tours", 64.0784, -16.2306),
        (start_date + timedelta(days=5), maya.id, 55.00, "food", "Hot dogs at famous stand", "Baejarins Beztu", 64.1478, -21.9450),
    ]

    for exp_date, payer_id, amount, category, note, merchant, lat, lng in expenses_data:
        exp = Expense(
            trip_id=trip.id, payer_id=payer_id, dt=exp_date, amount=amount,
            currency="USD", category=category, note=note, merchant_name=merchant,
            fx_rate_to_home=1.0, lat=lat, lng=lng,
            receipt_urls=[f"https://example.com/receipts/iceland-{merchant.replace(' ', '-').lower()}.jpg"] if merchant else None
        )
        db.add(exp)
        db.flush()
        splits = [
            ExpenseSplit(expense_id=exp.id, participant_id=maya.id, share_type="equal"),
            ExpenseSplit(expense_id=exp.id, participant_id=kai.id, share_type="equal"),
        ]
        db.add_all(splits)

    db.commit()
    print(f"✓ Iceland trip created (ID: {trip.id}) with {len(expenses_data)} expenses")
    return trip.id

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python seed_with_user.py <user_id>")
        print("Example: python seed_with_user.py 76dd3007-4bea-47c2-bed0-bee4ed13e48f")
        sys.exit(1)

    user_id = sys.argv[1]

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print(f"\n🌍 Seeding comprehensive demo data for user: {user_id}")
        print("=" * 60)

        # Create user profile
        create_user_profile(db, user_id)

        # Clear existing data
        clear_user_data(db, user_id)

        # Create all three trips
        create_japan_trip(db, user_id)
        create_paris_trip(db, user_id)
        create_iceland_trip(db, user_id)

        print("\n" + "=" * 60)
        print("✨ Demo data seeding completed successfully!")
        print(f"\nCreated 3 comprehensive trips for user {user_id}")
        print("  - Japan Adventure (ongoing, 14 days)")
        print("  - Paris Romance (upcoming, 5 days)")
        print("  - Iceland Road Trip (past, 7 days)")
        print("\n✅ All done! Refresh your browser to see the trips.")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
