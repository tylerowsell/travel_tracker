from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List
from database import get_db
import models
import schemas
from auth import require_user_sub
from utils import min_cash_flow

router = APIRouter(prefix="/balances", tags=["balances"])

@router.get("/{trip_id}/net", response_model=List[schemas.BalanceLine])
def compute_net(trip_id: int, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.owner_sub == sub).first()
    if not trip:
        raise HTTPException(404, "Trip not found")

    parts = db.query(models.Participant).filter(models.Participant.trip_id == trip_id).all()
    ids = [p.id for p in parts]
    id_to_weight = {p.id: (p.weight or 1.0) for p in parts}

    balances = {pid: 0.0 for pid in ids}

    for exp in trip.expenses:
        fx = exp.fx_rate_to_home or 1.0  # assume already home currency if None
        total_home = float(exp.amount) * fx

        # Payer pays upfront
        balances[exp.payer_id] += total_home

        # Determine shares
        splits = exp.splits or []
        if not splits:
            # equal among all
            share = total_home / len(ids)
            for pid in ids:
                balances[pid] -= share
        else:
            # weighted/custom
            if any(s.share_type == "custom" for s in splits):
                total_custom = sum((s.share_value or 0) for s in splits)
                for s in splits:
                    frac = (s.share_value or 0) / total_custom if total_custom else 0
                    balances[s.participant_id] -= total_home * frac
            elif any(s.share_type == "weight" for s in splits):
                total_w = sum(id_to_weight.get(s.participant_id, 1.0) for s in splits)
                for s in splits:
                    w = id_to_weight.get(s.participant_id, 1.0)
                    balances[s.participant_id] -= total_home * (w / total_w if total_w else 0)
            else:
                # equal among listed
                listed = [s.participant_id for s in splits]
                share = total_home / (len(listed) or 1)
                for pid in listed:
                    balances[pid] -= share

    return [{"participant_id": pid, "net_amount_home": round(amt, 2)} for pid, amt in balances.items()]

@router.get("/{trip_id}/settlements", response_model=List[schemas.SettlementLine])
def settlements(trip_id: int, db: Session = Depends(get_db), sub: str = Depends(require_user_sub)):
    net = compute_net(trip_id, db, sub)  # reuse logic
    balances = {row["participant_id"]: row["net_amount_home"] for row in net} if isinstance(net, list) else {r.participant_id: r.net_amount_home for r in net}
    return min_cash_flow(balances)
