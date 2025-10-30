from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from ..database import SessionLocal, Base, engine
from ..models import Trip, Participant, Expense, ExpenseSplit, ItineraryItem

def run():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    # Trip
    trip = Trip(owner_sub="dev-user-sub", title="Italy Adventure", home_currency="EUR",
                start_date=date.today(), end_date=date.today()+timedelta(days=10), total_budget=2500)
    db.add(trip); db.flush()

    a = Participant(trip_id=trip.id, display_name="Claire", weight=1.0)
    b = Participant(trip_id=trip.id, display_name="Tyler", weight=1.0)
    db.add_all([a,b]); db.flush()

    # Itinerary
    db.add(ItineraryItem(trip_id=trip.id, start_dt=datetime.now(), end_dt=None, type="flight",
                         title="YYZ → FCO", location_text="Toronto/Rome", notes="AC890"))
    # Expense: Dinner 60 EUR split equally
    e1 = Expense(trip_id=trip.id, payer_id=a.id, dt=date.today(), amount=60.00, currency="EUR", category="Food", note="Trastevere dinner", fx_rate_to_home=1.0)
    db.add(e1); db.flush()
    db.add_all([
        ExpenseSplit(expense_id=e1.id, participant_id=a.id, share_type="equal"),
        ExpenseSplit(expense_id=e1.id, participant_id=b.id, share_type="equal"),
    ])
    db.commit()
    print("Seed complete. Trip ID:", trip.id)

if __name__ == "__main__":
    run()
