from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Enum, Text, Numeric, UniqueConstraint, Boolean, ARRAY, JSON
from sqlalchemy.orm import relationship
from database import Base
import enum

class ItineraryType(str, enum.Enum):
    flight = "flight"
    stay = "stay"
    transport = "transport"
    activity = "activity"
    note = "note"

class ExpenseCategory(str, enum.Enum):
    accommodation = "accommodation"
    food = "food"
    transport = "transport"
    activities = "activities"
    shopping = "shopping"
    other = "other"

class SettlementStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    cancelled = "cancelled"

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    owner_sub = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    home_currency = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_budget = Column(Numeric(12,2), nullable=True)
    per_diem_budget = Column(Numeric(12,2), nullable=True)
    destination = Column(String, nullable=True)

    participants = relationship("Participant", back_populates="trip", cascade="all, delete-orphan")
    itinerary_items = relationship("ItineraryItem", back_populates="trip", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")
    category_budgets = relationship("CategoryBudget", back_populates="trip", cascade="all, delete-orphan")
    accommodations = relationship("Accommodation", back_populates="trip", cascade="all, delete-orphan")
    settlements = relationship("Settlement", back_populates="trip", cascade="all, delete-orphan")

class Participant(Base):
    __tablename__ = "participants"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, index=True)
    display_name = Column(String, nullable=False)
    weight = Column(Float, nullable=False, default=1.0)

    trip = relationship("Trip", back_populates="participants")
    pays = relationship("Expense", back_populates="payer")
    splits = relationship("ExpenseSplit", back_populates="participant")

class ItineraryItem(Base):
    __tablename__ = "itinerary_items"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, index=True)
    start_dt = Column(DateTime, nullable=False)
    end_dt = Column(DateTime, nullable=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    location_text = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    conf_code = Column(String, nullable=True)

    trip = relationship("Trip", back_populates="itinerary_items")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, index=True)
    payer_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    dt = Column(Date, nullable=False)
    amount = Column(Numeric(12,2), nullable=False)
    currency = Column(String, nullable=False)
    category = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    merchant_name = Column(String, nullable=True)
    receipt_urls = Column(JSON, nullable=True)  # Array of receipt image URLs
    location_text = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    fx_rate_to_home = Column(Float, nullable=True)

    trip = relationship("Trip", back_populates="expenses")
    payer = relationship("Participant", back_populates="pays")
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False, index=True)
    share_type = Column(String, nullable=False, default="equal")  # equal|weight|custom
    share_value = Column(Float, nullable=True)  # used when custom

    expense = relationship("Expense", back_populates="splits")
    participant = relationship("Participant", back_populates="splits")

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    from_ccy = Column(String, nullable=False)
    to_ccy = Column(String, nullable=False)
    rate = Column(Float, nullable=False)
    __table_args__ = (UniqueConstraint('date', 'from_ccy', 'to_ccy', name='uq_fx_date_pair'),)

class CategoryBudget(Base):
    __tablename__ = "category_budgets"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, index=True)
    category = Column(String, nullable=False)  # Uses ExpenseCategory enum values
    planned_amount = Column(Numeric(12,2), nullable=False)

    trip = relationship("Trip", back_populates="category_budgets")
    __table_args__ = (UniqueConstraint('trip_id', 'category', name='uq_trip_category'),)

class Accommodation(Base):
    __tablename__ = "accommodations"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)  # hotel, airbnb, hostel, etc.
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    nightly_rate = Column(Numeric(12,2), nullable=True)
    total_cost = Column(Numeric(12,2), nullable=True)
    currency = Column(String, nullable=False)
    location_text = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    confirmation_code = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    booking_url = Column(String, nullable=True)

    trip = relationship("Trip", back_populates="accommodations")

class Settlement(Base):
    __tablename__ = "settlements"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, index=True)
    from_participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    to_participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    amount = Column(Numeric(12,2), nullable=False)
    currency = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")  # Uses SettlementStatus enum
    payment_method = Column(String, nullable=True)  # venmo, paypal, cash, etc.
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    trip = relationship("Trip", back_populates="settlements")
    from_participant = relationship("Participant", foreign_keys=[from_participant_id])
    to_participant = relationship("Participant", foreign_keys=[to_participant_id])
