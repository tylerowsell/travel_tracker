# Plaid Integration Plan for Travel Tracker

## Overview
Integrate Plaid to automatically import and categorize expenses from users' bank accounts and credit cards, eliminating manual expense entry.

## Features

### 1. **Automated Expense Import**
- Connect bank accounts and credit cards via Plaid Link
- Automatically pull transactions during trip dates
- Smart categorization using transaction merchant data
- Location data from transaction details

### 2. **Smart Transaction Categorization**
- Machine learning to categorize transactions:
  - `accommodation` → Hotels, Airbnb, VRBO
  - `food` → Restaurants, cafes, grocery stores
  - `transport` → Airlines, rental cars, gas, rideshare, public transit
  - `activities` → Entertainment, tours, tickets, museums
  - `shopping` → Retail, souvenirs
  - `other` → Everything else

### 3. **Receipt Attachment**
- Plaid can provide receipt images for some transactions
- Automatically attach when available
- Allow manual upload for missing receipts

### 4. **Multi-Currency Support**
- Plaid provides original transaction currency
- Auto-convert to trip home currency
- Store FX rates for accurate reporting

---

## Technical Implementation

### Backend Architecture

#### 1. **Add Plaid Dependencies**
```python
# requirements.txt
plaid-python==14.0.0
```

#### 2. **Environment Variables**
```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret_key
PLAID_ENV=sandbox  # or development/production
```

#### 3. **New Database Models**
```python
class PlaidItem(Base):
    """Stores Plaid connection for a user"""
    __tablename__ = "plaid_items"
    id = Column(Integer, primary_key=True)
    user_sub = Column(String, nullable=False, index=True)
    access_token = Column(String, nullable=False)  # Encrypted
    item_id = Column(String, nullable=False)
    institution_id = Column(String)
    institution_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_synced_at = Column(DateTime, nullable=True)


class PlaidTransaction(Base):
    """Stores imported Plaid transactions"""
    __tablename__ = "plaid_transactions"
    id = Column(Integer, primary_key=True)
    plaid_item_id = Column(Integer, ForeignKey("plaid_items.id"))
    transaction_id = Column(String, unique=True)  # Plaid transaction ID
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=True)  # Linked expense
    merchant_name = Column(String)
    amount = Column(Numeric(12,2))
    currency = Column(String)
    date = Column(Date)
    category = Column(String)  # Plaid category
    location_address = Column(String, nullable=True)
    location_city = Column(String, nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    pending = Column(Boolean, default=False)
    imported_at = Column(DateTime, default=datetime.utcnow)
```

#### 4. **New API Endpoints**

```python
# routers/plaid.py
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.transactions_sync_request import TransactionsSyncRequest

@router.post("/plaid/create-link-token")
async def create_link_token(user_sub: str = Depends(get_user_sub)):
    """Generate Plaid Link token for frontend"""
    request = LinkTokenCreateRequest(
        user={"client_user_id": user_sub},
        client_name="Travel Tracker",
        products=["transactions"],
        country_codes=["US", "CA", "GB", "EU"],
        language="en",
    )
    response = plaid_client.link_token_create(request)
    return {"link_token": response.link_token}


@router.post("/plaid/exchange-token")
async def exchange_public_token(
    public_token: str,
    institution_id: str,
    institution_name: str,
    user_sub: str = Depends(get_user_sub),
    db: Session = Depends(get_db)
):
    """Exchange public token for access token and store"""
    exchange_response = plaid_client.item_public_token_exchange(
        PublicTokenExchangeRequest(public_token=public_token)
    )

    # Encrypt and store access token
    plaid_item = PlaidItem(
        user_sub=user_sub,
        access_token=encrypt(exchange_response.access_token),
        item_id=exchange_response.item_id,
        institution_id=institution_id,
        institution_name=institution_name,
    )
    db.add(plaid_item)
    db.commit()

    return {"success": True, "item_id": plaid_item.id}


@router.post("/plaid/sync-transactions/{trip_id}")
async def sync_transactions(
    trip_id: int,
    plaid_item_id: int,
    user_sub: str = Depends(get_user_sub),
    db: Session = Depends(get_db)
):
    """Sync transactions from Plaid for trip dates"""
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.owner_sub == user_sub).first()
    if not trip:
        raise HTTPException(404, "Trip not found")

    plaid_item = db.query(PlaidItem).filter(
        PlaidItem.id == plaid_item_id,
        PlaidItem.user_sub == user_sub
    ).first()
    if not plaid_item:
        raise HTTPException(404, "Plaid connection not found")

    # Sync transactions
    access_token = decrypt(plaid_item.access_token)
    request = TransactionsSyncRequest(access_token=access_token)
    response = plaid_client.transactions_sync(request)

    # Filter transactions by trip dates
    imported_count = 0
    for txn in response.added:
        if trip.start_date <= txn.date <= trip.end_date:
            # Save transaction
            plaid_txn = PlaidTransaction(
                plaid_item_id=plaid_item.id,
                transaction_id=txn.transaction_id,
                merchant_name=txn.merchant_name or txn.name,
                amount=abs(txn.amount),
                currency=txn.iso_currency_code,
                date=txn.date,
                category=categorize_transaction(txn.category),
                location_address=txn.location.address if txn.location else None,
                location_city=txn.location.city if txn.location else None,
                location_lat=txn.location.lat if txn.location else None,
                location_lng=txn.location.lon if txn.location else None,
                pending=txn.pending,
            )
            db.add(plaid_txn)
            imported_count += 1

    db.commit()
    return {"imported_count": imported_count}


@router.post("/plaid/create-expense-from-transaction")
async def create_expense_from_transaction(
    plaid_transaction_id: int,
    trip_id: int,
    payer_id: int,
    splits: List[ExpenseSplitCreate],
    user_sub: str = Depends(get_user_sub),
    db: Session = Depends(get_db)
):
    """Convert a Plaid transaction into an expense"""
    plaid_txn = db.query(PlaidTransaction).filter(
        PlaidTransaction.id == plaid_transaction_id
    ).first()

    if not plaid_txn or plaid_txn.expense_id:
        raise HTTPException(400, "Transaction already imported or not found")

    # Create expense from transaction
    expense = Expense(
        trip_id=trip_id,
        payer_id=payer_id,
        dt=plaid_txn.date,
        amount=plaid_txn.amount,
        currency=plaid_txn.currency,
        category=plaid_txn.category,
        merchant_name=plaid_txn.merchant_name,
        location_text=f"{plaid_txn.location_city}" if plaid_txn.location_city else None,
        lat=plaid_txn.location_lat,
        lng=plaid_txn.location_lng,
        fx_rate_to_home=1.0,  # Calculate actual FX rate
    )
    db.add(expense)
    db.flush()

    # Add splits
    for split in splits:
        db.add(ExpenseSplit(
            expense_id=expense.id,
            participant_id=split.participant_id,
            share_type=split.share_type,
            share_value=split.share_value
        ))

    # Link transaction to expense
    plaid_txn.expense_id = expense.id
    db.commit()

    return {"expense_id": expense.id}


def categorize_transaction(plaid_categories: List[str]) -> str:
    """Map Plaid categories to our expense categories"""
    if not plaid_categories:
        return "other"

    category_mapping = {
        "Travel": {
            "Airlines and Aviation Services": "transport",
            "Car Service": "transport",
            "Taxi": "transport",
            "Public Transportation": "transport",
            "Lodging": "accommodation",
            "Hotels and Motels": "accommodation"
        },
        "Food and Drink": "food",
        "Shops": "shopping",
        "Recreation": "activities"
    }

    # Match primary category
    primary = plaid_categories[0]
    for key, value in category_mapping.items():
        if isinstance(value, dict):
            # Check detailed category
            if len(plaid_categories) > 1:
                detailed = plaid_categories[1]
                if detailed in value:
                    return value[detailed]
        elif primary == key:
            return value

    return "other"
```

### Frontend Implementation

#### 1. **Install Plaid Link SDK**
```json
{
  "dependencies": {
    "react-plaid-link": "^3.5.0"
  }
}
```

#### 2. **Plaid Connection Component**
```typescript
// components/plaid-connect.tsx
import { usePlaidLink } from 'react-plaid-link';

export function PlaidConnect({ onSuccess }: { onSuccess: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    // Fetch link token from backend
    api.post('/plaid/create-link-token').then(res => {
      setLinkToken(res.data.link_token);
    });
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      // Exchange token
      await api.post('/plaid/exchange-token', {
        public_token,
        institution_id: metadata.institution.institution_id,
        institution_name: metadata.institution.name,
      });
      onSuccess();
    },
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="btn-primary"
    >
      Connect Bank Account
    </button>
  );
}
```

#### 3. **Transaction Import UI**
```typescript
// components/plaid-transactions.tsx
export function PlaidTransactions({ tripId }: { tripId: number }) {
  const { data: plaidItems } = useQuery(['plaid-items'], fetchPlaidItems);
  const { data: transactions } = useQuery(['plaid-transactions', tripId],
    () => fetchTransactions(tripId)
  );

  return (
    <div>
      <h3>Import Transactions</h3>

      {/* Connected Accounts */}
      {plaidItems?.map(item => (
        <button
          key={item.id}
          onClick={() => syncTransactions(tripId, item.id)}
        >
          Sync {item.institution_name}
        </button>
      ))}

      {/* Pending Transactions */}
      <div className="transaction-list">
        {transactions?.filter(t => !t.expense_id).map(txn => (
          <TransactionCard
            key={txn.id}
            transaction={txn}
            onImport={(splits) => createExpenseFromTransaction(txn.id, splits)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Security Considerations

1. **Encrypt Access Tokens**: Never store Plaid access tokens in plain text
2. **Use Webhook**: Set up Plaid webhooks for real-time transaction updates
3. **Token Rotation**: Implement access token rotation for security
4. **Audit Logging**: Log all Plaid API calls for debugging and security
5. **Rate Limiting**: Respect Plaid API rate limits

---

## Cost Estimation

**Plaid Pricing (2024)**:
- Development: Free (100 Items)
- Production: $0.30 per Item/month + $0.20 per verification
- Transactions: Included

**Estimated Monthly Cost for 1,000 Users**:
- ~200 active users with linked accounts
- Cost: $60/month ($0.30 × 200)

---

## Implementation Timeline

### Phase 1 (Week 1-2): Backend Setup
- [ ] Add Plaid SDK to backend
- [ ] Create database models
- [ ] Implement token exchange endpoints
- [ ] Build transaction sync logic
- [ ] Add categorization algorithm

### Phase 2 (Week 3-4): Frontend Integration
- [ ] Add Plaid Link component
- [ ] Build transaction review UI
- [ ] Implement expense creation from transactions
- [ ] Add bulk import functionality

### Phase 3 (Week 5-6): Polish & Testing
- [ ] Set up webhooks for automatic sync
- [ ] Add receipt attachment flow
- [ ] Implement error handling
- [ ] Testing with sandbox accounts
- [ ] Production deployment

---

## Alternative: Manual CSV Import

For users who prefer not to connect bank accounts:

1. **CSV Upload Feature**
   - Support common bank CSV formats
   - Parse and categorize transactions
   - Map to expense structure

2. **Supported Banks**
   - Chase, Bank of America, Wells Fargo
   - Capital One, American Express
   - Generic CSV with customizable mapping

---

## Future Enhancements

1. **Receipt OCR**: Use Plaid's receipt data + OCR for automatic receipt matching
2. **Duplicate Detection**: Smart duplicate checking across manual and auto imports
3. **Budgeting Insights**: Analyze historical spending for budget recommendations
4. **Credit Card Points**: Track rewards earned during trips
5. **Multi-Account Aggregation**: Combine transactions from multiple cards/accounts

---

## Notes for Developer

- Start with Plaid **Sandbox** environment for development
- Use Plaid's **test credentials** for demo purposes
- Implement **incremental sync** for better performance
- Consider **batch processing** for large transaction volumes
- Add **user notifications** when new transactions are available

---

**Ready to implement?** Start with Phase 1 backend setup!
