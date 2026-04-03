# 📚 Documentation Index

Welcome to TheNextTrade documentation! Organized for clarity and easy navigation.

## 🎯 Start Here

**New to the project?** Read in this order:
1. [ENVIRONMENT_SETUP.md](setup/ENVIRONMENT_SETUP.md) - Quick start + environment configuration
2. [overview.md](architecture/overview.md) - System architecture
3. [VERCEL_DEPLOYMENT.md](deployment/VERCEL_DEPLOYMENT.md) - Production deployment

## 📁 Documentation Structure

```
📁 docs/
├── README.md                              # ⭐ This index
│
├── 📁 api/                                # API Documentation
│   └── endpoints.md                       # All API endpoints reference
│
├── 📁 architecture/                       # System Architecture
│   ├── overview.md                        # Tech stack + system diagram
│   ├── database-schema.md                 # Prisma models + ER diagram
│   └── routes.md                          # All routes (public/dashboard/admin/api)
│
├── 📁 deployment/                         # Production Deployment
│   └── VERCEL_DEPLOYMENT.md               # Vercel deploy guide + env vars
│
├── 📁 design-system/                      # UI/UX Standards
│   └── USER_DASHBOARD_SPECS.md            # Colors, typography, components
│
├── 📁 features/                           # Feature Documentation
│   ├── academy.md                         # 12-level curriculum + AI pipeline
│   ├── analytics.md                       # Dashboard + Profit Calendar
│   ├── authentication.md                  # Auth flow (Supabase)
│   ├── trader-tools.md                    # Risk Calculator, Market Hours, etc.
│   └── trading-journal.md                 # Journal + trade logging
│
├── 📁 setup/                              # Development Setup
│   └── ENVIRONMENT_SETUP.md               # Quick start + env management
│
└── 📁 templates/                          # Email Templates
    ├── supabase_email_template.html       # Confirm email
    ├── supabase_magic_link_template.html   # Magic link login
    └── supabase_reset_password_template.html # Password reset
```

## 🚀 Quick Reference

### Daily Development
```bash
npm run dev:local      # Start with local database (FAST ⚡)
npm run dev:prod       # Start with production database
```

### Database
```bash
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
npm run db:studio      # Database GUI
```

### Deployment
```bash
git push origin main   # Auto-deploy to Vercel
```

## 📖 By Topic

| Topic | File |
|-------|------|
| **Getting Started** | [ENVIRONMENT_SETUP.md](setup/ENVIRONMENT_SETUP.md) |
| **Architecture** | [overview.md](architecture/overview.md) |
| **Database Schema** | [database-schema.md](architecture/database-schema.md) |
| **All Routes** | [routes.md](architecture/routes.md) |
| **API Endpoints** | [endpoints.md](api/endpoints.md) |
| **Deploy to Vercel** | [VERCEL_DEPLOYMENT.md](deployment/VERCEL_DEPLOYMENT.md) |
| **UI Standards** | [USER_DASHBOARD_SPECS.md](design-system/USER_DASHBOARD_SPECS.md) |
| **Academy & AI** | [academy.md](features/academy.md) |
| **Analytics** | [analytics.md](features/analytics.md) |
| **Authentication** | [authentication.md](features/authentication.md) |
| **Trading Journal** | [trading-journal.md](features/trading-journal.md) |
| **Trader Tools** | [trader-tools.md](features/trader-tools.md) |

## ✅ Documentation Standards

- All docs use Markdown format
- Use relative links for internal references
- Keep docs up-to-date with code changes

---

**Last Updated:** April 3, 2026 · **Total: 14 files**
