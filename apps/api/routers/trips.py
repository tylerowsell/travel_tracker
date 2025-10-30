from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(prefix="/trips", tags=["trips"])

@router.post("", response_model=schemas.TripOut)
def create_trip(payload: schemas.TripCreate, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    trip = models.Trip(
        owner_sub=sub,
        title=payload.title,
        home_currency=payload.home_currency.upper(),
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_budget=payload.total_budget
    )
    db.add(trip)
    db.flush()

    if payload.participants:
        for p in payload.participants:
            db.add(models.Participant(trip_id=trip.id, display_name=p.display_name, weight=p.weight))
    db.commit()
    db.refresh(trip)
    return trip

@router.get("", response_model=List[schemas.TripOut])
def list_trips(db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    return db.query(models.Trip).filter(models.Trip.owner_sub == sub).all()

@router.get("/{trip_id}", response_model=schemas.TripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.owner_sub == sub).first()
    if not trip:
        raise HTTPException(404, "Trip not found")
    return trip
