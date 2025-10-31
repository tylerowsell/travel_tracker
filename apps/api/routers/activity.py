from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(prefix="/trips/{trip_id}/activity", tags=["activity"])


def check_trip_access(trip_id: int, user_sub: str, db: Session):
    """Check if user has access to trip"""
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(404, "Trip not found")

    if trip.owner_sub == user_sub:
        return trip

    membership = db.query(models.TripMember).filter(
        models.TripMember.trip_id == trip_id,
        models.TripMember.user_id == user_sub,
        models.TripMember.invite_status == "accepted"
    ).first()

    if not membership:
        raise HTTPException(403, "Access denied to this trip")

    return trip


@router.get("", response_model=List[schemas.ActivityLogOut])
def get_activity_feed(
    trip_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Get activity feed for a trip"""
    check_trip_access(trip_id, sub, db)

    activities = db.query(models.ActivityLog).filter(
        models.ActivityLog.trip_id == trip_id
    ).order_by(
        models.ActivityLog.created_at.desc()
    ).limit(limit).offset(offset).all()

    return activities
