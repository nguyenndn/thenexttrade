# 🛡️ Security Checklist — GoldScalperNinja

> Tài liệu bảo mật cho dự án. Review trước khi deploy production.

---

## Kiến trúc bảo mật 5 tầng

```
┌─────────────────────────────────────────────┐
│  LAYER 1 — CDN / Firewall (Cloudflare)      │  ← Chặn trước khi đến server
│  Bot Fight Mode, WAF, DDoS Protection       │
├─────────────────────────────────────────────┤
│  LAYER 2 — Web Server Rate Limit            │  ← Middleware (per-IP)
│  API: 100/min, Auth: 10/min, Search: 30/min │
├─────────────────────────────────────────────┤
│  LAYER 3 — IP Reputation                    │  ← Log & block suspicious IPs
│  Bot UA detection, malicious pattern block  │
├─────────────────────────────────────────────┤
│  LAYER 4 — Application Level                │  ← Auth, role check, validation
│  Supabase Auth, RBAC, Zod, API Key          │
├─────────────────────────────────────────────┤
│  LAYER 5 — Cloudflare Turnstile             │  ← CAPTCHA cho forms
│  Login, Register, VIP Request               │
└─────────────────────────────────────────────┘
```

---

## ✅ Production Deploy Checklist

### 1. Cloudflare Dashboard

- [ ] **Bot Fight Mode**: ON
- [ ] **Security Level**: Medium hoặc High
- [ ] **WAF Rules**: Enable Managed Rules
- [ ] **Challenge Passage**: 30 minutes
- [ ] **SSL/TLS**: Full (Strict)
- [ ] **HSTS**: Enable (nếu chưa có)
- [ ] **Turnstile**: Tạo site mới → lấy Site Key + Secret Key

> Truy cập: https://dash.cloudflare.com → chọn domain → Security

### 2. Vercel Environment Variables

Thêm các biến sau vào **Vercel Dashboard → Settings → Environment Variables**:

```env
# Cloudflare Turnstile (BẮT BUỘC cho production)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site-key-từ-cloudflare>
TURNSTILE_SECRET_KEY=<secret-key-từ-cloudflare>

# Cron Protection (BẮT BUỘC)
CRON_SECRET=<random-string-dài>
```

> ⚠️ **QUAN TRỌNG**: Nếu không có `TURNSTILE_SECRET_KEY`, Turnstile sẽ block mọi request ở production.

### 3. Turnstile — Test Keys (Dev Only)

Dùng test keys của Cloudflare khi develop local:

| Key | Value | Mục đích |
|-----|-------|----------|
| Site Key (always pass) | `1x00000000000000000000AA` | Widget luôn pass |
| Site Key (always fail) | `2x00000000000000000000AB` | Widget luôn fail |
| Secret Key (always pass) | `1x0000000000000000000000000000000AA` | Server verify luôn pass |
| Secret Key (always fail) | `2x0000000000000000000000000000000AA` | Server verify luôn fail |

Thêm vào `.env.local` khi cần test:
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

> Khi không có key, widget tự skip (dev mode bypass).

---

## Các file bảo mật quan trọng

| File | Vai trò |
|------|---------|
| `src/middleware.ts` | Rate limiting, bot detection, security headers, CSP |
| `src/lib/turnstile.ts` | Server-side Turnstile verification |
| `src/components/ui/TurnstileWidget.tsx` | Client-side Turnstile widget |
| `src/lib/rate-limit.ts` | Route-level rate limiter (LRU Cache) |
| `src/lib/api-auth.ts` | `requireAuth()`, `requireAdmin()`, `requireCronSecret()` |
| `src/lib/partner-auth.ts` | Partner API key validation |
| `src/lib/supabase/middleware.ts` | Session management |

---

## Security Headers (Middleware)

Đã implement trong `middleware.ts`:

| Header | Value | Mục đích |
|--------|-------|----------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS |
| `X-Frame-Options` | `SAMEORIGIN` | Anti-clickjacking |
| `X-Content-Type-Options` | `nosniff` | Chống MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Privacy |
| `Permissions-Policy` | Disable camera, microphone, geo... | Giảm attack surface |
| `Content-Security-Policy` | Chi tiết (xem code) | XSS protection |

---

## Rate Limits

### Middleware (per-IP, sliding window)

| Route | Limit | Window |
|-------|-------|--------|
| `/api/*` | 100 req | 1 phút |
| `/api/auth/*` | 10 req | 1 phút |
| `/api/search` | 30 req | 1 phút |
| Pages | 200 req | 1 phút |

### Route-level (LRU Cache)

Áp dụng thêm cho:
- `/api/sync/trades`
- `/api/sync/connect`
- `/api/ea/trades`
- `/api/ea/history`

---

## Turnstile — Các form được bảo vệ

| Form | File | Khi nào verify |
|------|------|----------------|
| Login (Password) | `src/app/auth/login/page.tsx` | Trước `signInWithPassword` |
| Login (Magic Link) | `src/app/auth/login/page.tsx` | Trước `signInWithOtp` |
| Register | `src/app/auth/signup/page.tsx` | Trước `signUp` |
| VIP Request | `src/components/community/VipRequestForm.tsx` | Trước `submitVipRequest` |

**Flow:**
1. Client render `<TurnstileWidget>` → user giải challenge (hoặc auto-pass)
2. Token lưu vào state → append vào `FormData` dưới key `cf-turnstile-response`
3. Server action gọi `verifyTurnstile(token)` → verify với Cloudflare API
4. Nếu fail → return error, không tiếp tục

---

## Bot Detection

Blocked User-Agent patterns (middleware):

```
python-requests, go-http-client, java/, wget, libwww-perl,
php/, nikto, sqlmap, nmap, masscan, zgrab, semrush,
ahref, mj12bot, dotbot, bytespider
```

---

## 🔮 Roadmap bảo mật (Chưa implement)

### Phase 2 — IP Reputation
- [ ] Log failed login attempts per IP
- [ ] Auto-block IP sau 5 lần rate limit liên tục
- [ ] IP blacklist/whitelist database
- [ ] Suspicious behavior scoring

### Phase 3 — Advanced
- [ ] Per-user rate limiting (thay vì chỉ per-IP)
- [ ] Device fingerprinting
- [ ] Redis-based rate limiter (Upstash) — cho scale
- [ ] Concurrent session limit
- [ ] Login notification email

---

> **Cập nhật lần cuối**: 2026-04-25
> **Tác giả**: AI Assistant + Human Review
