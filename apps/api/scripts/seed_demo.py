import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
from models import (
    Trip, Participant, Expense, ExpenseSplit, ItineraryItem,
    CategoryBudget, Accommodation, Settlement, ExchangeRate
)
import random

def clear_data(db: Session):
    """Clear all existing data"""
    db.query(Settlement).delete()
    db.query(ExpenseSplit).delete()
    db.query(Expense).delete()
    db.query(ItineraryItem).delete()
    db.query(CategoryBudget).delete()
    db.query(Accommodation).delete()
    db.query(Participant).delete()
    db.query(Trip).delete()
    db.query(ExchangeRate).delete()
    db.commit()
    print("✓ Cleared existing data")

def create_japan_trip(db: Session):
    """Create a comprehensive Japan trip with full data"""
    print("\n🇯🇵 Creating Japan Adventure...")

    # Create trip (2 weeks in Japan)
    start_date = date.today() - timedelta(days=7)
    end_date = start_date + timedelta(days=14)

    trip = Trip(
        owner_sub="dev-user-sub",
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

    # Create participants
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
            trip_id=trip.id,
            name="Shibuya Grand Hotel",
            type="hotel",
            check_in_date=start_date,
            check_out_date=start_date + timedelta(days=5),
            nightly_rate=120.00,
            total_cost=600.00,
            currency="USD",
            location_text="Shibuya, Tokyo",
            lat=35.6595,
            lng=139.7004,
            confirmation_code="HTL-JP-2024-891",
            notes="Near Shibuya Crossing, free breakfast"
        ),
        Accommodation(
            trip_id=trip.id,
            name="Kyoto Ryokan Serenity",
            type="ryokan",
            check_in_date=start_date + timedelta(days=5),
            check_out_date=start_date + timedelta(days=9),
            nightly_rate=150.00,
            total_cost=600.00,
            currency="USD",
            location_text="Gion, Kyoto",
            lat=35.0042,
            lng=135.7731,
            confirmation_code="RYK-KY-445",
            notes="Traditional Japanese inn with onsen"
        ),
        Accommodation(
            trip_id=trip.id,
            name="Osaka Central Apartment",
            type="airbnb",
            check_in_date=start_date + timedelta(days=9),
            check_out_date=end_date,
            nightly_rate=90.00,
            total_cost=450.00,
            currency="USD",
            location_text="Namba, Osaka",
            lat=34.6660,
            lng=135.5005,
            confirmation_code="ABB-OSA-7722",
            notes="Walking distance to Dotonbori"
        ),
    ]
    db.add_all(accommodations)

    # Itinerary items
    itinerary = [
        # Flights
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=8),
            end_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=22),
            type="flight",
            title="SFO → NRT",
            location_text="San Francisco to Tokyo Narita",
            notes="United Airlines UA837, Seat 24A",
            conf_code="UA-837-XYZ"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(end_date, datetime.min.time()) + timedelta(hours=14),
            end_dt=datetime.combine(end_date, datetime.min.time()) + timedelta(hours=18),
            type="flight",
            title="NRT → SFO",
            location_text="Tokyo Narita to San Francisco",
            notes="United Airlines UA838, Seat 24B",
            conf_code="UA-838-ABC"
        ),
        # Activities in Tokyo
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=9),
            end_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=17),
            type="activity",
            title="TeamLab Borderless Museum",
            location_text="Odaiba, Tokyo",
            lat=35.6247,
            lng=139.7753,
            notes="Digital art museum - book tickets in advance",
            conf_code="TLB-8891"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=6),
            end_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=12),
            type="activity",
            title="Tsukiji Fish Market Tour",
            location_text="Tsukiji, Tokyo",
            lat=35.6654,
            lng=139.7707,
            notes="Early morning sushi breakfast"
        ),
        # Train to Kyoto
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=5), datetime.min.time()) + timedelta(hours=10),
            end_dt=datetime.combine(start_date + timedelta(days=5), datetime.min.time()) + timedelta(hours=12, minutes=30),
            type="transport",
            title="Shinkansen to Kyoto",
            location_text="Tokyo Station to Kyoto Station",
            notes="JR Pass, Nozomi Line"
        ),
        # Kyoto activities
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=6), datetime.min.time()) + timedelta(hours=8),
            end_dt=datetime.combine(start_date + timedelta(days=6), datetime.min.time()) + timedelta(hours=16),
            type="activity",
            title="Fushimi Inari Shrine Hike",
            location_text="Fushimi Ward, Kyoto",
            lat=34.9671,
            lng=135.7727,
            notes="Thousands of red torii gates"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=7), datetime.min.time()) + timedelta(hours=9),
            end_dt=datetime.combine(start_date + timedelta(days=7), datetime.min.time()) + timedelta(hours=15),
            type="activity",
            title="Arashiyama Bamboo Grove & Monkey Park",
            location_text="Arashiyama, Kyoto",
            lat=35.0094,
            lng=135.6686,
            notes="Take scenic train, visit monkey sanctuary"
        ),
        # Train to Osaka
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=9), datetime.min.time()) + timedelta(hours=11),
            end_dt=datetime.combine(start_date + timedelta(days=9), datetime.min.time()) + timedelta(hours=12),
            type="transport",
            title="Train to Osaka",
            location_text="Kyoto to Osaka",
            notes="JR Special Rapid"
        ),
        # Osaka activities
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=10), datetime.min.time()) + timedelta(hours=10),
            end_dt=datetime.combine(start_date + timedelta(days=10), datetime.min.time()) + timedelta(hours=16),
            type="activity",
            title="Osaka Castle & Museum",
            location_text="Chūō-ku, Osaka",
            lat=34.6873,
            lng=135.5262,
            notes="Historic castle, beautiful grounds"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=11), datetime.min.time()) + timedelta(hours=14),
            end_dt=datetime.combine(start_date + timedelta(days=11), datetime.min.time()) + timedelta(hours=18),
            type="activity",
            title="Universal Studios Japan",
            location_text="Konohana Ward, Osaka",
            lat=34.6654,
            lng=135.4321,
            notes="Super Nintendo World!",
            conf_code="USJ-445891"
        ),
    ]
    db.add_all(itinerary)

    # Expenses - spread across the trip
    expenses_data = [
        # Day 1 - Tokyo arrival
        (start_date, alex.id, 85.00, "food", "Sushi dinner at Sukiyabashi Jiro", "Sukiyabashi Jiro", 35.6704, 139.7632),
        (start_date, jordan.id, 45.00, "transport", "Airport limousine bus to hotel", "Tokyo Airport Transport", None, None),
        (start_date, sam.id, 18.00, "food", "Convenience store snacks", "7-Eleven", None, None),

        # Day 2 - Tokyo
        (start_date + timedelta(days=1), alex.id, 32.00, "activities", "TeamLab Borderless tickets", "TeamLab", 35.6247, 139.7753),
        (start_date + timedelta(days=1), jordan.id, 52.00, "food", "Ramen lunch at Ichiran", "Ichiran Shibuya", 35.6595, 139.7004),
        (start_date + timedelta(days=1), sam.id, 125.00, "shopping", "Anime merchandise in Akihabara", "Animate", 35.6983, 139.7731),
        (start_date + timedelta(days=1), alex.id, 68.00, "food", "Izakaya dinner and drinks", "Torikizoku", 35.6595, 139.7004),

        # Day 3 - Tokyo
        (start_date + timedelta(days=2), jordan.id, 95.00, "food", "Tsukiji fish market sushi breakfast", "Sushi Dai", 35.6654, 139.7707),
        (start_date + timedelta(days=2), sam.id, 28.00, "transport", "Tokyo Metro day pass (3 people)", "Tokyo Metro", None, None),
        (start_date + timedelta(days=2), alex.id, 42.00, "activities", "Senso-ji Temple area", "Asakusa", 35.7148, 139.7967),
        (start_date + timedelta(days=2), jordan.id, 88.00, "food", "Kaiseki dinner", "Kikunoi", 35.6595, 139.7004),

        # Day 4 - Tokyo
        (start_date + timedelta(days=3), sam.id, 156.00, "shopping", "Camera gear at Yodobashi", "Yodobashi Camera", 35.6895, 139.7018),
        (start_date + timedelta(days=3), alex.id, 38.00, "food", "Tempura lunch", "Tsunahachi", 35.6938, 139.7036),
        (start_date + timedelta(days=3), jordan.id, 45.00, "activities", "Meiji Shrine and Harajuku", "Meiji Jingu", 35.6764, 139.6993),
        (start_date + timedelta(days=3), sam.id, 72.00, "food", "Yakiniku dinner", "Gyukaku", 35.6595, 139.7004),

        # Day 5 - Travel to Kyoto
        (start_date + timedelta(days=5), alex.id, 380.00, "transport", "Shinkansen tickets to Kyoto (3 people)", "JR Central", None, None),
        (start_date + timedelta(days=5), jordan.id, 35.00, "food", "Ekiben lunch boxes on train", "Tokyo Station", None, None),

        # Day 6 - Kyoto
        (start_date + timedelta(days=6), sam.id, 25.00, "transport", "Bus day passes", "Kyoto City Bus", None, None),
        (start_date + timedelta(days=6), alex.id, 48.00, "food", "Traditional Kyoto lunch", "Gion Karyo", 35.0042, 135.7731),
        (start_date + timedelta(days=6), jordan.id, 15.00, "activities", "Fushimi Inari offerings", "Fushimi Inari", 34.9671, 135.7727),
        (start_date + timedelta(days=6), sam.id, 92.00, "food", "Kaiseki dinner at ryokan", "Ryokan Serenity", 35.0042, 135.7731),

        # Day 7 - Kyoto
        (start_date + timedelta(days=7), alex.id, 65.00, "activities", "Arashiyama bamboo grove & boat", "Arashiyama", 35.0094, 135.6686),
        (start_date + timedelta(days=7), jordan.id, 55.00, "food", "Kobe beef lunch", "Mouriya", 35.0116, 135.7681),
        (start_date + timedelta(days=7), sam.id, 85.00, "shopping", "Traditional crafts and tea", "Kyoto Handicraft Center", 35.0116, 135.7681),

        # Day 8 - Kyoto
        (start_date + timedelta(days=8), alex.id, 32.00, "activities", "Kinkaku-ji Golden Pavilion", "Kinkaku-ji", 35.0394, 135.7292),
        (start_date + timedelta(days=8), jordan.id, 45.00, "food", "Matcha desserts and tea", "Tsujiri", 35.0042, 135.7731),
        (start_date + timedelta(days=8), sam.id, 68.00, "food", "Ramen dinner", "Ippudo", 35.0116, 135.7681),

        # Day 9 - Travel to Osaka
        (start_date + timedelta(days=9), jordan.id, 45.00, "transport", "Train to Osaka", "JR West", None, None),
        (start_date + timedelta(days=9), alex.id, 78.00, "food", "Okonomiyaki dinner", "Chibo", 34.6686, 135.5005),

        # Day 10 - Osaka
        (start_date + timedelta(days=10), sam.id, 18.00, "activities", "Osaka Castle entry", "Osaka Castle", 34.6873, 135.5262),
        (start_date + timedelta(days=10), jordan.id, 62.00, "food", "Takoyaki tour in Dotonbori", "Dotonbori Street", 34.6686, 135.5005),
        (start_date + timedelta(days=10), alex.id, 95.00, "food", "Kushikatsu and beer dinner", "Daruma", 34.6532, 135.5055),

        # Day 11 - Osaka
        (start_date + timedelta(days=11), alex.id, 125.00, "activities", "Universal Studios Japan tickets", "USJ", 34.6654, 135.4321),
        (start_date + timedelta(days=11), jordan.id, 85.00, "food", "Universal Studios food and snacks", "USJ", 34.6654, 135.4321),

        # Day 12 - Osaka
        (start_date + timedelta(days=12), sam.id, 145.00, "shopping", "Electronics at Den Den Town", "Joshin", 34.6532, 135.5055),
        (start_date + timedelta(days=12), alex.id, 52.00, "food", "Conveyor belt sushi", "Kura Sushi", 34.6686, 135.5005),

        # Day 13 - Return preparation
        (start_date + timedelta(days=13), jordan.id, 65.00, "transport", "Airport express to Narita", "Nankai Railway", None, None),
        (start_date + timedelta(days=13), sam.id, 38.00, "food", "Last meal - soba noodles", "Honke Owariya", 35.0042, 135.7731),
    ]

    for exp_date, payer, amount, category, note, merchant, lat, lng in expenses_data:
        expense = Expense(
            trip_id=trip.id,
            payer_id=payer,
            dt=exp_date,
            amount=amount,
            currency="USD",
            category=category,
            note=note,
            merchant_name=merchant,
            lat=lat,
            lng=lng,
            fx_rate_to_home=1.0
        )
        db.add(expense)
        db.flush()

        # Add splits - all expenses split equally
        splits = [
            ExpenseSplit(expense_id=expense.id, participant_id=alex.id, share_type="equal"),
            ExpenseSplit(expense_id=expense.id, participant_id=jordan.id, share_type="equal"),
            ExpenseSplit(expense_id=expense.id, participant_id=sam.id, share_type="equal"),
        ]
        db.add_all(splits)

    db.commit()
    print(f"✓ Created Japan trip (ID: {trip.id}) with {len(expenses_data)} expenses")
    return trip

def create_paris_trip(db: Session):
    """Create a romantic Paris trip"""
    print("\n🇫🇷 Creating Paris Romance...")

    start_date = date.today() + timedelta(days=30)
    end_date = start_date + timedelta(days=5)

    trip = Trip(
        owner_sub="dev-user-sub",
        title="Paris Romance 🗼",
        destination="Paris, France",
        home_currency="USD",
        start_date=start_date,
        end_date=end_date,
        total_budget=3500.00,
        per_diem_budget=250.00
    )
    db.add(trip)
    db.flush()

    # Participants
    emma = Participant(trip_id=trip.id, display_name="Emma", weight=1.0)
    lucas = Participant(trip_id=trip.id, display_name="Lucas", weight=1.0)
    db.add_all([emma, lucas])
    db.flush()

    # Category budgets
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
        trip_id=trip.id,
        name="Hotel Le Marais",
        type="boutique hotel",
        check_in_date=start_date,
        check_out_date=end_date,
        nightly_rate=240.00,
        total_cost=1200.00,
        currency="USD",
        location_text="Le Marais, Paris",
        lat=48.8584,
        lng=2.3527,
        confirmation_code="HLM-2024-445",
        notes="Near Notre-Dame, rooftop terrace"
    )
    db.add(hotel)

    # Itinerary
    itinerary = [
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=9),
            end_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=20),
            type="flight",
            title="JFK → CDG",
            location_text="New York to Paris Charles de Gaulle",
            notes="Air France AF007",
            conf_code="AF-007-XYZ"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=10),
            end_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=18),
            type="activity",
            title="Louvre Museum",
            location_text="Musée du Louvre, Paris",
            lat=48.8606,
            lng=2.3376,
            notes="Pre-booked tickets, see Mona Lisa",
            conf_code="LVR-8891"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=11),
            end_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=15),
            type="activity",
            title="Eiffel Tower & Picnic",
            location_text="Champ de Mars, Paris",
            lat=48.8584,
            lng=2.2945,
            notes="Sunset viewing"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=3), datetime.min.time()) + timedelta(hours=9),
            end_dt=datetime.combine(start_date + timedelta(days=3), datetime.min.time()) + timedelta(hours=17),
            type="activity",
            title="Versailles Palace Day Trip",
            location_text="Château de Versailles",
            lat=48.8049,
            lng=2.1204,
            notes="RER C train, gardens tour",
            conf_code="VSL-2024"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(end_date, datetime.min.time()) + timedelta(hours=14),
            end_dt=datetime.combine(end_date, datetime.min.time()) + timedelta(hours=18),
            type="flight",
            title="CDG → JFK",
            location_text="Paris to New York",
            notes="Air France AF008",
            conf_code="AF-008-ABC"
        ),
    ]
    db.add_all(itinerary)

    # Sample expenses for future trip (just a few planned ones)
    expenses_data = [
        (start_date, emma.id, 85.00, "transport", "Airport transfer booking deposit", "Paris Shuttle", None, None),
        (start_date, lucas.id, 45.00, "activities", "Louvre tickets (2 people)", "Louvre Museum", 48.8606, 2.3376),
    ]

    for exp_date, payer, amount, category, note, merchant, lat, lng in expenses_data:
        expense = Expense(
            trip_id=trip.id,
            payer_id=payer,
            dt=exp_date,
            amount=amount,
            currency="USD",
            category=category,
            note=note,
            merchant_name=merchant,
            lat=lat,
            lng=lng,
            fx_rate_to_home=1.0
        )
        db.add(expense)
        db.flush()

        splits = [
            ExpenseSplit(expense_id=expense.id, participant_id=emma.id, share_type="equal"),
            ExpenseSplit(expense_id=expense.id, participant_id=lucas.id, share_type="equal"),
        ]
        db.add_all(splits)

    db.commit()
    print(f"✓ Created Paris trip (ID: {trip.id}) with {len(expenses_data)} expenses")
    return trip

def create_iceland_trip(db: Session):
    """Create an adventure Iceland road trip"""
    print("\n🇮🇸 Creating Iceland Road Trip...")

    start_date = date.today() - timedelta(days=45)
    end_date = start_date + timedelta(days=7)

    trip = Trip(
        owner_sub="dev-user-sub",
        title="Iceland Road Trip 🏔️",
        destination="Reykjavik & Ring Road",
        home_currency="USD",
        start_date=start_date,
        end_date=end_date,
        total_budget=4000.00,
        per_diem_budget=200.00
    )
    db.add(trip)
    db.flush()

    # Participants
    maya = Participant(trip_id=trip.id, display_name="Maya", weight=1.0)
    kai = Participant(trip_id=trip.id, display_name="Kai", weight=1.0)
    db.add_all([maya, kai])
    db.flush()

    # Category budgets
    budgets = [
        CategoryBudget(trip_id=trip.id, category="accommodation", planned_amount=900.00),
        CategoryBudget(trip_id=trip.id, category="food", planned_amount=800.00),
        CategoryBudget(trip_id=trip.id, category="transport", planned_amount=1500.00),
        CategoryBudget(trip_id=trip.id, category="activities", planned_amount=600.00),
        CategoryBudget(trip_id=trip.id, category="other", planned_amount=200.00),
    ]
    db.add_all(budgets)

    # Accommodations along the ring road
    accommodations = [
        Accommodation(
            trip_id=trip.id,
            name="Reykjavik Downtown Hostel",
            type="hostel",
            check_in_date=start_date,
            check_out_date=start_date + timedelta(days=2),
            nightly_rate=65.00,
            total_cost=130.00,
            currency="USD",
            location_text="Reykjavik",
            lat=64.1466,
            lng=-21.9426,
            confirmation_code="RDH-8891"
        ),
        Accommodation(
            trip_id=trip.id,
            name="Vik Guesthouse",
            type="guesthouse",
            check_in_date=start_date + timedelta(days=2),
            check_out_date=start_date + timedelta(days=4),
            nightly_rate=85.00,
            total_cost=170.00,
            currency="USD",
            location_text="Vik",
            lat=63.4186,
            lng=-19.0107,
            confirmation_code="VIK-GH-334"
        ),
        Accommodation(
            trip_id=trip.id,
            name="East Fjords Cabin",
            type="cabin",
            check_in_date=start_date + timedelta(days=4),
            check_out_date=end_date,
            nightly_rate=110.00,
            total_cost=330.00,
            currency="USD",
            location_text="Egilsstaðir",
            lat=65.2637,
            lng=-14.3944,
            confirmation_code="EFC-772"
        ),
    ]
    db.add_all(accommodations)

    # Itinerary
    itinerary = [
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=6),
            end_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=11),
            type="flight",
            title="BOS → KEF",
            location_text="Boston to Keflavik",
            notes="Icelandair",
            conf_code="FI-0662"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date, datetime.min.time()) + timedelta(hours=12),
            type="transport",
            title="Rental Car Pickup",
            location_text="Keflavik Airport",
            notes="4WD SUV for ring road",
            conf_code="SIXT-IC-2024"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=10),
            end_dt=datetime.combine(start_date + timedelta(days=1), datetime.min.time()) + timedelta(hours=16),
            type="activity",
            title="Golden Circle Tour",
            location_text="Þingvellir, Geysir, Gullfoss",
            lat=64.2558,
            lng=-20.0524,
            notes="Self-drive tour"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=9),
            end_dt=datetime.combine(start_date + timedelta(days=2), datetime.min.time()) + timedelta(hours=18),
            type="activity",
            title="South Coast: Waterfalls & Black Beach",
            location_text="Seljalandsfoss, Skógafoss, Reynisfjara",
            lat=63.5317,
            lng=-19.5111,
            notes="Bring raincoat for waterfalls"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=3), datetime.min.time()) + timedelta(hours=11),
            end_dt=datetime.combine(start_date + timedelta(days=3), datetime.min.time()) + timedelta(hours=15),
            type="activity",
            title="Glacier Lagoon & Diamond Beach",
            location_text="Jökulsárlón",
            lat=64.0784,
            lng=-16.2306,
            notes="Boat tour booked",
            conf_code="JGL-2024-889"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(start_date + timedelta(days=5), datetime.min.time()) + timedelta(hours=20),
            end_dt=datetime.combine(start_date + timedelta(days=5), datetime.min.time()) + timedelta(hours=23),
            type="activity",
            title="Northern Lights Hunt",
            location_text="East Fjords",
            notes="Clear skies forecast"
        ),
        ItineraryItem(
            trip_id=trip.id,
            start_dt=datetime.combine(end_date, datetime.min.time()) + timedelta(hours=16),
            end_dt=datetime.combine(end_date, datetime.min.time()) + timedelta(hours=19),
            type="flight",
            title="KEF → BOS",
            location_text="Keflavik to Boston",
            notes="Icelandair",
            conf_code="FI-0661"
        ),
    ]
    db.add_all(itinerary)

    # Expenses
    expenses_data = [
        (start_date, maya.id, 850.00, "transport", "4WD SUV rental (7 days)", "Sixt", None, None),
        (start_date, kai.id, 120.00, "food", "First dinner in Reykjavik", "Fishmarket", 64.1466, -21.9426),
        (start_date + timedelta(days=1), maya.id, 95.00, "food", "Groceries for road trip", "Bonus Supermarket", 64.1466, -21.9426),
        (start_date + timedelta(days=1), kai.id, 180.00, "transport", "Gas fill-up", "N1", None, None),
        (start_date + timedelta(days=1), maya.id, 45.00, "food", "Hot dogs at famous stand", "Bæjarins Beztu", 64.1476, -21.9428),
        (start_date + timedelta(days=2), kai.id, 75.00, "activities", "Waterfall hiking gear rental", "Iceland Pro", None, None),
        (start_date + timedelta(days=2), maya.id, 65.00, "food", "Lunch at Vik", "Sudur-Vik", 63.4186, -19.0107),
        (start_date + timedelta(days=3), kai.id, 145.00, "activities", "Glacier lagoon boat tour (2 people)", "Jökulsárlón", 64.0784, -16.2306),
        (start_date + timedelta(days=3), maya.id, 85.00, "food", "Seafood dinner", "Pakkhus Restaurant", 64.2577, -15.2089),
        (start_date + timedelta(days=4), kai.id, 160.00, "transport", "Gas fill-up", "Olis", None, None),
        (start_date + timedelta(days=4), maya.id, 52.00, "food", "Pizza dinner", "Pizzeria Akureyri", 65.6835, -18.1262),
        (start_date + timedelta(days=5), kai.id, 220.00, "activities", "Blue Lagoon spa entry (2 people)", "Blue Lagoon", 63.8804, -22.4495),
        (start_date + timedelta(days=5), maya.id, 95.00, "food", "Farewell dinner", "Grillmarket", 64.1466, -21.9426),
        (start_date + timedelta(days=6), kai.id, 45.00, "other", "Souvenirs and gifts", "Reykjavik Gift Shop", 64.1466, -21.9426),
    ]

    for exp_date, payer, amount, category, note, merchant, lat, lng in expenses_data:
        expense = Expense(
            trip_id=trip.id,
            payer_id=payer,
            dt=exp_date,
            amount=amount,
            currency="USD",
            category=category,
            note=note,
            merchant_name=merchant,
            lat=lat,
            lng=lng,
            fx_rate_to_home=1.0
        )
        db.add(expense)
        db.flush()

        splits = [
            ExpenseSplit(expense_id=expense.id, participant_id=maya.id, share_type="equal"),
            ExpenseSplit(expense_id=expense.id, participant_id=kai.id, share_type="equal"),
        ]
        db.add_all(splits)

    db.commit()
    print(f"✓ Created Iceland trip (ID: {trip.id}) with {len(expenses_data)} expenses")
    return trip

def run():
    """Main seeding function"""
    print("🌍 Starting Travel Tracker Demo Data Seeding...")
    print("=" * 60)

    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Clear existing data
        clear_data(db)

        # Create demo trips
        japan_trip = create_japan_trip(db)
        paris_trip = create_paris_trip(db)
        iceland_trip = create_iceland_trip(db)

        print("\n" + "=" * 60)
        print("✨ Demo data seeding completed successfully!")
        print(f"\nCreated {3} trips:")
        print(f"  - Japan Adventure (ID: {japan_trip.id}) - Active trip with full data")
        print(f"  - Paris Romance (ID: {paris_trip.id}) - Upcoming trip")
        print(f"  - Iceland Road Trip (ID: {iceland_trip.id}) - Past trip")
        print("\nYou can now explore the app with realistic demo data!")

    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run()
