import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import (
    trips,
    participants,
    itinerary,
    expenses,
    balances,
    exchange,
    analytics,
    accommodations,
    category_budgets,
    settlements
)

ENV = os.environ.get("ENV", "local")
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")]

# Create tables (Alembic recommended for prod; this helps in dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Travel Tracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trips.router)
app.include_router(participants.router)
app.include_router(itinerary.router)
app.include_router(expenses.router)
app.include_router(balances.router)
app.include_router(exchange.router)
app.include_router(analytics.router)
app.include_router(accommodations.router)
app.include_router(category_budgets.router)
app.include_router(settlements.router)

@app.get("/health")
def health():
    return {"status": "ok", "env": ENV}
