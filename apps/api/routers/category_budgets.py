from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Trip, CategoryBudget
from schemas import CategoryBudgetCreate, CategoryBudgetOut
from auth import get_user_sub
from typing import List

router = APIRouter()

@router.post("/category-budgets/{trip_id}", response_model=CategoryBudgetOut, status_code=201)
def create_category_budget(
    trip_id: int,
    category_budget: CategoryBudgetCreate,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Create or update a category budget for a trip.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Check if budget for this category already exists
    existing = db.query(CategoryBudget).filter(
        CategoryBudget.trip_id == trip_id,
        CategoryBudget.category == category_budget.category
    ).first()

    if existing:
        # Update existing
        existing.planned_amount = category_budget.planned_amount
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new
        db_category_budget = CategoryBudget(
            trip_id=trip_id,
            category=category_budget.category,
            planned_amount=category_budget.planned_amount
        )

        db.add(db_category_budget)
        db.commit()
        db.refresh(db_category_budget)

        return db_category_budget


@router.get("/category-budgets/{trip_id}", response_model=List[CategoryBudgetOut])
def list_category_budgets(
    trip_id: int,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    List all category budgets for a trip.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    budgets = db.query(CategoryBudget).filter(
        CategoryBudget.trip_id == trip_id
    ).all()

    return budgets


@router.delete("/category-budgets/{trip_id}/{category_budget_id}", status_code=204)
def delete_category_budget(
    trip_id: int,
    category_budget_id: int,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Delete a category budget.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    budget = db.query(CategoryBudget).filter(
        CategoryBudget.id == category_budget_id,
        CategoryBudget.trip_id == trip_id
    ).first()

    if not budget:
        raise HTTPException(status_code=404, detail="Category budget not found")

    db.delete(budget)
    db.commit()

    return None


@router.post("/category-budgets/{trip_id}/bulk", response_model=List[CategoryBudgetOut])
def bulk_create_category_budgets(
    trip_id: int,
    budgets: List[CategoryBudgetCreate],
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Create multiple category budgets at once.
    Useful for setting up a complete budget plan.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    created_budgets = []

    for budget in budgets:
        # Check if exists
        existing = db.query(CategoryBudget).filter(
            CategoryBudget.trip_id == trip_id,
            CategoryBudget.category == budget.category
        ).first()

        if existing:
            # Update
            existing.planned_amount = budget.planned_amount
            created_budgets.append(existing)
        else:
            # Create
            db_budget = CategoryBudget(
                trip_id=trip_id,
                category=budget.category,
                planned_amount=budget.planned_amount
            )
            db.add(db_budget)
            created_budgets.append(db_budget)

    db.commit()

    # Refresh all
    for budget in created_budgets:
        db.refresh(budget)

    return created_budgets
