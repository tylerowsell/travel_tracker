from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Trip, Accommodation
from schemas import AccommodationCreate, AccommodationOut
from auth import get_user_sub
from typing import List

router = APIRouter()

@router.post("/accommodations/{trip_id}", response_model=AccommodationOut, status_code=201)
def create_accommodation(
    trip_id: int,
    accommodation: AccommodationCreate,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Add a new accommodation to a trip.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Calculate total_cost if nightly_rate is provided
    total_cost = accommodation.total_cost
    if not total_cost and accommodation.nightly_rate:
        nights = (accommodation.check_out_date - accommodation.check_in_date).days
        total_cost = accommodation.nightly_rate * nights

    # Create accommodation
    db_accommodation = Accommodation(
        trip_id=trip_id,
        name=accommodation.name,
        type=accommodation.type,
        check_in_date=accommodation.check_in_date,
        check_out_date=accommodation.check_out_date,
        nightly_rate=accommodation.nightly_rate,
        total_cost=total_cost,
        currency=accommodation.currency,
        location_text=accommodation.location_text,
        lat=accommodation.lat,
        lng=accommodation.lng,
        confirmation_code=accommodation.confirmation_code,
        notes=accommodation.notes,
        booking_url=accommodation.booking_url
    )

    db.add(db_accommodation)
    db.commit()
    db.refresh(db_accommodation)

    return db_accommodation


@router.get("/accommodations/{trip_id}", response_model=List[AccommodationOut])
def list_accommodations(
    trip_id: int,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    List all accommodations for a trip, sorted by check-in date.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    accommodations = db.query(Accommodation).filter(
        Accommodation.trip_id == trip_id
    ).order_by(Accommodation.check_in_date).all()

    return accommodations


@router.get("/accommodations/{trip_id}/{accommodation_id}", response_model=AccommodationOut)
def get_accommodation(
    trip_id: int,
    accommodation_id: int,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Get a specific accommodation by ID.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    accommodation = db.query(Accommodation).filter(
        Accommodation.id == accommodation_id,
        Accommodation.trip_id == trip_id
    ).first()

    if not accommodation:
        raise HTTPException(status_code=404, detail="Accommodation not found")

    return accommodation


@router.put("/accommodations/{trip_id}/{accommodation_id}", response_model=AccommodationOut)
def update_accommodation(
    trip_id: int,
    accommodation_id: int,
    accommodation_update: AccommodationCreate,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Update an existing accommodation.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    accommodation = db.query(Accommodation).filter(
        Accommodation.id == accommodation_id,
        Accommodation.trip_id == trip_id
    ).first()

    if not accommodation:
        raise HTTPException(status_code=404, detail="Accommodation not found")

    # Calculate total_cost if nightly_rate is provided
    total_cost = accommodation_update.total_cost
    if not total_cost and accommodation_update.nightly_rate:
        nights = (accommodation_update.check_out_date - accommodation_update.check_in_date).days
        total_cost = accommodation_update.nightly_rate * nights

    # Update fields
    accommodation.name = accommodation_update.name
    accommodation.type = accommodation_update.type
    accommodation.check_in_date = accommodation_update.check_in_date
    accommodation.check_out_date = accommodation_update.check_out_date
    accommodation.nightly_rate = accommodation_update.nightly_rate
    accommodation.total_cost = total_cost
    accommodation.currency = accommodation_update.currency
    accommodation.location_text = accommodation_update.location_text
    accommodation.lat = accommodation_update.lat
    accommodation.lng = accommodation_update.lng
    accommodation.confirmation_code = accommodation_update.confirmation_code
    accommodation.notes = accommodation_update.notes
    accommodation.booking_url = accommodation_update.booking_url

    db.commit()
    db.refresh(accommodation)

    return accommodation


@router.delete("/accommodations/{trip_id}/{accommodation_id}", status_code=204)
def delete_accommodation(
    trip_id: int,
    accommodation_id: int,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Delete an accommodation.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    accommodation = db.query(Accommodation).filter(
        Accommodation.id == accommodation_id,
        Accommodation.trip_id == trip_id
    ).first()

    if not accommodation:
        raise HTTPException(status_code=404, detail="Accommodation not found")

    db.delete(accommodation)
    db.commit()

    return None
