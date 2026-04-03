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

### AI Content Pipeline
- `POST /api/ai/search` - Search for supplementary sources.
    - Body: `{ query: "forex risk management" }`
    - Provider: Serper.dev (Google, Reddit, X results)
    - Response: `{ results: [{ title, url, snippet }] }`
- `POST /api/ai/rewrite` - Multi-source AI content rewrite.
    - Body: `{ url: "...", tone: "conversational", supplementaryUrls?: [...] }`
    - Provider: FireCrawl (scrape) + Gemini 2.5 Flash (rewrite)
    - Response: `{ title, content, metaDescription, tone, sourceUrls }`

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
AI endpoints (`/api/ai/*`) require admin role.
