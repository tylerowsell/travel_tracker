from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(prefix="/participants", tags=["participants"])

@router.post("/{trip_id}", response_model=schemas.ParticipantOut)
def add_participant(trip_id: int, payload: schemas.ParticipantCreate, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.owner_sub == sub).first()
    if not trip:
        raise HTTPException(404, "Trip not found")
    part = models.Participant(trip_id=trip_id, display_name=payload.display_name, weight=payload.weight)
    db.add(part)
    db.commit()
    db.refresh(part)
    return part

@router.get("/{trip_id}", response_model=List[schemas.ParticipantOut])
def list_participants(trip_id: int, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.owner_sub == sub).first()
    if not trip:
        raise HTTPException(404, "Trip not found")
    return db.query(models.Participant).filter(models.Participant.trip_id == trip_id).all()
