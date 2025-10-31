from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(tags=["invites"])


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

    if not membership or membership.role not in ["owner", "admin"]:
        raise HTTPException(403, "Only admins can manage invites")

    return trip


@router.post("/trips/{trip_id}/invites", response_model=schemas.TripInviteOut)
def create_invite(
    trip_id: int,
    payload: schemas.TripInviteCreate,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Create an invite link for a trip (requires admin)"""
    check_trip_access(trip_id, sub, db)

    invite = models.TripInvite(
        id=str(uuid.uuid4()),
        trip_id=trip_id,
        created_by=sub,
        expires_at=payload.expires_at,
        max_uses=payload.max_uses,
        used_count=0,
        created_at=datetime.utcnow()
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


@router.get("/trips/{trip_id}/invites", response_model=List[schemas.TripInviteOut])
def list_invites(
    trip_id: int,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """List all invite links for a trip"""
    check_trip_access(trip_id, sub, db)

    invites = db.query(models.TripInvite).filter(
        models.TripInvite.trip_id == trip_id
    ).all()
    return invites


@router.get("/invites/{invite_id}", response_model=schemas.TripInviteOut)
def get_invite(invite_id: str, db: Session = Depends(get_db)):
    """Get invite details (public endpoint for accepting invites)"""
    invite = db.query(models.TripInvite).filter(models.TripInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(404, "Invite not found")

    # Check if invite is still valid
    if invite.expires_at and invite.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invite has expired")

    if invite.max_uses and invite.used_count >= invite.max_uses:
        raise HTTPException(400, "Invite has reached maximum uses")

    return invite


@router.post("/invites/{invite_id}/accept", response_model=schemas.TripMemberOut)
def accept_invite(
    invite_id: str,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Accept an invite and join the trip"""
    invite = db.query(models.TripInvite).filter(models.TripInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(404, "Invite not found")

    # Check if invite is still valid
    if invite.expires_at and invite.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invite has expired")

    if invite.max_uses and invite.used_count >= invite.max_uses:
        raise HTTPException(400, "Invite has reached maximum uses")

    # Check if user is already a member
    existing_member = db.query(models.TripMember).filter(
        models.TripMember.trip_id == invite.trip_id,
        models.TripMember.user_id == sub
    ).first()

    if existing_member:
        if existing_member.invite_status == "accepted":
            raise HTTPException(400, "Already a member of this trip")
        # If they declined before, update to accepted
        existing_member.invite_status = "accepted"
        existing_member.joined_at = datetime.utcnow()
        member = existing_member
    else:
        # Create new membership
        member = models.TripMember(
            trip_id=invite.trip_id,
            user_id=sub,
            role="member",
            invite_status="accepted",
            joined_at=datetime.utcnow()
        )
        db.add(member)

    # Increment invite usage count
    invite.used_count += 1

    # Log activity
    activity = models.ActivityLog(
        trip_id=invite.trip_id,
        user_id=sub,
        action_type="member_joined",
        action_metadata={"invite_id": invite_id},
        created_at=datetime.utcnow()
    )
    db.add(activity)

    db.commit()
    db.refresh(member)
    return member


@router.delete("/invites/{invite_id}")
def delete_invite(
    invite_id: str,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Delete an invite link"""
    invite = db.query(models.TripInvite).filter(models.TripInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(404, "Invite not found")

    # Check if user has permission to delete
    check_trip_access(invite.trip_id, sub, db)

    db.delete(invite)
    db.commit()
    return {"success": True}
