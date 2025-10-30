from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class ParticipantCreate(BaseModel):
    display_name: str
    weight: float = 1.0

class ParticipantOut(BaseModel):
    id: int
    display_name: str
    weight: float
    class Config: from_attributes = True

class TripCreate(BaseModel):
    title: str
    home_currency: str = Field(min_length=3, max_length=3)
    start_date: date
    end_date: date
    total_budget: Optional[float] = None
    per_diem_budget: Optional[float] = None
    destination: Optional[str] = None
    participants: Optional[List[ParticipantCreate]] = None

class TripOut(BaseModel):
    id: int
    title: str
    home_currency: str
    start_date: date
    end_date: date
    total_budget: Optional[float] = None
    per_diem_budget: Optional[float] = None
    destination: Optional[str] = None
    participants: List[ParticipantOut] = []
    class Config: from_attributes = True

class ItineraryItemCreate(BaseModel):
    start_dt: datetime
    end_dt: Optional[datetime] = None
    type: str
    title: str
    location_text: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    notes: Optional[str] = None
    conf_code: Optional[str] = None

class ItineraryItemOut(ItineraryItemCreate):
    id: int
    class Config: from_attributes = True

class ExpenseSplitCreate(BaseModel):
    participant_id: int
    share_type: str = "equal"
    share_value: Optional[float] = None

class ExpenseCreate(BaseModel):
    dt: date
    amount: float
    currency: str
    category: Optional[str] = None
    note: Optional[str] = None
    merchant_name: Optional[str] = None
    receipt_urls: Optional[List[str]] = None
    location_text: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    payer_id: int
    fx_rate_to_home: Optional[float] = None
    splits: Optional[List[ExpenseSplitCreate]] = None

class ExpenseOut(BaseModel):
    id: int
    dt: date
    amount: float
    currency: str
    category: Optional[str] = None
    note: Optional[str] = None
    merchant_name: Optional[str] = None
    receipt_urls: Optional[List[str]] = None
    location_text: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    payer_id: int
    fx_rate_to_home: Optional[float] = None
    splits: List[ExpenseSplitCreate] = []
    class Config: from_attributes = True

class BalanceLine(BaseModel):
    participant_id: int
    net_amount_home: float

class SettlementLine(BaseModel):
    from_participant_id: int
    to_participant_id: int
    amount_home: float

# New schemas for Phase 1 enhancements

class CategoryBudgetCreate(BaseModel):
    category: str
    planned_amount: float

class CategoryBudgetOut(BaseModel):
    id: int
    category: str
    planned_amount: float
    class Config: from_attributes = True

class AccommodationCreate(BaseModel):
    name: str
    type: Optional[str] = None
    check_in_date: date
    check_out_date: date
    nightly_rate: Optional[float] = None
    total_cost: Optional[float] = None
    currency: str
    location_text: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    confirmation_code: Optional[str] = None
    notes: Optional[str] = None
    booking_url: Optional[str] = None

class AccommodationOut(AccommodationCreate):
    id: int
    class Config: from_attributes = True

class SettlementCreate(BaseModel):
    from_participant_id: int
    to_participant_id: int
    amount: float
    currency: str
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class SettlementUpdate(BaseModel):
    status: str
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class SettlementOut(BaseModel):
    id: int
    from_participant_id: int
    to_participant_id: int
    amount: float
    currency: str
    status: str
    payment_method: Optional[str] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    class Config: from_attributes = True

# Analytics schemas

class CategorySpending(BaseModel):
    category: str
    planned: float
    actual: float
    variance: float
    variance_percent: float

class BudgetAnalytics(BaseModel):
    total_planned: float
    total_spent: float
    remaining: float
    utilization_percent: float
    categories: List[CategorySpending]

class DailySpending(BaseModel):
    date: date
    amount: float
    num_expenses: int

class DailyTrends(BaseModel):
    days: List[DailySpending]
    average_daily: float
    per_diem_budget: Optional[float]
    projected_total: float
