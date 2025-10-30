from typing import Dict, List
from decimal import Decimal, ROUND_HALF_UP

def to_cents(value: float) -> int:
    return int(Decimal(str(value)).scaleb(2).to_integral_value(rounding=ROUND_HALF_UP))

def from_cents(cents: int) -> float:
    return float(Decimal(cents) / Decimal(100))

def min_cash_flow(balances: Dict[int, float]) -> List[Dict]:
    # balances: participant_id -> net_amount (positive = should receive, negative = owes)
    cents = {pid: to_cents(v) for pid, v in balances.items() if abs(v) > 1e-8}
    debtors = [(pid, amt) for pid, amt in cents.items() if amt < 0]
    creditors = [(pid, amt) for pid, amt in cents.items() if amt > 0]

    debtors.sort(key=lambda x: x[1])   # most negative first
    creditors.sort(key=lambda x: -x[1])# most positive first

    settlements = []
    i = j = 0
    while i < len(debtors) and j < len(creditors):
        d_pid, d_amt = debtors[i]
        c_pid, c_amt = creditors[j]
        pay = min(-d_amt, c_amt)
        if pay > 0:
            settlements.append({
                "from_participant_id": d_pid,
                "to_participant_id": c_pid,
                "amount_home": from_cents(pay)
            })
            d_amt += pay
            c_amt -= pay
            debtors[i] = (d_pid, d_amt)
            creditors[j] = (c_pid, c_amt)
        if d_amt == 0: i += 1
        if c_amt == 0: j += 1
    return settlements
