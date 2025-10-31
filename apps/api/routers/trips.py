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
    """List all trips (owned + shared)"""
    # Get trips where user is owner
    owned_trips = db.query(models.Trip).filter(models.Trip.owner_sub == sub).all()

    # Get trips where user is a member
    memberships = db.query(models.TripMember).filter(
        models.TripMember.user_id == sub,
        models.TripMember.invite_status == "accepted"
    ).all()

    shared_trip_ids = [m.trip_id for m in memberships]
    shared_trips = db.query(models.Trip).filter(models.Trip.id.in_(shared_trip_ids)).all() if shared_trip_ids else []

    # Combine and deduplicate
    all_trips = {trip.id: trip for trip in owned_trips + shared_trips}
    return list(all_trips.values())

@router.get("/{trip_id}", response_model=schemas.TripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    """Get trip details (owner or member)"""
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(404, "Trip not found")

    # Check if user is owner or member
    is_owner = trip.owner_sub == sub
    is_member = db.query(models.TripMember).filter(
        models.TripMember.trip_id == trip_id,
        models.TripMember.user_id == sub,
        models.TripMember.invite_status == "accepted"
    ).first() is not None

    if not (is_owner or is_member):
        raise HTTPException(403, "Access denied")

    return trip


@router.put("/{trip_id}", response_model=schemas.TripOut)
def update_trip(
    trip_id: int,
    payload: schemas.TripUpdate,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Update trip details (owner or admin only)"""
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(404, "Trip not found")

    # Check if user is owner or admin
    is_owner = trip.owner_sub == sub
    membership = db.query(models.TripMember).filter(
        models.TripMember.trip_id == trip_id,
        models.TripMember.user_id == sub,
        models.TripMember.invite_status == "accepted"
    ).first()
    is_admin = membership and membership.role == "admin"

    if not (is_owner or is_admin):
        raise HTTPException(403, "Only owner or admin can edit trip")

    # Update fields
    if payload.title is not None:
        trip.title = payload.title
    if payload.destination is not None:
        trip.destination = payload.destination
    if payload.start_date is not None:
        trip.start_date = payload.start_date
    if payload.end_date is not None:
        trip.end_date = payload.end_date
    if payload.total_budget is not None:
        trip.total_budget = payload.total_budget
    if payload.per_diem_budget is not None:
        trip.per_diem_budget = payload.per_diem_budget

    db.commit()
    db.refresh(trip)
    return trip


@router.post("/fix-ownership", response_model=dict)
def fix_trip_ownership(db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    """
    Fix ownership of trips created with dev-user-sub.
    This endpoint transfers all trips owned by 'dev-user-sub' to the current authenticated user.
    """
    # Find all trips owned by dev-user-sub
    old_trips = db.query(models.Trip).filter(models.Trip.owner_sub == "dev-user-sub").all()

    if not old_trips:
        return {
            "message": "No trips found with dev-user-sub ownership",
            "trips_updated": 0
        }

    trips_updated = 0

    for trip in old_trips:
        # Update trip ownership
        trip.owner_sub = sub
        trips_updated += 1

        # Update participants if they have user_sub = dev-user-sub
        participants = db.query(models.Participant).filter(
            models.Participant.trip_id == trip.id,
            models.Participant.user_sub == "dev-user-sub"
        ).all()

        for participant in participants:
            participant.user_sub = sub

        # Update trip members if they exist
        members = db.query(models.TripMember).filter(
            models.TripMember.trip_id == trip.id,
            models.TripMember.user_id == "dev-user-sub"
        ).all()

        for member in members:
            member.user_id = sub

    db.commit()

    return {
        "message": f"Successfully transferred ownership of {trips_updated} trip(s) to your account",
        "trips_updated": trips_updated
    }
