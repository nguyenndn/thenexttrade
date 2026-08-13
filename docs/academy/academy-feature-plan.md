# Academy — Feature Plan (Code)

> **Mục đích:** Nâng cấp `/dashboard/academy` theo đúng spec P2 "Academy Activation Polish" trong `docs/tradecoin-underground-inspired-product-improvement-plan.md`.
>
> **Nguyên tắc:** Chỉ POLISH (bổ sung/nâng cấp), KHÔNG rebuild lại hệ thống khóa học. Giữ nguyên content, levels, modules, lessons, quizzes, certificates.
>
> **Nguồn spec:** Section 10 (P2 Academy Activation Polish) + Section 16 (P2 acceptance) + Section 15.2 (Playwright matrix).

---

## 1. Hiện trạng code (đã khảo sát)

### 1.1. Đã có sẵn trong `/dashboard/academy/page.tsx`
- ✅ **Next-lesson resume**: flatten cây levels→modules→lessons, tìm lesson chưa hoàn thành đầu tiên → banner "Continue Learning/Get Started" → `/dashboard/academy/lessons/{slug}`
- ✅ **Progress %**: `completedLessons / totalLessons * 100`
- ✅ **Inactivity badge**: suy `lastActivityDate` từ `max(completedAt, quiz.completedAt)`, hiện "Paused X days" khi `idleDays >= 7`
- ✅ **Lessons count**: `completedLessons/totalLessons`
- ✅ **Sidebar**: streak card, quizzes (unlock khi xong hết lessons), certificates progress

### 1.2. Schema hiện tại
```prisma
model UserProgress {
  id          String    @id @default(cuid())
  userId      String    @db.Uuid
  lessonId    String
  isCompleted Boolean   @default(false)
  completedAt DateTime? @db.Timestamptz(6)
  // ⚠️ KHÔNG có lastLessonAt / openedAt
}
```

### 1.3. Các API liên quan
- `POST /api/lessons/[id]/complete` — upsert progress khi hoàn thành lesson (+ XP, badge)
- `GET/POST /api/academy/progress` — đọc/ghi progress
- `POST /api/quizzes/[id]/submit` — nộp quiz (pass ≥75%, auto-grant cert)

---

## 2. Các điểm THIẾU so với spec (cần làm)

| # | Spec yêu cầu | Hiện trạng | Hành động |
|---|---|---|---|
| F1 | Inactivity dùng `lastLessonAt` thực tế (bài đang học dở) | Chỉ dùng `completedAt` — bài mở nhưng chưa xong KHÔNG tạo tín hiệu → idle tính sai | Thêm field `openedAt` + ghi khi mở lesson |
| F2 | Reminder **dismissible** + có **cooldown** | Chỉ là badge hiển thị, không dismiss được, hiện lại mỗi load | Thêm cơ chế dismiss + cooldown (localStorage hoặc DB) |
| F3 | **Estimated remaining lessons** khi có data | Chưa có | Thêm hiển thị ước tính |
| F4 | **Completed path** → next optional path hoặc completion state (không dead-end) | Khi xong hết lessons, banner `nextLesson` = null → không có gì | Thêm completion state / next level |
| F5 | Không hiện inactivity warning cho user **chưa enroll / không có lesson** | Hiện tại `idleDays >= 7` vẫn hiện badge dù user chưa học gì | Thêm guard: chỉ hiện khi `hasStarted` |
| F6 | Không hiện reminder **ngay sau khi hoàn thành** lesson | Hiện tại có thể hiện ngay sau khi vừa xong 1 lesson | Thêm cooldown chống hiện ngay |

---

## 3. Migration DB (thêm `openedAt`)

### 3.1. Thay đổi schema

**File:** `prisma/schema.prisma` — model `UserProgress`

```prisma
model UserProgress {
  id          String    @id @default(cuid())
  userId      String    @db.Uuid
  lessonId    String
  isCompleted Boolean   @default(false)
  completedAt DateTime? @db.Timestamptz(6)
+ openedAt    DateTime? @db.Timestamptz(6)   // ← THÊM: thời điểm mở bài gần nhất
  lesson      Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId, isCompleted])
  @@index([lessonId])
}
```

### 3.2. Tạo migration

```bash
npx prisma migrate dev --name add_user_progress_opened_at
```

> Migration sẽ tạo cột `openedAt` nullable (không phá dữ liệu hiện có). Cần kiểm tra cả `prisma/schema.prod.prisma` nếu đang dùng cho production.

---

## 4. Thay đổi code

### 4.1. Ghi `openedAt` khi mở lesson

**Mục tiêu:** Mỗi khi user mở 1 lesson (dù chưa hoàn thành), cập nhật `openedAt` để inactivity tính chính xác.

**File:** `src/app/dashboard/academy/lessons/[slug]/page.tsx`
- Sau khi xác nhận user + lesson tồn tại, gọi upsert `openedAt`:
```ts
// Ghi nhận "bài đang mở" cho inactivity tracking
await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    update: { openedAt: new Date() },
    create: { userId: user.id, lessonId: lesson.id, openedAt: new Date() },
});
```
- ⚠️ **Lưu ý:** Upsert này sẽ tạo 1 record `UserProgress` với `isCompleted=false` khi user mở bài mới — điều này **thay đổi hành vi** so với hiện tại (hiện chỉ tạo record khi hoàn thành). Cần đảm bảo các query đếm `isCompleted: true` không bị ảnh hưởng (chúng đã filter đúng). Kiểm tra tất cả nơi dùng `userProgress.count` để chắc chắn.

**Thay thế (an toàn hơn):** Tạo API riêng `POST /api/academy/lesson-open` chỉ ghi `openedAt` mà KHÔNG tạo record mới nếu chưa tồn tại (dùng `updateMany` thay vì `upsert`), để tránh tạo record rác:
```ts
await prisma.userProgress.updateMany({
    where: { userId: user.id, lessonId: lesson.id },
    data: { openedAt: new Date() },
});
```
> **Khuyến nghị:** Dùng cách `updateMany` này. Nếu user chưa có record (chưa từng hoàn thành), không tạo mới — inactivity chỉ cần biết lần cuối họ mở bài nào đó đã hoàn thành hoặc đang học. Để tránh phức tạp, có thể tạo record với `isCompleted:false` khi mở lần đầu.

### 4.2. Sửa logic inactivity trong `/dashboard/academy/page.tsx`

**Hiện tại** (dòng ~162):
```ts
const lastActivityDate = [
    lastProgress?.completedAt,
    lastQuizAttempt?.completedAt,
].filter(...).sort(...)[0];
```

**Sửa thành:** đưa `openedAt` vào nguồn activity:
- Query thêm `prisma.userProgress.findFirst({ where: { userId, openedAt: { not: null } }, orderBy: { openedAt: "desc" }, select: { openedAt: true } })`
- Gộp vào mảng `lastActivityDate` cùng `completedAt` + quiz.

**Thêm guard F5 + F6:**
```ts
// F5: Chỉ hiện inactivity warning khi user đã bắt đầu học
const hasStarted = completedLessons > 0;   // ĐÃ CÓ
const shouldShowInactivity = hasStarted && idleDays >= 7 && !inCooldown;
```
- `inCooldown` = cơ chế dismiss (xem 4.3)

### 4.3. Reminder dismissible + cooldown

**Yêu cầu spec:** Reminder phải dismissible và không hiện lại sau dismissal trong khoảng cooldown (configurable).

**Cách triển khai (khuyến nghị dùng localStorage — không cần migration thêm):**

**File:** `src/components/academy/` — tạo component wrapper hoặc sửa banner trong `page.tsx`.

1. **Dismiss button** trên banner "Paused X days" (nút "✕ Dismiss").
2. Khi dismiss → lưu vào `localStorage`:
   ```ts
   const key = "academy-inactivity-dismissed-at";
   localStorage.setItem(key, new Date().toISOString());
   ```
3. Khi render, kiểm tra:
   ```ts
   const dismissedAt = localStorage.getItem(key);
   const cooldownMs = 7 * 24 * 60 * 60 * 1000; // 7 ngày (configurable)
   const inCooldown = dismissedAt && (Date.now() - new Date(dismissedAt).getTime()) < cooldownMs;
   ```
   → Nếu `inCooldown` = true, không hiện banner inactivity.

> ⚠️ **Quan trọng:** `page.tsx` là **server component**. Không thể dùng `localStorage` trực tiếp. Cần **tách phần banner thành client component** (ví dụ `InactivityBanner.tsx` với `"use client"`) nhận props `idleDays`, `hasStarted`, `dismissible` và tự xử lý localStorage.

### 4.4. Estimated remaining lessons (F3)

Trong `/dashboard/academy/page.tsx`, dựa trên `nextLesson.duration` (đã có) + tổng duration còn lại:
```ts
// Tính tổng thời lượng các lesson chưa hoàn thành
let remainingMinutes = 0;
for (const level of levels) {
    for (const module of level.modules) {
        for (const lesson of module.lessons) {
            const isCompleted = lesson.progress.some((p) => p.isCompleted);
            if (!isCompleted && lesson.duration) remainingMinutes += lesson.duration;
        }
    }
}
```
- Hiển thị: `~{Math.round(remainingMinutes / 30)} sessions remaining` hoặc `~{remainingMinutes} mins remaining` (khi có data).
- Nếu không có data duration → ẩn (không hiện fake).

### 4.5. Completed path → completion state (F4)

**Hiện tại:** khi `nextLesson = null` (xong hết), banner biến mất.

**Sửa:** Khi `nextLesson === null && totalLessons > 0 && completedLessons === totalLessons`:
- Hiện **completion state**: "🎉 You completed the Academy!" + nút tới level tiếp theo (nếu có) hoặc certificates.
- Hoặc hiện **next optional path** (level chưa hoàn thành) nếu có.

**Logic bổ sung:**
```ts
const allCompleted = totalLessons > 0 && completedLessons === totalLessons;
```
- Nếu `allCompleted` → hiện completion card thay vì banner next-lesson.

---

## 5. Danh sách file thay đổi

| File | Thay đổi |
|---|---|
| `prisma/schema.prisma` | Thêm field `openedAt` vào `UserProgress` |
| `prisma/schema.prod.prisma` | (Nếu dùng) đồng bộ field `openedAt` |
| Migration mới | `add_user_progress_opened_at` |
| `src/app/dashboard/academy/lessons/[slug]/page.tsx` | Ghi `openedAt` khi mở lesson |
| `src/app/dashboard/academy/page.tsx` | Sửa inactivity (thêm openedAt + guard), thêm estimated remaining, thêm completion state |
| `src/components/academy/InactivityBanner.tsx` (MỚI) | Client component: banner dismissible + cooldown (localStorage) |
| Có thể thêm `src/app/api/academy/lesson-open/route.ts` (MỚI) | API ghi `openedAt` (nếu chọn cách an toàn) |

---

## 6. Verify

### 6.1. Build & lint
```bash
npm run build
npm run lint
npx tsc --noEmit
```

### 6.2. Migration
```bash
npx prisma migrate dev --name add_user_progress_opened_at
# Kiểm tra migration áp dụng sạch trên DB mới + DB dev hiện tại
```

### 6.3. Playwright matrix (spec 15.2)
- [ ] `/dashboard/academy` **active learner** — hiện next lesson + progress đúng
- [ ] `/dashboard/academy` **inactive learner** — hiện inactivity reminder + dismiss được + cooldown hoạt động
- [ ] `/dashboard/academy` **completed path** — hiện completion state (không dead-end)
- [ ] `/dashboard/academy` **missing-progress state** — hiện "Progress unavailable" thay vì fake %
- [ ] **User chưa enroll / chưa học** — KHÔNG hiện inactivity warning (F5)
- [ ] **Ngay sau khi hoàn thành lesson** — KHÔNG hiện reminder (F6)
- [ ] Light mode + dark mode
- [ ] Desktop + mobile
- [ ] Console không có lỗi mới

### 6.4. Data verification
- [ ] Inactivity dùng `openedAt` + `completedAt` + quiz (không chỉ login)
- [ ] Không fake % — `Progress unavailable` khi thiếu data
- [ ] Dismiss + cooldown đúng (không hiện lại sau dismiss trong cooldown)

---

## 7. Lưu ý quan trọng

- **Giữ nguyên** toàn bộ logic XP/badge/certificate hiện có — không đụng vào.
- **Không thay đổi** cấu trúc levels/modules/lessons.
- **Migration phải non-destructive** (chỉ thêm cột nullable).
- `page.tsx` là server component → mọi tương tác localStorage phải nằm trong client component tách riêng.
- Kiểm tra tất cả nơi `userProgress.count` / `findMany` để đảm bảo việc thêm `openedAt` (và có thể tạo record `isCompleted:false`) không làm sai số liệu.
- Sau mỗi bước, chạy build để verify trước khi sang bước kế tiếp.
