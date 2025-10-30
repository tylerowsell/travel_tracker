from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(prefix="/itinerary", tags=["itinerary"])

@router.post("/{trip_id}", response_model=schemas.ItineraryItemOut)
def add_item(trip_id: int, payload: schemas.ItineraryItemCreate, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.owner_sub == sub).first()
    if not trip:
        raise HTTPException(404, "Trip not found")
    item = models.ItineraryItem(trip_id=trip_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/{trip_id}", response_model=List[schemas.ItineraryItemOut])
def list_items(trip_id: int, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.owner_sub == sub).first()
    if not trip:
        raise HTTPException(404, "Trip not found")
    return db.query(models.ItineraryItem).filter(models.ItineraryItem.trip_id == trip_id).order_by(models.ItineraryItem.start_dt).all()
