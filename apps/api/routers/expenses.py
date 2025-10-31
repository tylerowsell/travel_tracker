from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(prefix="/expenses", tags=["expenses"])


def check_trip_access(trip_id: int, user_sub: str, db: Session, require_edit: bool = False):
    """Check if user has access to trip"""
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(404, "Trip not found")

    is_owner = trip.owner_sub == user_sub
    membership = db.query(models.TripMember).filter(
        models.TripMember.trip_id == trip_id,
        models.TripMember.user_id == user_sub,
        models.TripMember.invite_status == "accepted"
    ).first()

    has_access = is_owner or membership is not None
    if not has_access:
        raise HTTPException(403, "Access denied")

    if require_edit:
        can_edit = is_owner or (membership and membership.role in ["admin", "member"])
        if not can_edit:
            raise HTTPException(403, "Only owner, admin, or member can edit")

    return trip


@router.post("/{trip_id}", response_model=schemas.ExpenseOut)
def add_expense(trip_id: int, payload: schemas.ExpenseCreate, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    check_trip_access(trip_id, sub, db, require_edit=True)

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
    check_trip_access(trip_id, sub, db)
    return db.query(models.Expense).filter(models.Expense.trip_id == trip_id).order_by(models.Expense.dt.desc()).all()


@router.put("/{trip_id}/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    trip_id: int,
    expense_id: int,
    payload: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Update an expense"""
    check_trip_access(trip_id, sub, db, require_edit=True)

    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.trip_id == trip_id
    ).first()

    if not expense:
        raise HTTPException(404, "Expense not found")

    # Update expense fields
    expense.dt = payload.dt
    expense.amount = payload.amount
    expense.currency = payload.currency.upper()
    expense.category = payload.category
    expense.note = payload.note
    expense.merchant_name = payload.merchant_name
    expense.location_text = payload.location_text
    expense.lat = payload.lat
    expense.lng = payload.lng
    expense.receipt_urls = payload.receipt_urls
    expense.payer_id = payload.payer_id
    expense.fx_rate_to_home = payload.fx_rate_to_home

    # Update splits: delete old ones, add new ones
    db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense_id).delete()
    splits = payload.splits or []
    for s in splits:
        db.add(models.ExpenseSplit(
            expense_id=expense_id,
            participant_id=s.participant_id,
            share_type=s.share_type,
            share_value=s.share_value
        ))

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{trip_id}/{expense_id}")
def delete_expense(
    trip_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Delete an expense"""
    check_trip_access(trip_id, sub, db, require_edit=True)

    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.trip_id == trip_id
    ).first()

    if not expense:
        raise HTTPException(404, "Expense not found")

    db.delete(expense)
    db.commit()
    return {"success": True}
