# 🗄️ Database Management — TheNextTrade

> Tất cả thao tác DB được quản lý qua **1 file duy nhất**: `db.js`

---

## Quick Start

```bash
node prisma/db.js              # Hiện menu đầy đủ
node prisma/db.js status       # Xem trạng thái cả 2 DB
```

---

## 📦 Backup & Restore

```bash
# Backup
node prisma/db.js backup local          # Backup local PostgreSQL → prisma/backups/
node prisma/db.js backup prod           # Backup production Supabase

# Restore
node prisma/db.js restore local         # Restore local DB từ backup mới nhất
```

> **Lưu ý:** Production restore phải thực hiện qua [Supabase Dashboard](https://supabase.com/dashboard).
>
> Backup production có thể bị lỗi `version mismatch` nếu Supabase PG version > local PG version. Supabase có auto-backup riêng nên không ảnh hưởng.

**Backups:**
- Lưu tại `prisma/backups/` (đã gitignore)
- Tự động rotate — giữ tối đa **10 files**
- Tự động backup trước mỗi lệnh `migrate` và `sync`

---

## 🔄 Sync Academy Content

Sync **Academy + Content** giữa local và production (không sync user data, trades, etc.)

```bash
# Pull production → local (test Academy content)
node prisma/db.js sync prod-to-local

# Push local → production (deploy content changes)
node prisma/db.js sync local-to-prod
```

**Dữ liệu được sync:**

| Nhóm | Tables |
|------|--------|
| Academy | Level, Module, Lesson |
| Quiz | Quiz, Question, Option |
| Content | Category, Tag, Article, ArticleTag |
| Other | Quote |

> ⚠️ **Articles**: Nếu `authorId` trên source không tồn tại ở target, sẽ tự remap sang user đầu tiên trên target.

---

## 🚀 Migration

```bash
# Local — chạy prisma migrate dev
node prisma/db.js migrate local

# Production — chạy prisma migrate deploy (auto-backup trước)
node prisma/db.js migrate prod
```

> **Quan trọng:** Không bao giờ dùng `prisma db push --accept-data-loss` trên production!

---

## 📊 Status

```bash
node prisma/db.js status
```

Hiển thị:
- Migration status của **LOCAL** và **PRODUCTION**
- Danh sách **backup files** gần nhất

---

## 🧠 Seed Quizzes

```bash
node prisma/seed-quizzes.js    # Tạo 330 quiz questions cho 33 modules
```

- **Idempotent** — chạy lại không tạo duplicate
- Sau khi seed, dùng `sync local-to-prod` để đẩy lên production
- 10 câu hỏi × 4 options × 33 modules = **1,320 options**

---

## 🔐 Safety Rules

| Rule | Detail |
|------|--------|
| ✅ Auto-backup | Trước `migrate prod`, `sync local-to-prod`, `sync prod-to-local` |
| ✅ Confirmation | Hỏi `[y/N]` trước mọi thao tác production |
| ✅ Backup rotation | Tối đa 10 files, tự xóa cũ |
| 🚫 Không `DROP` | Không bao giờ dùng destructive commands trên production |
| 🚫 Không `accept-data-loss` | Tuyệt đối không dùng flag này |

---

## 📁 File Structure

```
prisma/
├── db.js              # 🎯 Unified CLI (tất cả commands)
├── seed-quizzes.js    # 🧠 Quiz data (330 questions)  
├── schema.prisma      # 📐 Database schema
├── migrations/        # 📂 Prisma migrations
├── backups/           # 💾 Auto-generated backups (gitignored)
│   └── .gitignore
└── README.md          # 📖 File này
```

---

## ⚙️ Environment Variables

| Variable | File | Mô tả |
|----------|------|--------|
| `DATABASE_URL` | `.env.local` | Local PostgreSQL URL |
| `DIRECT_URL` | `.env.local` | Local direct connection |
| `DATABASE_URL` | `.env.production` | Supabase pooler URL (port 6543) |
| `DIRECT_URL` | `.env.production` | Supabase direct URL (port 5432) |

---

## 🔥 Common Workflows

### Thêm chức năng mới (migration)

```bash
# 1. Sửa schema.prisma
# 2. Tạo migration local
node prisma/db.js migrate local

# 3. Test local OK → deploy production
node prisma/db.js migrate prod
```

### Update Academy content

```bash
# 1. Sửa content qua Admin panel (local)
# 2. Push lên production
node prisma/db.js sync local-to-prod
```

### Test production data trên local

```bash
# 1. Pull production về
node prisma/db.js sync prod-to-local

# 2. Test xong, mở Prisma Studio nếu cần
npx prisma studio
```
