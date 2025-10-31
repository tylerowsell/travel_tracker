from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Trip, Expense, CategoryBudget, Participant
from schemas import BudgetAnalytics, CategorySpending, DailyTrends, DailySpending
from auth import get_user_sub
from sqlalchemy import func
from typing import List
from datetime import timedelta
from collections import defaultdict

router = APIRouter()

@router.get("/analytics/{trip_id}/budget-vs-actual", response_model=BudgetAnalytics)
def get_budget_vs_actual(
    trip_id: int,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Get budget vs actual spending analysis by category.
    Returns planned amounts, actual spending, variance, and percentage utilization.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Get all category budgets
    category_budgets = db.query(CategoryBudget).filter(
        CategoryBudget.trip_id == trip_id
    ).all()

    # Calculate actual spending per category (converted to home currency)
    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).all()

    actual_by_category = defaultdict(float)
    for expense in expenses:
        category = expense.category or "other"
        # Convert to home currency
        if expense.fx_rate_to_home:
            amount_home = float(expense.amount) * expense.fx_rate_to_home
        else:
            amount_home = float(expense.amount)
        actual_by_category[category] += amount_home

    # Build category spending list
    categories_list = []
    total_planned = 0
    total_spent = 0

    # Get all categories (from budgets and actual expenses)
    all_categories = set()
    for cb in category_budgets:
        all_categories.add(cb.category)
    for cat in actual_by_category.keys():
        all_categories.add(cat)

    for category in all_categories:
        planned = 0
        for cb in category_budgets:
            if cb.category == category:
                planned = float(cb.planned_amount)
                break

        actual = actual_by_category.get(category, 0)
        variance = actual - planned
        variance_percent = ((variance / planned) * 100) if planned > 0 else 0

        categories_list.append(CategorySpending(
            category=category,
            planned=planned,
            actual=actual,
            variance=variance,
            variance_percent=variance_percent
        ))

        total_planned += planned
        total_spent += actual

    # If no category budgets exist but trip has total_budget, use that
    if not category_budgets and trip.total_budget:
        total_planned = float(trip.total_budget)

    remaining = total_planned - total_spent
    utilization_percent = (total_spent / total_planned * 100) if total_planned > 0 else 0

    return BudgetAnalytics(
        total_planned=total_planned,
        total_spent=total_spent,
        remaining=remaining,
        utilization_percent=utilization_percent,
        categories=categories_list
    )


@router.get("/analytics/{trip_id}/daily-trends", response_model=DailyTrends)
def get_daily_trends(
    trip_id: int,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Get daily spending trends with burn rate analysis.
    Shows spending per day, average daily spend, and projected total.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Get expenses grouped by date
    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).all()

    # Group by date
    daily_map = defaultdict(lambda: {"amount": 0, "count": 0})
    for expense in expenses:
        # Convert to home currency
        if expense.fx_rate_to_home:
            amount_home = float(expense.amount) * expense.fx_rate_to_home
        else:
            amount_home = float(expense.amount)

        daily_map[expense.dt]["amount"] += amount_home
        daily_map[expense.dt]["count"] += 1

    # Build daily spending list
    days_list = []
    total_spent = 0
    for dt, data in sorted(daily_map.items()):
        days_list.append(DailySpending(
            date=dt,
            amount=data["amount"],
            num_expenses=data["count"]
        ))
        total_spent += data["amount"]

    # Calculate average daily spending
    num_days_with_expenses = len(days_list)
    average_daily = total_spent / num_days_with_expenses if num_days_with_expenses > 0 else 0

    # Calculate projected total based on trip duration
    trip_duration = (trip.end_date - trip.start_date).days + 1
    projected_total = average_daily * trip_duration

    return DailyTrends(
        days=days_list,
        average_daily=average_daily,
        per_diem_budget=float(trip.per_diem_budget) if trip.per_diem_budget else None,
        projected_total=projected_total
    )


@router.get("/analytics/{trip_id}/category-breakdown")
def get_category_breakdown(
    trip_id: int,
    db: Session = Depends(get_db),
    user_sub: str = Depends(get_user_sub)
):
    """
    Get simple category breakdown showing total spent per category.
    Useful for pie/donut charts.
    """
    # Verify trip ownership
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_sub == user_sub
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Get expenses
    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).all()

    # Group by category
    category_totals = defaultdict(float)
    for expense in expenses:
        category = expense.category or "other"
        # Convert to home currency
        if expense.fx_rate_to_home:
            amount_home = float(expense.amount) * expense.fx_rate_to_home
        else:
            amount_home = float(expense.amount)
        category_totals[category] += amount_home

    # Return as list of dicts
    result = [
        {"category": cat, "total": amount}
        for cat, amount in category_totals.items()
    ]

    return result
