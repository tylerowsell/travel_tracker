from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
import models
import schemas
from auth import require_user_sub

router = APIRouter(tags=["comments"])


def check_expense_access(expense_id: int, user_sub: str, db: Session):
    """Check if user has access to the expense's trip"""
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(404, "Expense not found")

    trip = db.query(models.Trip).filter(models.Trip.id == expense.trip_id).first()

    if trip.owner_sub == user_sub:
        return expense

    membership = db.query(models.TripMember).filter(
        models.TripMember.trip_id == expense.trip_id,
        models.TripMember.user_id == user_sub,
        models.TripMember.invite_status == "accepted"
    ).first()

    if not membership:
        raise HTTPException(403, "Access denied to this expense")

    return expense


@router.get("/expenses/{expense_id}/comments", response_model=List[schemas.CommentOut])
def list_comments(
    expense_id: int,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """List all comments on an expense"""
    check_expense_access(expense_id, sub, db)

    comments = db.query(models.Comment).filter(
        models.Comment.expense_id == expense_id
    ).order_by(models.Comment.created_at.asc()).all()

    return comments


@router.post("/expenses/{expense_id}/comments", response_model=schemas.CommentOut)
def create_comment(
    expense_id: int,
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Add a comment to an expense"""
    expense = check_expense_access(expense_id, sub, db)

    comment = models.Comment(
        expense_id=expense_id,
        user_id=sub,
        content=payload.content,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(comment)

    # Log activity
    activity = models.ActivityLog(
        trip_id=expense.trip_id,
        user_id=sub,
        action_type="comment_added",
        action_metadata={"expense_id": expense_id, "comment_id": comment.id},
        created_at=datetime.utcnow()
    )
    db.add(activity)

    db.commit()
    db.refresh(comment)
    return comment


@router.put("/comments/{comment_id}", response_model=schemas.CommentOut)
def update_comment(
    comment_id: int,
    payload: schemas.CommentUpdate,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Update a comment (only by the comment author)"""
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")

    if comment.user_id != sub:
        raise HTTPException(403, "Can only update your own comments")

    comment.content = payload.content
    comment.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    sub: str = Depends(require_user_sub)
):
    """Delete a comment (only by the comment author)"""
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")

    if comment.user_id != sub:
        raise HTTPException(403, "Can only delete your own comments")

    db.delete(comment)
    db.commit()
    return {"success": True}
