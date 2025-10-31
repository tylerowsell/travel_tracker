from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(prefix="/trips/{trip_id}/members", tags=["members"])


def check_trip_access(trip_id: int, user_sub: str, db: Session, required_role: str = None):
    """Check if user has access to trip and optionally a specific role"""
    # Check if user is the owner
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(404, "Trip not found")

    if trip.owner_sub == user_sub:
        return trip, "owner"

    # Check if user is a member
    membership = db.query(models.TripMember).filter(
        models.TripMember.trip_id == trip_id,
        models.TripMember.user_id == user_sub,
        models.TripMember.invite_status == "accepted"
    ).first()

    if not membership:
        raise HTTPException(403, "Access denied to this trip")

    # Check role if required
    if required_role:
        role_hierarchy = {"owner": 4, "admin": 3, "member": 2, "viewer": 1}
        user_level = role_hierarchy.get(membership.role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        if user_level < required_level:
            raise HTTPException(403, f"Requires {required_role} role")

    return trip, membership.role


@router.get("", response_model=List[schemas.TripMemberOut])
def list_trip_members(
    trip_id: int,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """List all members of a trip"""
    check_trip_access(trip_id, sub, db)

    members = db.query(models.TripMember).filter(
        models.TripMember.trip_id == trip_id
    ).all()
    return members


@router.put("/{member_id}", response_model=schemas.TripMemberOut)
def update_trip_member(
    trip_id: int,
    member_id: int,
    payload: schemas.TripMemberUpdate,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Update a trip member's role or status (requires admin)"""
    check_trip_access(trip_id, sub, db, required_role="admin")

    member = db.query(models.TripMember).filter(
        models.TripMember.id == member_id,
        models.TripMember.trip_id == trip_id
    ).first()

    if not member:
        raise HTTPException(404, "Member not found")

    if payload.role is not None:
        # Don't allow changing the owner's role
        trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
        if member.user_id == trip.owner_sub:
            raise HTTPException(400, "Cannot change owner's role")
        member.role = payload.role

    if payload.invite_status is not None:
        member.invite_status = payload.invite_status

    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}")
def remove_trip_member(
    trip_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Remove a member from a trip (requires admin)"""
    check_trip_access(trip_id, sub, db, required_role="admin")

    member = db.query(models.TripMember).filter(
        models.TripMember.id == member_id,
        models.TripMember.trip_id == trip_id
    ).first()

    if not member:
        raise HTTPException(404, "Member not found")

    # Don't allow removing the owner
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if member.user_id == trip.owner_sub:
        raise HTTPException(400, "Cannot remove trip owner")

    db.delete(member)
    db.commit()
    return {"success": True}
