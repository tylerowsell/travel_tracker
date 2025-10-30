import os
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import httpx
from ..database import get_db
from .. import models

router = APIRouter(prefix="/fx", tags=["fx"])

FX_BASE_URL = os.environ.get("FX_BASE_URL", "https://api.exchangerate.host")

@router.get("/rate")
async def get_fx_rate(on: date, from_ccy: str, to_ccy: str, db: Session = Depends(get_db)):
    from_ccy, to_ccy = from_ccy.upper(), to_ccy.upper()
    # Check cache
    fx = db.query(models.ExchangeRate).filter(models.ExchangeRate.date == on, models.ExchangeRate.from_ccy == from_ccy, models.ExchangeRate.to_ccy == to_ccy).first()
    if fx:
        return {"rate": fx.rate, "cached": True}
    # Fetch
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{FX_BASE_URL}/{on.isoformat()}", params={"base": from_ccy, "symbols": to_ccy})
        r.raise_for_status()
        data = r.json()
        rate = data.get("rates", {}).get(to_ccy)
        if rate is None:
            raise RuntimeError("FX rate not available")
        fx = models.ExchangeRate(date=on, from_ccy=from_ccy, to_ccy=to_ccy, rate=rate)
        db.add(fx); db.commit()
        return {"rate": rate, "cached": False}
