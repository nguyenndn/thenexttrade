# Quick Start Guide

## 🚀 Bắt Đầu Nhanh (3 Bước)

### Bước 1: Cài đặt
```bash
npm install
```

### Bước 2: Start Development
```bash
npm run dev:local
```

### Bước 3: Truy cập
```
http://localhost:3000
```

**Xong!** 🎉

---

## 📝 Commands Thường Dùng

```bash
# Development (99% thời gian dùng cái này)
npm run dev:local         # Start với local database (FAST ⚡)

# Database
npm run db:seed           # Seed data mẫu
npm run db:studio         # Mở database GUI

# Testing
npm run perf:test         # Test performance
```

**Chỉ cần nhớ:** `npm run dev:local` 👈 Dùng command này hàng ngày!

---

## � Workflow Đơn Giản

### Hàng Ngày:
```bash
# Bật máy lên
npm run dev:local

# Code...
# Server tự reload khi bạn sửa code

# Xong việc: Ctrl + C
```

### Thêm Data Mẫu:
```bash
npm run db:seed
```

### Xem Database:
```bash
npm run db:studio
```

**Chỉ vậy thôi!** Đơn giản đúng không? 😊

---

## 📖 Commands Reference

### Thường Dùng (99%):
| Command | Mô Tả |
|---------|-------|
| `npm run dev:local` | Start development ⭐ |
| `npm run db:seed` | Thêm data mẫu |
| `npm run db:studio` | Xem database |

### Ít Khi Dùng:
| Command | Mô Tả |
|---------|-------|
| `npm run dev:prod` | Test với production DB |
| `npm run db:migrate` | Run database migrations |
| `npm run perf:test` | Test performance |
| `npm run build` | Build production |

---

## ✅ Recommended Workflow

**99% thời gian:**
```bash
npm run dev:local
```

**Khi cần test production:**
```bash
npm run dev:prod
```

**Đơn giản vậy thôi!** 🎉

---

## ⚠️ Lỗi Thường Gặp

### Issue: "Authentication failed"
```bash
# Fix: Password PostgreSQL của ServBay là: ServBay.dev
# Đã được config sẵn trong .env.local
```

### Issue: Database trống
```bash
# Fix: Seed data
npm run db:seed
```

### Issue: Port 3000 đang dùng
```bash
# Fix: Kill process
Get-Process node | Stop-Process -Force
npm run dev:local
```

---

## 🎯 Tóm Tắt

**Nhớ 1 command này là đủ:**
```bash
npm run dev:local
```

Performance với local database:
- ⚡ Average: **16ms** (remote: 1275ms)
- ⚡ Homepage: **1ms** (remote: 1320ms)
- ⚡ 10/10 queries FAST

**Làm việc vui vẻ!