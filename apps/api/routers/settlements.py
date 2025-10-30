from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Trip, Settlement, Participant
from schemas import SettlementCreate, SettlementUpdate, SettlementOut
from auth import get_user_sub
from typing import List
from datetime import datetime

router = APIRouter()

@router.post("/settlements/{trip_id}", response_model=SettlementOut, status_code=201)
def create_settlement(
    trip_id: int,
    settlement: SettlementCreate,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Create a new settlement (payment) between participants.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Verify both participants exist and belong to this trip
    from_participant = db.query(Participant).filter(
        Participant.id == settlement.from_participant_id,
        Participant.trip_id == trip_id
    ).first()

    to_participant = db.query(Participant).filter(
        Participant.id == settlement.to_participant_id,
        Participant.trip_id == trip_id
    ).first()

    if not from_participant:
        raise HTTPException(status_code=404, detail="From participant not found")

    if not to_participant:
        raise HTTPException(status_code=404, detail="To participant not found")

    if settlement.from_participant_id == settlement.to_participant_id:
        raise HTTPException(status_code=400, detail="Cannot create settlement to self")

    # Create settlement
    db_settlement = Settlement(
        trip_id=trip_id,
        from_participant_id=settlement.from_participant_id,
        to_participant_id=settlement.to_participant_id,
        amount=settlement.amount,
        currency=settlement.currency,
        status="pending",
        payment_method=settlement.payment_method,
        notes=settlement.notes
    )

    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)

    return db_settlement


@router.get("/settlements/{trip_id}", response_model=List[SettlementOut])
def list_settlements(
    trip_id: int,
    status: str = None,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    List all settlements for a trip.
    Optionally filter by status (pending, completed, cancelled).
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    query = db.query(Settlement).filter(Settlement.trip_id == trip_id)

    if status:
        query = query.filter(Settlement.status == status)

    settlements = query.all()

    return settlements


@router.patch("/settlements/{trip_id}/{settlement_id}", response_model=SettlementOut)
def update_settlement_status(
    trip_id: int,
    settlement_id: int,
    settlement_update: SettlementUpdate,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Update a settlement's status (e.g., mark as completed).
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    settlement = db.query(Settlement).filter(
        Settlement.id == settlement_id,
        Settlement.trip_id == trip_id
    ).first()

    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")

    # Update fields
    settlement.status = settlement_update.status

    if settlement_update.payment_method:
        settlement.payment_method = settlement_update.payment_method

    if settlement_update.notes:
        settlement.notes = settlement_update.notes

    # Set completed_at timestamp if status is completed
    if settlement_update.status == "completed" and not settlement.completed_at:
        settlement.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(settlement)

    return settlement


@router.delete("/settlements/{trip_id}/{settlement_id}", status_code=204)
def delete_settlement(
    trip_id: int,
    settlement_id: int,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Delete a settlement.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    settlement = db.query(Settlement).filter(
        Settlement.id == settlement_id,
        Settlement.trip_id == trip_id
    ).first()

    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")

    db.delete(settlement)
    db.commit()

    return None
