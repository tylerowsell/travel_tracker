from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/sync", response_model=schemas.UserProfileOut)
def sync_user_profile(
    payload: schemas.UserProfileCreate,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Create or get user profile (for auto-sync on login)"""
    user = db.query(models.UserProfile).filter(models.UserProfile.id == sub).first()

    if user:
        # Update existing profile with latest data from auth provider
        user.email = payload.email
        user.display_name = payload.display_name
        if payload.avatar_url:
            user.avatar_url = payload.avatar_url
        user.updated_at = datetime.utcnow()
    else:
        # Create new profile
        user = models.UserProfile(
            id=sub,
            email=payload.email,
            display_name=payload.display_name,
            avatar_url=payload.avatar_url,
            bio=payload.bio,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)

    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=schemas.UserProfileOut)
def get_current_user(db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    """Get current user's profile"""
    user = db.query(models.UserProfile).filter(models.UserProfile.id == sub).first()
    if not user:
        raise HTTPException(404, "User profile not found")
    return user


@router.put("/me", response_model=schemas.UserProfileOut)
def update_current_user(
    payload: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Update current user's profile"""
    user = db.query(models.UserProfile).filter(models.UserProfile.id == sub).first()
    if not user:
        raise HTTPException(404, "User profile not found")

    if payload.display_name is not None:
        user.display_name = payload.display_name
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    if payload.bio is not None:
        user.bio = payload.bio

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=schemas.UserProfileOut)
def get_user(user_id: str, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    """Get a user's profile by ID"""
    user = db.query(models.UserProfile).filter(models.UserProfile.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user
