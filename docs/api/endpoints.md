# API Reference

The project uses Next.js API Routes (Serverless Functions) to interact with the Supabase backend.

## Base URL
`/api`

## Endpoints

### Analytics
- `GET /api/analytics` - Fetch dashboard data.
  - Query Params: `startDate`, `endDate`, `accountId`.

### Accounts
- `GET /api/accounts` - List trading accounts.
- `POST /api/accounts` - Create new trading account.

### Journal
- `GET /api/journal` - List journal entries.
    - Query: `?page=1&limit=10&symbol=EURUSD`
    - Response:
      ```json
      {
        "data": [...],
        "meta": { "total": 50, "page": 1, "lastPage": 5 }
      }
      ```
- `POST /api/journal` - Create new journal entry.
    - Body: `{ symbol: "XAUUSD", type: "BUY", ... }`

### Strategies
- `GET /api/strategies` - List strategies.
- `POST /api/strategies` - Create strategy.

## Error Handling
All API responses follow a standard format for errors:
```json
{
  "error": "Invalid input parameters",
  "code": "VALIDATION_ERROR"
}
```


## Authentication
All API routes are protected. Requests must include a valid session cookie from Supabase Auth.
