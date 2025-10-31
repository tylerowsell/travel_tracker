from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(tags=["reactions"])


def check_expense_access(expense_id: int, user_sub: str, db: Session):
    """Check if user has access to the expense's trip"""
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(404, "Expense not found")

    trip = db.query(models.Trip).filter(models.Trip.id == expense.trip_id).first()

    if trip.owner_sub == user_sub:
        return expense

    membership = db.query(models.TripMember).filter(
        models.TripMember.trip_id == expense.trip_id,
        models.TripMember.user_id == user_sub,
        models.TripMember.invite_status == "accepted"
    ).first()

    if not membership:
        raise HTTPException(403, "Access denied to this expense")

    return expense


@router.get("/expenses/{expense_id}/reactions", response_model=List[schemas.ReactionOut])
def list_reactions(
    expense_id: int,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """List all reactions on an expense"""
    check_expense_access(expense_id, sub, db)

    reactions = db.query(models.Reaction).filter(
        models.Reaction.expense_id == expense_id
    ).all()

    return reactions


@router.post("/expenses/{expense_id}/reactions", response_model=schemas.ReactionOut)
def add_reaction(
    expense_id: int,
    payload: schemas.ReactionCreate,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Add a reaction to an expense"""
    expense = check_expense_access(expense_id, sub, db)

    # Check if user already reacted with this emoji
    existing = db.query(models.Reaction).filter(
        models.Reaction.expense_id == expense_id,
        models.Reaction.user_id == sub,
        models.Reaction.emoji == payload.emoji
    ).first()

    if existing:
        raise HTTPException(400, "Already reacted with this emoji")

    reaction = models.Reaction(
        expense_id=expense_id,
        user_id=sub,
        emoji=payload.emoji,
        created_at=datetime.utcnow()
    )
    db.add(reaction)

    # Log activity
    activity = models.ActivityLog(
        trip_id=expense.trip_id,
        user_id=sub,
        action_type="reaction_added",
        metadata={"expense_id": expense_id, "emoji": payload.emoji},
        created_at=datetime.utcnow()
    )
    db.add(activity)

    db.commit()
    db.refresh(reaction)
    return reaction


@router.delete("/reactions/{reaction_id}")
def remove_reaction(
    reaction_id: int,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Remove a reaction (only by the user who added it)"""
    reaction = db.query(models.Reaction).filter(models.Reaction.id == reaction_id).first()
    if not reaction:
        raise HTTPException(404, "Reaction not found")

    if reaction.user_id != sub:
        raise HTTPException(403, "Can only remove your own reactions")

    db.delete(reaction)
    db.commit()
    return {"success": True}
