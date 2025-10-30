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
    participants: Optional[List[ParticipantCreate]] = None

class TripOut(BaseModel):
    id: int
    title: str
    home_currency: str
    start_date: date
    end_date: date
    total_budget: Optional[float] = None
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
