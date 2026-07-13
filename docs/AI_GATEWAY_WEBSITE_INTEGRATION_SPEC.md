# GoldScalperNinja AI Gateway - Website Integration Specification

## 1. Mục Tiêu

Tài liệu này mô tả chức năng AI Gateway cho website GoldScalperNinja.

Mục tiêu dài hạn là để tab AI trong EA `GoldScalperNinja - TradeManager` không gọi trực tiếp DeepSeek hoặc bất kỳ AI provider nào nữa. Thay vào đó, EA sẽ gửi market snapshot lên website/API riêng của GoldScalperNinja. Website sẽ đóng vai trò AI Gateway, tự chọn model phía sau như DeepSeek, Claude, Gemini, Grok hoặc ChatGPT/OpenAI, sau đó trả về một JSON verdict chuẩn cho EA hiển thị.

Thiết kế này giúp:

- Không lộ provider thật đang sử dụng.
- Không lộ API key của DeepSeek/Claude/Gemini/OpenAI trong EA.
- Có thể đổi model phía backend mà không cần phát hành lại EA.
- Có thể quản lý user/license/quota cho cộng đồng.
- Có thể log, rate limit, audit và cải thiện prompt tập trung trên server.
- Có thể chuẩn hóa output để EA luôn nhận cùng một response contract.

## 2. Kiến Trúc Tổng Quan

```text
MetaTrader 5 EA
  GoldScalperNinja - TradeManager
    AI Tab
      BuildAITradingSnapshotJson()
      WebRequest()
        |
        v
GoldScalperNinja Website/API
  /api/ai/analyze
    Auth / License Check
    Request Validation
    Prompt Builder
    Model Router
      DeepSeek / Claude / Gemini / Grok / OpenAI
    Response Parser
    Safety Validator
    Normalized JSON Response
    Request / Attempt Logger
        |
        v
EA AI Tab
  ParseAIResult()
  Display Verdict
  Apply To Trade Tab, manual only

GoldScalperNinja Admin Console
  Provider & Model Management
  Encrypted API Key Management
  Routing & Fallback Policies
  Prompt Versions
  Request Explorer / Attempt Detail
  Usage, Cost, Health, Alerts, Audit
        |
        v
AI Gateway Control Plane
  Database + Encrypted Secret Store + Object Storage
```

EA không cần biết backend đang dùng model nào. EA chỉ cần biết endpoint của GoldScalperNinja.

Ví dụ endpoint tương lai:

```text
https://api.goldscalperninja.com/v1/ai/analyze
```

## 3. Nguyên Tắc Thiết Kế

1. EA chỉ là client.
2. Website/API là nơi quản lý model, prompt, key, quota và validation.
3. AI chỉ đưa phân tích và plan tham khảo, không tự đặt lệnh.
4. Response trả về EA phải là JSON ổn định, không phụ thuộc provider.
5. Không expose tên provider thật cho user cuối.
6. Không gửi API key provider xuống EA.
7. Không cho AI trả stop-style entry nếu workflow không dùng stop order.
8. Nếu AI response sai schema hoặc vi phạm safety rule, server phải trả `WAIT`.
9. EA vẫn giữ guard cuối cùng để không apply setup nguy hiểm.

## 4. Trạng Thái Hiện Tại Trong EA

Hiện EA đang có các phần chính:

- `BuildAITradingSnapshotJson()` trong `GoldScalperNinja - TradeManager.mq5`
- `CGSN_AIEngine::BuildSystemPrompt()` trong `Include/GSN_AI_Engine.mqh`
- `CGSN_AIEngine::CallDeepSeek()`
- `CGSN_AIEngine::ParseAIResult()`
- AI tab UI: Analyze, Apply To Trade Tab, Strategy, Risk Profile, Auto Scan

Hiện tại EA vẫn có các input liên quan provider:

```text
InpAIApiKey
InpAIProvider
InpAIModel
InpAITimeoutMs
InpAIMaxOutputTokens
InpAIUseJsonMode
```

Khi chuyển sang website gateway, các input này nên đổi dần thành:

```text
InpAIGatewayUrl
InpAIGatewayToken
InpAITimeoutMs
InpAIScanCooldownSec
InpAIAutoScanEnabled
InpAIAutoScanIntervalSec
InpAIApplyMinConfidence
```

Provider/model thật sẽ nằm ở server.

## 5. API Endpoint Đề Xuất

### 5.1 Analyze Endpoint

```http
POST /v1/ai/analyze
Content-Type: application/json
Authorization: Bearer <user_or_license_token>
X-GSN-Client: trade-manager-mt5
X-GSN-Version: 1.0.0
```

Request body:

```json
{
  "client": {
    "app": "GoldScalperNinja Trade Manager",
    "platform": "MT5",
    "version": "1.0.0",
    "account_login_hash": "optional_hash",
    "terminal_id": "optional_terminal_id"
  },
  "license": {
    "key": "GSN-USER-LICENSE-KEY",
    "community_user_id": "optional_user_id"
  },
  "analysis": {
    "mode": "manual",
    "source": "ai_tab",
    "request_id": "optional-client-generated-id"
  },
  "snapshot": {
    "version": "1.1",
    "symbol": "XAUUSD",
    "server_time": "2026.07.09 15:30:00",
    "chart_timeframe": "M1",
    "ai_profile": {},
    "price": {},
    "trend": {},
    "zones": {},
    "fvg": {},
    "trade_plan": {},
    "positions": {},
    "constraints": {}
  }
}
```

Trong phase đầu, EA có thể gửi thẳng JSON hiện tại của `BuildAITradingSnapshotJson()` dưới field `snapshot`.

### 5.2 Health Endpoint

```http
GET /v1/ai/health
Authorization: Bearer <token>
```

Response:

```json
{
  "ok": true,
  "service": "gsn-ai-gateway",
  "status": "ready",
  "server_time": "2026-07-09T08:30:00Z"
}
```

### 5.3 Usage Endpoint

```http
GET /v1/ai/usage
Authorization: Bearer <token>
```

Response:

```json
{
  "ok": true,
  "plan": "pro",
  "daily_limit": 100,
  "used_today": 12,
  "remaining_today": 88,
  "reset_at": "2026-07-10T00:00:00Z"
}
```

## 6. Response Contract Cho EA

Website phải trả về JSON đã normalize theo schema EA đang parse được.

```json
{
  "ok": true,
  "provider_hidden": true,
  "request_id": "srv_abc123",
  "action": "WAIT",
  "confidence": 60,
  "market_analysis": "H4 remains bearish while H1 is mixed. M15 shows short-term bullish pressure near current price, so no clean sell entry is ready. Wait for price to pull back into a valid supply zone above current price or for fresh structure confirmation.",
  "short_term_trend": "M15 is bullish, M30 is mixed, and H1 is not aligned enough for a clean entry.",
  "price_forecast": "Price may range near current highs until a clean rejection or pullback forms.",
  "reason": "No valid pullback entry is available and stop-style entries are disabled.",
  "invalidation": "A clean bullish structure break above the resistance cluster invalidates the bearish idea.",
  "risk_note": "Avoid chasing breakdown entries below current price because this workflow does not use stop orders.",
  "entry": 0,
  "sl": 0,
  "tp1": 0,
  "tp2": 0,
  "tp3": 0,
  "rr": 0,
  "reference_action": "WAIT",
  "reference_order_type": "WAIT",
  "reference_trigger": "Wait for a pullback into a valid supply zone above current price, then require rejection confirmation.",
  "reference_entry": 0,
  "reference_sl": 0,
  "reference_tp1": 0,
  "reference_tp2": 0,
  "reference_tp3": 0,
  "reference_rr": 0,
  "server_validation": {
    "schema_valid": true,
    "safety_valid": true,
    "fallback_used": false,
    "model_provider": "hidden",
    "model_alias": "gsn-pa-scalper-v1"
  }
}
```

EA nên chỉ dùng các field chính:

- `action`
- `confidence`
- `market_analysis`
- `short_term_trend`
- `price_forecast`
- `reason`
- `invalidation`
- `risk_note`
- `entry`, `sl`, `tp1`, `tp2`, `tp3`, `rr`
- `reference_action`
- `reference_order_type`
- `reference_entry`, `reference_sl`, `reference_tp1`, `reference_tp2`, `reference_tp3`, `reference_rr`
- `reference_trigger`

Các field như `server_validation`, `provider_hidden`, `request_id` dùng cho debug/log, không bắt buộc hiển thị cho user.

## 7. Safety Rules Bắt Buộc Trên Server

Server không được chỉ tin model. Sau khi model trả response, server phải validate lại.

### 7.1 Schema Rules

- `action` chỉ được là `BUY`, `SELL`, `WAIT`.
- `confidence` phải nằm trong `0..100`.
- Nếu `action = WAIT`, các field immediate `entry/sl/tp1/tp2/tp3/rr` nên là `0`, trừ khi server cố ý hỗ trợ reference plan riêng.
- `reference_order_type` chỉ được là:
  - `BUY`
  - `SELL`
  - `BUY LIMIT`
  - `SELL LIMIT`
  - `WAIT`
- Không cho:
  - `BUY STOP`
  - `SELL STOP`
  - `STOP`
  - `BREAKOUT STOP`
  - bất kỳ alias stop-style nào

### 7.2 No Stop-Style Entry Rules

Với workflow hiện tại, server phải reject các plan sau:

- `SELL` hoặc `SELL LIMIT` có `entry < current_price`
- `BUY` hoặc `BUY LIMIT` có `entry > current_price`
- `reference_action = SELL` và `reference_entry < current_price`
- `reference_action = BUY` và `reference_entry > current_price`

Nếu vi phạm, server phải trả fallback:

```json
{
  "action": "WAIT",
  "confidence": 0,
  "reason": "Rejected stop-style entry.",
  "reference_action": "WAIT",
  "reference_order_type": "WAIT",
  "reference_entry": 0,
  "reference_sl": 0,
  "reference_tp1": 0,
  "reference_tp2": 0,
  "reference_tp3": 0,
  "reference_rr": 0
}
```

### 7.3 Price Geometry Rules

BUY setup hợp lệ:

- `entry > 0`
- `sl < entry`
- `tp1 > entry`
- `tp2 >= tp1` nếu có
- `tp3 >= tp2` nếu có

SELL setup hợp lệ:

- `entry > 0`
- `sl > entry`
- `tp1 < entry`
- `tp2 <= tp1` nếu có
- `tp3 <= tp2` nếu có

Nếu sai geometry, server trả `WAIT`.

### 7.4 RR Rules

RR chính nên tính theo TP1:

```text
BUY risk   = entry - sl
BUY reward = tp1 - entry

SELL risk   = sl - entry
SELL reward = entry - tp1

rr = reward / risk
```

Không dùng TP3 làm RR chính vì TP3 là extended target, dễ làm setup nhìn đẹp hơn thực tế.

Server nên tự tính lại `rr` và `reference_rr`, không tin model.

### 7.5 XAUUSD Scalping Rules

- Không chase breakout bằng stop order.
- Không sell dưới current price nếu không dùng stop order.
- Không buy trên current price nếu không dùng stop order.
- Ưu tiên pullback vào supply/demand/OB/FVG có quality.
- Nếu current price ở giữa range hoặc quá xa vùng entry hợp lệ, trả `WAIT`.
- Conservative risk profile phải ưu tiên `WAIT` khi HTF conflict.

## 8. Model Router

Server phải có một lớp model router độc lập với provider SDK. Provider được định danh bằng enum ổn định, không dùng tên model làm provider id.

### 8.1 Provider Enum Chuẩn

```ts
enum AIProvider {
  PROVIDER_UNSPECIFIED = 0,
  PROVIDER_ANTHROPIC   = 1, // Anthropic (Claude)
  PROVIDER_OPENAI      = 2, // OpenAI (GPT)
  PROVIDER_GOOGLE      = 3, // Google (Gemini)
  PROVIDER_DEEPSEEK    = 4, // DeepSeek
  PROVIDER_XAI         = 5  // xAI (Grok)
}
```

Quy ước:

- Giá trị enum không được thay đổi sau khi production vì sẽ được lưu trong database và audit log.
- `PROVIDER_UNSPECIFIED` chỉ dùng cho dữ liệu cũ hoặc lỗi validation, không được route request thật.
- Tên hiển thị có thể đổi trong Admin, nhưng `provider_code` và enum id phải bất biến.
- Provider thật chỉ hiển thị trong Admin. Response cho EA vẫn dùng `provider_hidden: true`.

### 8.2 Provider Adapter Contract

Mỗi provider phải implement cùng một contract nội bộ:

```ts
interface AIProviderAdapter {
  provider: AIProvider;
  validateCredential(secret: DecryptedSecret): Promise<CredentialCheck>;
  healthCheck(config: ProviderRuntimeConfig): Promise<ProviderHealth>;
  buildRequest(input: NormalizedAIInput): ProviderHttpRequest;
  execute(request: ProviderHttpRequest): Promise<ProviderHttpResponse>;
  extractResult(response: ProviderHttpResponse): ProviderAttemptResult;
}

type ProviderAttemptResult = {
  text: string;
  providerRequestId?: string;
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  finishReason?: string;
  latencyMs: number;
  estimatedCostUsd?: number;
};
```

Adapter chịu trách nhiệm khác biệt về request/response của Claude, GPT, Gemini, DeepSeek và Grok. Router, parser, safety validator và EA response không được phụ thuộc SDK riêng của provider.

### 8.3 Provider Configuration

Mỗi provider cần cấu hình tối thiểu:

```text
provider_id
provider_code
display_name
enabled
base_url
default_model
allowed_models
timeout_ms
max_output_tokens
supports_json_mode
health_status
health_checked_at
created_at
updated_at
```

API key không được lưu chung trong record provider. Secret phải nằm trong kho secret riêng và chỉ tham chiếu bằng `credential_id`.

### 8.4 Routing Policy

Admin có thể chọn một trong hai chế độ:

- `FIXED`: luôn gọi đúng provider/model được chọn.
- `AUTO_FAILOVER`: gọi primary, sau đó thử fallback theo thứ tự.

Ví dụ policy:

```json
{
  "name": "gsn-scalping-production",
  "mode": "AUTO_FAILOVER",
  "enabled": true,
  "prompt_version": "gsn-pa-scalper-v2",
  "primary": {
    "provider": "PROVIDER_DEEPSEEK",
    "model": "deepseek-chat"
  },
  "fallbacks": [
    {
      "provider": "PROVIDER_OPENAI",
      "model": "admin-selected-openai-model"
    },
    {
      "provider": "PROVIDER_GOOGLE",
      "model": "admin-selected-gemini-model"
    }
  ],
  "max_attempts": 3,
  "retry_on": ["TIMEOUT", "RATE_LIMIT", "HTTP_5XX", "EMPTY_CONTENT", "INVALID_JSON"]
}
```

Policy có thể áp dụng theo thứ tự ưu tiên:

1. Override riêng cho license/user.
2. Product plan: Free, Basic, Pro, VIP.
3. Strategy/risk profile.
4. Global default policy.

Không fallback vô hạn. Mỗi provider chỉ được thử tối đa một lần trong cùng request, trừ khi policy cho phép retry rõ ràng.

Không fallback khi request bị `INVALID_LICENSE`, `QUOTA_EXCEEDED`, `SNAPSHOT_INVALID` hoặc bị server safety validator reject. Fallback chỉ giải quyết lỗi provider/transport/format, không được dùng để vượt safety rule.

### 8.5 Provider Health Và Circuit Breaker

Health status chuẩn:

```text
UNKNOWN
HEALTHY
DEGRADED
UNAVAILABLE
DISABLED
INVALID_CREDENTIAL
```

Router phải bỏ qua provider đang `DISABLED`, `UNAVAILABLE` hoặc `INVALID_CREDENTIAL`. Nếu lỗi liên tiếp vượt threshold, circuit breaker tạm ngừng route vào provider đó và tự thử health check sau cooldown.

### 8.6 Provider Privacy Boundary

EA không nhận tên provider thật. Server chỉ trả alias:

```json
{
  "model_alias": "gsn-pa-scalper-v1"
}
```

Không trả:

```json
{
  "provider": "deepseek",
  "model": "deepseek-v4-flash"
}
```

Admin có quyền phù hợp vẫn được xem provider/model/attempt thật để vận hành và debug.

## 9. Prompt Management Trên Server

Server nên quản lý prompt theo version.

Ví dụ:

```text
prompts/
  gsn-pa-scalper-v1.md
  gsn-pa-scalper-v2.md
  gsn-swing-v1.md
```

Mỗi request nên log prompt version:

```json
{
  "prompt_version": "gsn-pa-scalper-v1",
  "strategy": "SCALPING",
  "risk_profile": "CONSERVATIVE"
}
```

Prompt server phải chứa các rule quan trọng:

- Advisory only, no auto execution.
- Return JSON only.
- Use snapshot only.
- No stop order.
- No stop-style entry.
- Validate price geometry.
- If uncertain, return `WAIT`.
- Use TP1 for primary RR.
- XAUUSD can sweep highs/lows, avoid poor SL placement.

## 10. License Và User Management

Website nên có bảng user/license.

Gợi ý fields:

```text
users
  id
  email
  display_name
  plan
  status
  created_at

licenses
  id
  user_id
  license_key_hash
  status
  max_daily_ai_calls
  max_devices
  expires_at
  created_at

ai_usage_logs
  id
  user_id
  license_id
  request_id
  symbol
  timeframe
  strategy
  risk_profile
  action
  confidence
  model_alias
  prompt_version
  input_tokens
  output_tokens
  latency_ms
  validation_status
  created_at
```

`ai_usage_logs` chỉ nên là bảng summary/materialized view cho dashboard user. Source of truth phục vụ Admin và audit là `ai_requests` cùng `ai_request_attempts` ở mục 15.9.

Không nên lưu license key raw. Chỉ lưu hash.

## 11. Rate Limit Và Quota

Server nên giới hạn theo:

- License key
- User account
- IP
- Terminal/device id
- Symbol/timeframe nếu cần

Ví dụ:

```text
Free: 10 analyses/day
Basic: 30 analyses/day
Pro: 100 analyses/day
VIP: 300 analyses/day
```

Response khi quá quota:

```json
{
  "ok": false,
  "error_code": "QUOTA_EXCEEDED",
  "message": "Daily AI analysis quota exceeded.",
  "retry_after_seconds": 3600
}
```

EA nên hiển thị lỗi này trong AI tab.

## 12. Error Response Chuẩn

Server nên dùng error JSON ổn định.

```json
{
  "ok": false,
  "error_code": "INVALID_LICENSE",
  "message": "License key is invalid or expired.",
  "request_id": "srv_abc123"
}
```

Error codes đề xuất:

```text
INVALID_LICENSE
LICENSE_EXPIRED
DEVICE_LIMIT_EXCEEDED
QUOTA_EXCEEDED
BAD_REQUEST
SNAPSHOT_INVALID
ROUTE_NOT_FOUND
NO_HEALTHY_PROVIDER
CREDENTIAL_INVALID
MODEL_TIMEOUT
MODEL_RATE_LIMITED
MODEL_PROVIDER_ERROR
MODEL_RESPONSE_INVALID
ALL_PROVIDERS_FAILED
SAFETY_REJECTED
SERVER_ERROR
```

## 13. Logging Và Debug

Server nên log đủ để debug nhưng không lưu dữ liệu nhạy cảm quá mức.

Nên log:

- request id
- user/license id
- symbol
- timeframe
- current price
- strategy/risk profile
- selected model alias
- routing policy id/version
- provider/model thật trong server-only log
- credential alias/id, không log secret
- attempt number và fallback reason
- prompt version
- action/confidence
- safety validation result
- latency
- token usage và estimated cost nếu provider hỗ trợ

Không nên log raw API keys.

Raw snapshot có thể lưu có thời hạn ngắn, ví dụ 7-30 ngày, phục vụ debug.

## 14. Security Checklist

- HTTPS bắt buộc.
- Không hardcode provider API key trong EA.
- License key nên gửi qua `Authorization: Bearer`.
- Server lưu license hash, không lưu plain text.
- Có rate limit theo user/IP/device.
- Có request size limit.
- Validate JSON trước khi gọi model.
- Validate model response trước khi trả về EA.
- Có timeout cho provider.
- Có retry/fallback nhưng không retry vô hạn.
- Không trả provider/model thật cho EA nếu mục tiêu là ẩn provider.

## 15. Admin Console Quản Lý AI Gateway

Admin Console là control plane của AI Gateway. Mọi thay đổi provider, API key, model, prompt và routing phải thực hiện ở đây, không sửa trực tiếp trong EA hoặc hardcode trong source backend.

### 15.1 Mục Tiêu Admin

Admin phải có thể:

- Bật/tắt từng provider.
- Chọn provider/model primary và danh sách fallback.
- Thêm, test, rotate và revoke API key.
- Chọn prompt version đang active.
- Xem toàn bộ request AI và từng provider attempt.
- Xem token, latency, chi phí ước tính, error và safety result.
- Lọc request theo user/license/symbol/timeframe/provider/model/status.
- Theo dõi quota, rate limit, provider health và error rate.
- Audit được admin nào đã thay đổi key, model, route hoặc prompt.

### 15.2 Các Màn Hình Chính

```text
Admin / AI Gateway
  Overview
  Providers
  Models
  Routing Policies
  Prompt Versions
  Requests
  Usage & Cost
  Health & Alerts
  Audit Log
```

#### Overview

Hiển thị tối thiểu:

- Requests hôm nay, thành công, thất bại, safety fallback.
- P50/P95 latency.
- Input/output tokens.
- Chi phí ước tính theo provider/model.
- Provider health hiện tại.
- Error rate theo 5 phút, 1 giờ và 24 giờ.
- Top error code.
- Số request bị quota/rate limit.

#### Providers

Mỗi provider card/row hiển thị:

```text
Provider
Enabled
Health status
Base URL
Default model
Active credential alias
Credential last four
Last health check
Success rate 24h
P95 latency 24h
Estimated cost today
```

Các action:

```text
Enable / Disable
Edit Configuration
Add API Key
Test API Key
Rotate API Key
Revoke API Key
Run Health Check
View Recent Requests
```

#### Routing Policies

Admin chọn:

- `FIXED` hoặc `AUTO_FAILOVER`.
- Primary provider/model.
- Fallback provider/model theo thứ tự kéo thả.
- Prompt version.
- Timeout và max output tokens.
- Max attempts.
- Lỗi nào được phép fallback.
- Scope áp dụng: global, plan, strategy, risk profile hoặc user/license override.

Mỗi thay đổi route phải tạo version mới hoặc audit snapshot để có thể biết request cũ đã chạy bằng policy nào.

### 15.3 Quản Lý API Key Và Secret

Yêu cầu bắt buộc:

- API key được mã hóa at rest bằng KMS/Vault hoặc application envelope encryption.
- Không lưu key raw trong log, analytics, error tracker hoặc database field thường.
- Sau khi save, UI chỉ hiển thị alias và bốn ký tự cuối.
- API đọc provider config không bao giờ trả plaintext secret.
- Chỉ decrypt trong memory ngay trước khi gọi provider.
- Không cho browser/client Admin nhận lại plaintext key sau khi lưu.

Credential lifecycle:

```text
DRAFT
ACTIVE
STANDBY
INVALID
REVOKED
```

Luồng rotate không downtime:

1. Admin thêm key mới ở trạng thái `STANDBY`.
2. Backend test key bằng request nhỏ hoặc provider credential endpoint.
3. Key mới chuyển thành `ACTIVE`.
4. Key cũ chuyển thành `STANDBY` trong grace period.
5. Sau khi xác nhận request ổn định, key cũ chuyển `REVOKED`.

Không xóa vật lý credential đã từng dùng. Giữ metadata/audit nhưng xóa hoặc crypto-shred ciphertext khi hết retention.

### 15.4 Request Explorer

Danh sách request cần các cột:

```text
request_id
created_at
user/license
mode: manual | auto
symbol
timeframe
strategy
risk_profile
route_policy
final_provider
final_model
status
action
confidence
attempt_count
total_latency_ms
input_tokens
output_tokens
estimated_cost_usd
error_code
```

Bộ lọc:

- Date range.
- Request id hoặc correlation id.
- User, license, device hoặc account hash.
- Symbol/timeframe.
- Manual/auto scan.
- Provider/model.
- Request status và error code.
- BUY/SELL/WAIT và confidence range.
- Safety rejected/fallback used.
- Prompt version và routing policy version.

### 15.5 Request Detail

Trang detail phải có các khối:

1. **Request Metadata**
   - Request id, parent request id, idempotency key.
   - User/license/device.
   - Client version, symbol, timeframe, mode.
   - Received/completed timestamps.

2. **Routing Decision**
   - Policy id/version.
   - Primary và fallback sequence.
   - Lý do chọn route: global, plan, strategy hay override.
   - Prompt id/version.

3. **Provider Attempts Timeline**
   - Attempt number.
   - Provider, model và credential alias.
   - Started/finished time, latency.
   - HTTP status, provider request id, finish reason.
   - Token usage và cost.
   - Error category và retry/fallback decision.

4. **Payload**
   - Snapshot đã redact.
   - System prompt/user payload theo quyền.
   - Payload hash để đối chiếu.
   - Request size.

5. **Provider Response**
   - Raw response đã redact.
   - Extracted content.
   - Parse result.

6. **Normalized Verdict**
   - BUY/SELL/WAIT, confidence.
   - Entry/SL/TP/RR.
   - Reference setup và scenario coach.

7. **Safety Validation**
   - Schema valid.
   - Price geometry valid.
   - Stop-style rule valid.
   - RR recalculated.
   - Fallback WAIT used và lý do.

8. **Delivery**
   - HTTP response trả cho EA.
   - Response status/size.
   - Client disconnected hoặc timeout nếu có.

API key, Authorization header và secret ciphertext phải luôn bị redact, kể cả với Super Admin.

### 15.6 Request Và Attempt Status

Request status:

```text
RECEIVED
AUTHENTICATED
VALIDATED
ROUTED
PROVIDER_PENDING
NORMALIZING
SAFETY_VALIDATING
COMPLETED
COMPLETED_WITH_WAIT_FALLBACK
RATE_LIMITED
FAILED
CANCELLED
```

Provider attempt status:

```text
PENDING
SUCCEEDED
TIMEOUT
RATE_LIMITED
HTTP_ERROR
EMPTY_CONTENT
INVALID_JSON
PARSE_ERROR
CANCELLED
```

Request và attempt phải là hai entity riêng. Một request có thể có nhiều attempt khi fallback, nhưng chỉ có một normalized response cuối trả cho EA.

### 15.7 Admin RBAC

Role đề xuất:

```text
SUPER_ADMIN
AI_ADMIN
AI_OPERATOR
SUPPORT_READONLY
AUDITOR
```

Quyền tối thiểu:

| Chức năng | Super Admin | AI Admin | Operator | Support | Auditor |
|---|---:|---:|---:|---:|---:|
| Xem request metadata | Yes | Yes | Yes | Yes | Yes |
| Xem snapshot/raw response | Yes | Yes | Yes | Redacted | Redacted |
| Sửa provider/model | Yes | Yes | No | No | No |
| Thêm/rotate/revoke key | Yes | Yes | No | No | No |
| Sửa routing/prompt active | Yes | Yes | No | No | No |
| Retry/replay request | Yes | Yes | Yes | No | No |
| Xem audit log | Yes | Yes | Limited | No | Yes |

Các action nhạy cảm như rotate key, đổi primary provider, disable provider cuối cùng hoặc publish prompt mới nên yêu cầu re-authentication và ghi lý do thay đổi.

### 15.8 Admin API Contract

```http
GET    /admin/ai/providers
POST   /admin/ai/providers
GET    /admin/ai/providers/{providerId}
PATCH  /admin/ai/providers/{providerId}
POST   /admin/ai/providers/{providerId}/health-check

POST   /admin/ai/providers/{providerId}/credentials
POST   /admin/ai/providers/{providerId}/credentials/{credentialId}/test
POST   /admin/ai/providers/{providerId}/credentials/{credentialId}/activate
POST   /admin/ai/providers/{providerId}/credentials/{credentialId}/revoke

GET    /admin/ai/models
POST   /admin/ai/models
PATCH  /admin/ai/models/{modelId}

GET    /admin/ai/routes
POST   /admin/ai/routes
GET    /admin/ai/routes/{routeId}
PATCH  /admin/ai/routes/{routeId}
POST   /admin/ai/routes/{routeId}/publish

GET    /admin/ai/requests
GET    /admin/ai/requests/{requestId}
GET    /admin/ai/requests/{requestId}/attempts
POST   /admin/ai/requests/{requestId}/replay

GET    /admin/ai/usage/summary
GET    /admin/ai/health
GET    /admin/ai/audit-logs
```

Admin endpoints phải dùng admin session/JWT riêng, CSRF protection nếu dùng cookie, RBAC middleware và audit middleware. Không dùng `InpAIGatewayToken` hoặc license token của EA để gọi Admin API.

### 15.9 Database Schema Bổ Sung

```text
ai_providers
  id
  provider_enum
  provider_code
  display_name
  base_url
  enabled
  health_status
  health_checked_at
  created_at
  updated_at

ai_provider_credentials
  id
  provider_id
  alias
  encrypted_secret
  encryption_key_version
  last_four
  status
  tested_at
  activated_at
  revoked_at
  created_by
  created_at

ai_models
  id
  provider_id
  model_code
  display_name
  enabled
  supports_json_mode
  context_limit
  max_output_tokens
  input_cost_per_million
  output_cost_per_million
  created_at
  updated_at

ai_routing_policies
  id
  name
  version
  mode
  scope_type
  scope_value
  primary_model_id
  fallback_config_json
  prompt_version_id
  timeout_ms
  max_attempts
  enabled
  published_at
  created_by

ai_requests
  id
  request_id
  parent_request_id
  idempotency_key
  user_id
  license_id
  device_hash
  symbol
  timeframe
  analysis_mode
  strategy
  risk_profile
  routing_policy_id
  routing_policy_version
  prompt_version
  status
  action
  confidence
  normalized_response_json
  safety_result_json
  input_tokens
  output_tokens
  total_latency_ms
  estimated_cost_usd
  error_code
  created_at
  completed_at

ai_request_attempts
  id
  ai_request_id
  attempt_number
  provider_id
  model_id
  credential_id
  provider_request_id
  status
  http_status
  latency_ms
  input_tokens
  output_tokens
  estimated_cost_usd
  finish_reason
  error_code
  error_message_redacted
  started_at
  completed_at

admin_audit_logs
  id
  admin_user_id
  action
  entity_type
  entity_id
  before_json_redacted
  after_json_redacted
  reason
  ip_address
  user_agent
  created_at
```

Raw snapshot, prompt và provider response nên lưu ở encrypted object storage với retention riêng; database chỉ lưu object reference, checksum và redacted preview.

### 15.10 Replay Và Retry Safety

- Retry tự động nằm trong cùng request và tạo attempt mới.
- Replay thủ công từ Admin phải tạo request mới với `parent_request_id` trỏ về request cũ.
- Không sửa response/log của request cũ.
- Replay không được đẩy kết quả trực tiếp về EA và không được tự apply trade plan.
- Admin phải thấy rõ replay dùng snapshot/prompt/route cũ hay cấu hình hiện tại.
- Dùng idempotency key để tránh cùng một EA request bị tính quota hoặc billing hai lần do network retry.

### 15.11 Monitoring Và Alert

Alert đề xuất:

- Provider unavailable hoặc invalid credential.
- Error rate vượt threshold.
- P95 latency vượt SLA.
- Fallback rate tăng bất thường.
- Safety reject hoặc invalid JSON tăng bất thường.
- Chi phí theo giờ/ngày vượt budget.
- API key sắp hết hạn nếu provider hỗ trợ expiry metadata.
- Không còn provider healthy trong active route.

Alert có severity `INFO`, `WARNING`, `CRITICAL` và phải link trực tiếp đến provider/request liên quan trong Admin.

### 15.12 Chi tiết triển khai thực tế trên Website (GoldScalperNinja Web Console)

Hiện tại, website GoldScalperNinja đã triển khai đầy đủ giao diện quản trị AI Gateway với các chức năng chi tiết bao gồm:

1. **Giao diện Tab-navigation cao cấp (Premium Tabbed Layout)**:
   - Toàn bộ các trang quản lý AI được nhóm chung dưới đường dẫn `/admin/ai` và sử dụng một layout chung hỗ trợ chuyển đổi tab cực kỳ mượt mà.
   - Các tab chính bao gồm: **Overview** (Thống kê và sức khỏe hệ thống), **Providers & Keys** (Quản lý các provider và thông tin xác thực), **Routing Policies** (Chính sách định tuyến), **Requests Explorer** (Chi tiết các request), **Audit Log** (Nhật ký hành động của Admin).

2. **Quản lý Provider & API Key**:
   - **Tự động khởi tạo (Auto-seeding)**: Khi admin truy cập hệ thống lần đầu tiên và chưa có provider nào, hệ thống tự động khởi tạo 5 provider chuẩn bao gồm: `Anthropic (Claude)` (Enum: 1), `OpenAI (GPT)` (Enum: 2), `Google (Gemini)` (Enum: 3), `DeepSeek` (Enum: 4) và `xAI (Grok)` (Enum: 5).
   - **Cấu hình chi tiết (Edit Configuration)**: Cho phép cấu hình `Base URL` riêng cho từng nhà cung cấp, `Default Model ID` làm model dự phòng mặc định, và `Timeout (ms)` để giới hạn thời gian chờ tối đa.
   - **Lifecycle Quản lý API Key**:
     - **Test Key**: Gửi request mock để xác thực key hoạt động bình thường.
     - **Activate Key**: Cho phép chọn key nào sẽ là key hoạt động chính.
     - **Rotate Key**: Chuyển key cũ sang trạng thái `REVOKED` và tự động tạo mới một credential `ACTIVE` được mã hóa AES-256 an toàn trong database.

3. **Chính sách định tuyến (Routing Policies)**:
   - Cho phép tạo mới chính sách với tên, chế độ định tuyến (`FIXED` chỉ dùng 1 model hoặc `AUTO_FAILOVER` tự động chuyển đổi sang model fallback nếu model chính lỗi), `Primary Model ID`, `Timeout (ms)` và số lượt retry tối đa (`Max Attempts`).

4. **Requests Explorer**:
   - Cho phép tìm kiếm request ID hoặc email của người dùng.
   - Hiển thị thông tin tổng quan (Status, Latency, Time, Cost, Tokens).
   - Cho phép mở rộng (expand) chi tiết để xem lịch sử của từng lượt attempt trong request đó (với thông tin provider, model, latency, HTTP Status, error message bị ẩn chi tiết nhạy cảm).

5. **Nhật ký Audit Log (Admin Audit Trail)**:
   - Toàn bộ hành động thay đổi cấu hình nhạy cảm (như sửa provider, đổi trạng thái, tạo policy, thêm/rotatate key) đều được lưu vào database dưới bảng `AdminAuditLog`.
   - Admin có thể tra cứu nhanh danh tính admin thực hiện, hành động cụ thể, bảng dữ liệu bị tác động, ID bản ghi và thông số JSON chi tiết của hành động.

## 16. Thay Đổi Cần Làm Trong EA Khi Chuyển Gateway

### 16.1 Input Settings

Thay:

```text
InpAIApiKey
InpAIProvider
InpAIModel
```

Bằng:

```text
InpAIGatewayUrl
InpAIGatewayToken
```

Tên hiển thị trong panel:

```text
GoldScalperNinja AI | READY
```

Không hiển thị:

```text
DeepSeek
Claude
Gemini
OpenAI
Grok
```

### 16.2 Request Builder

Thêm function tương lai:

```cpp
string BuildGSNAIGatewayPayload(string snapshotJson)
```

Payload:

```json
{
  "client": {},
  "license": {},
  "analysis": {},
  "snapshot": {}
}
```

### 16.3 API Caller

Thêm function tương lai:

```cpp
bool CallGSNAIGateway(const GSN_AIRequestConfig &cfg, const string snapshotJson, string &responseText)
```

Function này gọi:

```text
InpAIGatewayUrl
```

Không gọi trực tiếp DeepSeek.

### 16.4 Parser

Giữ `ParseAIResult()` càng ổn định càng tốt.

Server phải trả đúng schema cũ để EA ít phải sửa.

## 17. Phase Triển Khai

### Phase 1 - Proxy Đơn Giản

Mục tiêu:

- EA gọi website.
- Website gọi DeepSeek phía sau.
- Response schema giữ nguyên.
- Không lộ DeepSeek trong EA.

Checklist:

- Tạo `/v1/ai/analyze`.
- Nhận snapshot từ EA.
- Gọi DeepSeek.
- Validate response.
- Trả JSON chuẩn cho EA.

### Phase 2 - AI Gateway Thật

Mục tiêu:

- Thêm model router.
- Hỗ trợ nhiều provider.
- Có fallback.
- Có prompt versioning.
- Có quota/license.

Checklist:

- `PROVIDER_ANTHROPIC` adapter.
- `PROVIDER_OPENAI` adapter.
- `PROVIDER_GOOGLE` adapter.
- `PROVIDER_DEEPSEEK` adapter.
- `PROVIDER_XAI` adapter.
- Provider health check.
- Credential encryption và rotation.
- Fixed routing và auto failover.
- Request/attempt logging.
- Model alias.

### Phase 3 - Admin Control Plane

Mục tiêu:

- Admin chủ động chọn provider/model.
- Quản lý API key an toàn.
- Theo dõi request detail, attempt, token, latency, cost và safety result.
- Quản lý prompt/routing version.
- Có RBAC và audit log.

Checklist:

- Provider/Model management.
- Credential add/test/rotate/revoke.
- Routing policy editor.
- Request Explorer và Request Detail.
- Usage/Cost dashboard.
- Health/Alert dashboard.
- Admin RBAC và audit middleware.

### Phase 4 - Community Product

Mục tiêu:

- Gắn với tài khoản cộng đồng.
- Dashboard usage.
- Plan theo user.
- Log phân tích.
- Analytics chất lượng model.

Checklist:

- User dashboard.
- License management.
- Usage chart.
- Admin panel.
- Prompt/model A/B testing.
- Feedback button từ EA hoặc website.

## 18. Backend Pseudo Code

```ts
async function analyze(req) {
  const auth = await authenticate(req.headers.authorization);
  if (!auth.ok) return error("INVALID_LICENSE");

  await enforceRateLimit(auth.userId);

  const snapshot = validateSnapshot(req.body.snapshot);
  if (!snapshot.ok) return error("SNAPSHOT_INVALID");

  const aiRequest = await createAIRequest({
    requestId: req.body.analysis?.request_id ?? generateRequestId(),
    idempotencyKey: req.headers["idempotency-key"],
    auth,
    client: req.body.client,
    analysis: req.body.analysis,
    snapshot: snapshot.value
  });

  const route = selectModelRoute({
    plan: auth.plan,
    strategy: snapshot.ai_profile?.strategy,
    riskProfile: snapshot.ai_profile?.risk_profile,
    userId: auth.userId,
    licenseId: auth.licenseId
  });

  await saveRoutingDecision(aiRequest.id, route);

  const prompt = buildPrompt({
    version: route.promptVersion,
    snapshot: snapshot.value
  });

  const execution = await executeRouteWithFallback({
    aiRequestId: aiRequest.id,
    route,
    prompt,
    snapshot: snapshot.value,
    onAttempt: attempt => saveProviderAttempt(aiRequest.id, attempt)
  });

  if (!execution.ok) {
    await failAIRequest(aiRequest.id, execution.errorCode);
    return error(execution.errorCode, aiRequest.requestId);
  }

  const parsed = parseModelJson(execution.content);

  const normalized = normalizeAIResponse(parsed);
  const safety = validateTradingSafety(normalized, snapshot.value);

  if (!safety.ok) {
    const fallback = buildWaitFallback({
      reason: safety.reason,
      requestId: aiRequest.requestId
    });
    await completeAIRequestWithFallback(aiRequest.id, fallback, safety, execution);
    return fallback;
  }

  await completeAIRequest(aiRequest.id, normalized, safety, execution);

  return {
    ok: true,
    provider_hidden: true,
    request_id: aiRequest.requestId,
    ...normalized,
    server_validation: {
      schema_valid: true,
      safety_valid: true,
      fallback_used: execution.attempts.length > 1,
      model_provider: "hidden",
      model_alias: route.alias
    }
  };
}
```

## 19. Server Safety Validator Pseudo Code

```ts
function validateTradingSafety(result, snapshot) {
  const current = snapshot.price?.current ?? midpoint(snapshot.price.bid, snapshot.price.ask);

  if (!["BUY", "SELL", "WAIT"].includes(result.action)) {
    return reject("Invalid action.");
  }

  if (["BUY STOP", "SELL STOP"].includes(result.reference_order_type)) {
    return reject("Stop orders are disabled.");
  }

  if (result.reference_action === "SELL" && result.reference_entry > 0 && result.reference_entry < current) {
    return reject("SELL reference entry below current price is stop-style.");
  }

  if (result.reference_action === "BUY" && result.reference_entry > 0 && result.reference_entry > current) {
    return reject("BUY reference entry above current price is stop-style.");
  }

  if (result.reference_action === "BUY") {
    if (!(result.reference_sl < result.reference_entry)) return reject("Invalid BUY SL.");
    if (!(result.reference_tp1 > result.reference_entry)) return reject("Invalid BUY TP1.");
  }

  if (result.reference_action === "SELL") {
    if (!(result.reference_sl > result.reference_entry)) return reject("Invalid SELL SL.");
    if (!(result.reference_tp1 < result.reference_entry)) return reject("Invalid SELL TP1.");
  }

  return { ok: true };
}
```

## 20. EA WebRequest Lưu Ý

Trong MT5, user cần allow URL trong:

```text
Tools -> Options -> Expert Advisors -> Allow WebRequest for listed URL
```

URL cần add:

```text
https://api.goldscalperninja.com
```

Nếu chưa allow, EA sẽ báo lỗi WebRequest.

## 21. Acceptance Criteria

Chức năng AI Gateway được xem là đạt khi:

1. EA không còn cần provider API key thật.
2. EA chỉ gọi endpoint GoldScalperNinja.
3. Website có adapter cho Anthropic, OpenAI, Google, DeepSeek và xAI.
4. Response trả về EA đúng schema.
5. Provider thật không hiển thị trong AI tab.
6. Server reject stop order và stop-style entry.
7. Server reject sai price geometry.
8. Server tự tính lại RR theo TP1.
9. License/quota hoạt động.
10. Error response hiển thị được trong AI tab.
11. Admin có thể bật/tắt provider và chọn provider/model primary.
12. Admin có thể cấu hình fallback theo thứ tự.
13. API key được mã hóa, masked và không thể đọc lại plaintext từ Admin API.
14. Admin có thể add, test, rotate và revoke credential.
15. Mỗi request lưu được routing decision và mọi provider attempt.
16. Request Detail hiển thị latency, token, cost, provider error và safety result.
17. Replay tạo request mới, không sửa request cũ và không tự đẩy lệnh về EA.
18. RBAC ngăn role không đủ quyền thay đổi provider/key/route/prompt.
19. Mọi thay đổi nhạy cảm có admin audit log.
20. Provider health, circuit breaker và cảnh báo không còn route healthy hoạt động.

## 22. Gợi Ý Tên Hiển Thị

Nên dùng:

```text
GoldScalperNinja AI
GSN AI Analyst
GSN Market AI
GSN PA/SMC Advisor
```

Không nên dùng:

```text
DeepSeek AI
Claude AI
Gemini AI
OpenAI
Grok
```

## 23. Kết Luận

Đưa AI tab đi qua website riêng là hướng đúng cho sản phẩm cộng đồng.

EA nên giữ vai trò client nhẹ, còn website/API nên là trung tâm quản lý:

- model provider
- prompt
- validation
- license
- quota
- logging
- fallback
- product packaging

Điểm quan trọng nhất là server phải validate response trước khi trả về EA. Prompt giúp model trả đúng, nhưng safety validator mới là lớp bảo vệ bắt buộc cho sản phẩm thật.
