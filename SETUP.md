# Setup & Run Guide - Siêu Đơn Giản

## 🚀 Bắt Đầu (3 Bước)

### 1. Install
```bash
npm install
```

### 2. Start
```bash
npm run dev:local
```

### 3. Open
```
http://localhost:3000
```

**Done!** 🎉

---

## 📖 Commands Hàng Ngày

```bash
# Start development
npm run dev:local

# Seed database (nếu chưa có data)
npm run db:seed

# View database
npm run db:studio
```

**Chỉ cần 3 commands này!** ✨

---

## ⚙️ Config (Đã Setup Sẵn)

### ServBay PostgreSQL:
- **Host:** localhost:5432
- **User:** postgres
- **Password:** `ServBay.dev`
- **Database:** gsn_crm

### Performance:
- ⚡ Average: 16ms
- ⚡ Homepage: 1ms
- ⚡ All queries: <100ms

---

## ⚠️ Lỗi & Fix

### "Authentication failed"
→ Password đúng rồi: `ServBay.dev` (đã config trong `.env.local`)

### "Database empty"
```bash
npm run db:seed
```

### Port 3000 busy
```bash
Get-Process node | Stop-Process -Force
npm run dev:local
```

---

## 🎯 Full Commands (Rarely Used)

```bash
npm run dev:local      # Start local (FAST)
npm run dev:prod       # Start production (SLOW)
npm run db:seed        # Seed data
npm run db:migrate     # Run migrations
npm run db:studio      # Database GUI
npm run perf:test      # Performance test
npm run build          # Build production
```

---

## 📚 Documentation

- **Quick Start:** [docs/QUICK_START.md](docs/QUICK_START.md)
- **Environment:** [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)
- **Server Guide:** [docs/SERVER_STARTUP_GUIDE.md](docs/SERVER_STARTUP_GUIDE.md)
- **Full Index:** [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

## ✅ Checklist

- [x] PostgreSQL installed (ServBay)
- [x] Password configured: `ServBay.dev`
- [x] Environment files ready
- [x] Scripts auto-load variables
- [x] Database seeded
- [x] Performance: 16ms average

**Everything ready! Just run:**
```bash
npm run dev:local
```

🎉 **Happy coding!**
