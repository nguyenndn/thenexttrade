# Production Services Stack

Date: 2026-05-17

## 1. Muc tieu

Tai lieu nay ghi lai bo services du kien dung khi TheNextTrade/GSN CRM chuyen sang self-host production.

Stack nay uu tien:

- De deploy.
- De backup/restore.
- Khong phu thuoc Vercel.
- Van co CDN/WAF/monitoring/email provider chuyen nghiep.
- Phu hop voi VPS + Coolify giai doan dau.

## 2. Services Da Chon

| Layer | Service | Vai tro |
|---|---|---|
| Deploy / control panel | Coolify | Deploy app, manage env, services, DB, Redis, workers, cron |
| DNS / CDN / WAF | Cloudflare | DNS, CDN, SSL edge, WAF/basic firewall, DDoS protection |
| Images / uploads / backups | Cloudflare R2 | Luu article images, featured images, uploads, DB backups |
| Transactional email | Postmark hoac Brevo | Gui auth email, product email, reports, security alerts |
| Monitoring / uptime / logs | Better Stack | Uptime monitoring, alerting, log/incident tracking |

## 3. Kien Truc Tong The

```text
User
  ↓
Cloudflare
  - DNS
  - CDN
  - WAF
  - SSL edge
  ↓
VPS
  ↓
Coolify
  ├─ Next.js app
  ├─ PostgreSQL
  ├─ Redis
  ├─ Email/background worker
  ├─ Scheduled cron tasks
  └─ Reverse proxy / SSL origin config

External services
  ├─ Cloudflare R2: images/uploads/backups
  ├─ Postmark/Brevo: email delivery
  ├─ Better Stack: uptime/log monitoring
  └─ Supabase Auth: auth/session/JWT, if still used
```

## 4. Coolify

### Vai tro

Coolify dung lam deployment/control panel cho VPS.

Dung de quan ly:

- Next.js app.
- PostgreSQL.
- Redis.
- Worker service.
- Cron/scheduled tasks.
- Env vars.
- Deploy tu GitHub.
- Rollback/redeploy.
- SSL/proxy basics.

### Khuyen nghi

- Dung VPS toi thieu: `6 vCPU / 12GB RAM / 100GB NVMe`.
- Chay app bang Docker/Coolify, khong deploy thu cong bang PM2 neu da chon Coolify.
- Moi service nen tach ro:
  - `web`
  - `worker`
  - `postgres`
  - `redis`
  - `cron tasks`

### Can cau hinh

- GitHub repo connection.
- Production branch: `main`.
- Optional staging branch: `staging`.
- Env vars production.
- Health check endpoint, vi du:
  - `/api/app/version`
  - hoac tao `/api/health`.

## 5. Cloudflare

### Vai tro

Cloudflare nam truoc VPS:

- DNS.
- CDN.
- SSL edge.
- WAF/basic firewall.
- DDoS protection co ban.
- Cache static assets.

### Cau hinh de xuat

- DNS:
  - `A` record domain tro ve VPS IP.
  - Proxy enabled cho website.
- SSL:
  - Full strict neu origin cert dung.
- WAF:
  - Block known bad countries/IP neu can.
  - Rate limit auth/API neu traffic bat thuong.
- Cache:
  - Cache static assets.
  - Khong cache `/api/*`.
  - Khong cache dashboard/auth/admin HTML.

### Can can than

- Khong cache response co user-specific data.
- Khong cache dashboard pages.
- Khong cache auth callback/reset password links.

## 6. Cloudflare R2

### Vai tro

R2 dung cho:

- Article inline images.
- Featured images.
- Uploads/media.
- DB backup files.
- Optional generated assets.

### Duong dan hien tai can migrate

- `public/images/articles`
- `public/images/featured`
- `public/uploads`

### Env de xuat

```env
R2_ENDPOINT=
R2_REGION=auto
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
ASSET_PUBLIC_BASE_URL=https://cdn.thenexttrade.com
```

### Backup de xuat

- DB dump moi ngay upload len R2.
- Images/uploads backup moi ngay.
- Retention:
  - daily 7 ban
  - weekly 4 ban
  - monthly 6 ban

### Can can than

- R2 khong thay the database backup logic.
- Phai test restore.
- Neu dung `sync`, can than viec xoa local lam xoa remote.
- Ban dau nen dung `copy` hoac restic snapshots.

## 7. Email Provider: Postmark Hoac Brevo

### Vai tro

Dung de gui:

- Auth email.
- Welcome email.
- Password reset.
- Partner Pro/VIP emails.
- Copy Trading emails.
- EA license emails.
- Security alerts.
- Weekly/monthly reports.
- Contact/feedback receipts/admin alerts.

### Postmark

Nen chon neu uu tien:

- Transactional email on dinh.
- Deliverability tot.
- Log/debug email ro.
- Password reset/security/report email quan trong.

### Brevo

Nen chon neu uu tien:

- Chi phi mem hon.
- Co the dung them marketing email sau nay.
- SMTP de tich hop.

### Khuyen nghi cua em

- Neu ngan sach cho phep: Postmark cho transactional.
- Neu can tiet kiem va da quen SMTP: Brevo.
- Khong self-host SMTP tren VPS.

### Env de xuat

```env
EMAIL_PROVIDER=postmark
EMAIL_FROM_NAME=TheNextTrade
EMAIL_FROM_ADDRESS=noreply@thenexttrade.com
SUPPORT_EMAIL=support@thenexttrade.com
POSTMARK_SERVER_TOKEN=
```

Hoac SMTP:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=TheNextTrade
SMTP_FROM_EMAIL=noreply@thenexttrade.com
```

### DNS records bat buoc

Can setup tren Cloudflare:

- SPF.
- DKIM.
- DMARC.
- Return-path/bounce domain neu provider yeu cau.

## 8. Better Stack

### Vai tro

Dung cho:

- Uptime monitoring.
- Incident alert.
- Log monitoring neu tich hop.
- Alert qua email/Telegram/Slack.

### Monitor can tao

- Homepage:
  - `https://domain.com/`
- App version/health:
  - `https://domain.com/api/app/version`
  - hoac `https://domain.com/api/health`
- Auth page:
  - `https://domain.com/auth/login`
- Dashboard protected route:
  - chi can monitor status redirect/200 hop ly, khong can login neu chua co synthetic auth.
- Cron endpoints:
  - Khong public monitor truc tiep neu can Bearer secret.
  - Monitor qua Coolify logs hoac tao internal cron status page rieng.

### Alert de xuat

- App down > 1 minute.
- SSL certificate issue.
- Response time > 2s trong 3 lan lien tiep.
- 5xx spike.
- Disk usage > 80%.
- Memory high sustained.

## 9. Supabase Auth Trong Stack Nay

Giai doan dau co the tiep tuc dung Supabase Auth cho:

- User identity.
- Session/JWT.
- OTP/token verification.
- Password hashing.
- MFA.

Nhung app se tu gui email auth neu implement theo:

- `docs/custom-auth-email-delivery-strategy.md`

Nghia la:

```text
Supabase Auth = auth core
TheNextTrade app = email delivery + templates
VPS PostgreSQL = app data
```

## 10. Production Env Checklist

### App

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `CRON_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Email

- `EMAIL_PROVIDER`
- `EMAIL_FROM_NAME`
- `EMAIL_FROM_ADDRESS`
- `SUPPORT_EMAIL`
- Provider API key or SMTP envs.

### Storage

- `R2_ENDPOINT`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `ASSET_PUBLIC_BASE_URL`

### AI / external APIs

- `OPENAI_API_KEY`, if used.
- `DEEPSEEK_API_KEY`, if used.
- broker/copy trading API keys.

## 11. Release Checklist

- Coolify deploy production build successfully.
- Domain points through Cloudflare.
- SSL works.
- App health check works.
- DB migration applied.
- Redis connected.
- Cron tasks configured.
- Email provider verified domain.
- Test signup/password reset email.
- R2 bucket works.
- Image upload/generation writes to R2.
- DB backup writes to R2.
- Restore test completed at least once.
- Better Stack uptime monitor active.

## 12. Related Docs

- `docs/email-notification-audit-report.md`
- `docs/email-template-library.md`
- `docs/custom-auth-email-delivery-strategy.md`
- `release-performance-optimization-plan.md`
