from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import require_user_sub

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("/{trip_id}", response_model=schemas.ExpenseOut)
def add_expense(trip_id: int, payload: schemas.ExpenseCreate, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.owner_sub == sub).first()
    if not trip:
        raise HTTPException(404, "Trip not found")

    payer = db.query(models.Participant).filter(models.Participant.id == payload.payer_id, models.Participant.trip_id == trip_id).first()
    if not payer:
        raise HTTPException(400, "Invalid payer for this trip")

    exp = models.Expense(trip_id=trip_id, payer_id=payload.payer_id, dt=payload.dt, amount=payload.amount,
                         currency=payload.currency.upper(), category=payload.category, note=payload.note,
                         fx_rate_to_home=payload.fx_rate_to_home)
    db.add(exp)
    db.flush()

    splits = payload.splits or []
    for s in splits:
        db.add(models.ExpenseSplit(expense_id=exp.id, participant_id=s.participant_id,
                                   share_type=s.share_type, share_value=s.share_value))
    db.commit()
    db.refresh(exp)
    return exp

@router.get("/{trip_id}", response_model=List[schemas.ExpenseOut])
def list_expenses(trip_id: int, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.owner_sub == sub).first()
    if not trip:
        raise HTTPException(404, "Trip not found")
    return db.query(models.Expense).filter(models.Expense.trip_id == trip_id).order_by(models.Expense.dt.desc()).all()
