# 📚 Documentation Index

Welcome to GSN-CRM documentation! All documentation has been reorganized for clarity.

## 🎯 Start Here

**New to the project?** Read in this order:
1. [README.md](README.md) - Project overview & quick start
2. [docs/QUICK_START.md](docs/QUICK_START.md) - Daily development workflow
3. [docs/SERVER_STARTUP_GUIDE.md](docs/SERVER_STARTUP_GUIDE.md) - Server deployment
4. [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) - Environment configuration

## 📁 Documentation Structure

```
📦 Root Level (you are here)
├── README.md                      # ⭐ Project overview & quick start
├── PROJECT_STATUS.md              # Current development status
├── OPTIMIZATION_PLAN.md           # Performance optimization roadmap
├── VERCEL_DEPLOYMENT.md           # Deployment instructions
│
📁 docs/ - Main Documentation Hub
├── README.md                      # Documentation index
├── QUICK_START.md                 # ⭐ Daily workflow guide
├── SERVER_STARTUP_GUIDE.md        # 🚀 Server deployment & startup
├── ENVIRONMENT_SETUP.md           # Environment configuration
├── LOCAL_DEVELOPMENT.md           # Local dev options
│
├── performance/                   # Performance documentation
│   ├── PERFORMANCE_AUDIT_REPORT.md      # Issues identified
│   ├── PERFORMANCE_OPTIMIZATION_SPEC.md # Solutions & implementation
│   └── IMPLEMENTATION_CHECKLIST.md      # Task tracking
│
├── planning/                      # Project planning
│   ├── PROJECT_STRUCTURE.md       # Code organization
│   ├── DEVELOPMENT_PROCESS.md     # Dev workflow
│   ├── PLAN.md                    # Project plan
│   └── SUPABASE_SETUP.md          # Database setup
│
├── architecture/                  # System Architecture
│   ├── overview.md                # System overview
│   ├── database.md                # Database ER models
│   └── routes.md                  # App routing and page structure
│
├── BA/                            # Business analysis
│   ├── academy.md
│   ├── admin_dashboard.md
│   ├── auth_user.md
│   ├── cms_news.md
│   ├── notification_system.md
│   └── trading_tools.md
│
├── design-system/                 # UI/UX specifications
│   └── USER_DASHBOARD_SPECS.md
│
├── setup/                         # Database & infra setup
│   ├── FIX_PERMISSIONS.sql
│   ├── FIX_STORAGE_RLS_V2.sql
│   └── SUPABASE_TRIGGER.sql
│
├── sprints/                       # Sprint planning
│   ├── SPRINT1_TASKS.md
│   ├── SPRINT2_TASKS.md
│   ├── SPRINT3_TASKS.md
│   └── SPRINT4_TASKS.md
│
└── api/                           # API documentation
```

## 🚀 Common Tasks

### Daily Development
```bash
npm run dev:local      # Start with local database
npm run dev:prod       # Start with production database
```
📖 See: [docs/QUICK_START.md](docs/QUICK_START.md)

### Environment Management
```bash
npm run env:local      # Switch to local environment
npm run env:prod       # Switch to production
```
📖 See: [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)

### Database
```bash
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
```
📖 See: [docs/planning/SUPABASE_SETUP.md](docs/planning/SUPABASE_SETUP.md)

### Performance Testing
```bash
npm run perf:test      # Run performance tests
```
📖 See: [docs/performance/](docs/performance/)

## 📖 Quick Links by Role

### For Developers
- [QUICK_START.md](docs/QUICK_START.md) - Get started quickly
- [PROJECT_STRUCTURE.md](docs/planning/PROJECT_STRUCTURE.md) - Code organization
- [DEVELOPMENT_PROCESS.md](docs/planning/DEVELOPMENT_PROCESS.md) - Workflow

### For Performance Engineers
- [PERFORMANCE_AUDIT_REPORT.md](docs/performance/PERFORMANCE_AUDIT_REPORT.md) - Analysis
- [PERFORMANCE_OPTIMIZATION_SPEC.md](docs/performance/PERFORMANCE_OPTIMIZATION_SPEC.md) - Specs
- [IMPLEMENTATION_CHECKLIST.md](docs/performance/IMPLEMENTATION_CHECKLIST.md) - Tasks

### For Product Managers
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current status
- [BA/](docs/BA/) - Business analysis docs
- [sprints/](docs/sprints/) - Sprint planning

### For Designers
- [design-system/USER_DASHBOARD_SPECS.md](docs/design-system/USER_DASHBOARD_SPECS.md)
- [routes.md](docs/architecture/routes.md)

## 📝 File Naming Convention

- **ALL_CAPS.md** - Important top-level documents
- **lowercase-with-dashes.md** - Regular documentation
- **CATEGORY_NAME.md** - Categorized docs (e.g., SPRINT1_TASKS.md)

## 🔍 Can't Find Something?

1. Check [docs/README.md](docs/README.md) for detailed documentation index
2. Use GitHub search or IDE search (Ctrl/Cmd + Shift + F)
3. Check git history for moved files: `git log --all --full-history -- "**/filename.md"`

## ✅ Documentation Standards

- All docs use Markdown format
- Use relative links for internal references
- Keep docs up-to-date with code changes
- Add table of contents for docs >100 lines

---

**Last Updated:** January 23, 2026
