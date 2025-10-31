from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(prefix="/itinerary", tags=["itinerary"])

def check_trip_access(trip_id: int, user_sub: str, db: Session, require_edit: bool = False):
    """Check if user has access to trip (and optionally edit rights)"""
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


@router.post("/{trip_id}", response_model=schemas.ItineraryItemOut)
def add_item(trip_id: int, payload: schemas.ItineraryItemCreate, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    """Add itinerary item (owner/admin/member)"""
    check_trip_access(trip_id, sub, db, require_edit=True)
    item = models.ItineraryItem(trip_id=trip_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{trip_id}", response_model=List[schemas.ItineraryItemOut])
def list_items(trip_id: int, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    """List all itinerary items"""
    check_trip_access(trip_id, sub, db)
    return db.query(models.ItineraryItem).filter(models.ItineraryItem.trip_id == trip_id).order_by(models.ItineraryItem.start_dt).all()


@router.put("/{trip_id}/{item_id}", response_model=schemas.ItineraryItemOut)
def update_item(
    trip_id: int,
    item_id: int,
    payload: schemas.ItineraryItemCreate,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Update itinerary item"""
    check_trip_access(trip_id, sub, db, require_edit=True)

    item = db.query(models.ItineraryItem).filter(
        models.ItineraryItem.id == item_id,
        models.ItineraryItem.trip_id == trip_id
    ).first()

    if not item:
        raise HTTPException(404, "Itinerary item not found")

    for key, value in payload.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{trip_id}/{item_id}")
def delete_item(
    trip_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Delete itinerary item"""
    check_trip_access(trip_id, sub, db, require_edit=True)

    item = db.query(models.ItineraryItem).filter(
        models.ItineraryItem.id == item_id,
        models.ItineraryItem.trip_id == trip_id
    ).first()

    if not item:
        raise HTTPException(404, "Itinerary item not found")

    db.delete(item)
    db.commit()
    return {"success": True}
