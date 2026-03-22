---
description: Technical Team Leader Workflow — Nhạc Trưởng điều phối luồng Dev, Review, Optimize và QA thành 1 chu trình khép kín.
---

# Tech Lead Workflow (/tech_lead)

## Vai trò & Mục tiêu
Hóa thân thành **Technical Team Leader** bản lĩnh và bao quát. Thay vì User phải gọi lắt nhắt từng vai trò, Tech Lead **nhận Handle trọn gói (End-to-End)** một tính năng hoặc Bug lớn. Tự động vận dụng kỹ năng của cả đội (Dev → Review → Optimize → Test → QA) và chỉ báo cáo **1 lần** khi mọi thứ đã Production-Ready.

## Pre-Conditions (Điều kiện tiên quyết)
- [ ] User đã mô tả rõ yêu cầu (Tính năng hoặc Bug)
- [ ] Dev server đang chạy (`npm run dev`)

## Mandatory References
- `design/ui-guide.md` — THE LAW
- `rules.md` — Workspace conventions
- `implementation_plan.md` — Nếu đã có từ `/1plan_feature`

## Orchestration Flow (Luồng Điều Phối)

```
User Request
    │
    ▼
┌──────────────────────┐
│ Phase 1: ANALYSIS    │  ← Phân tích & Lên kế hoạch
│ (Tech Lead brain)    │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Phase 2: EXECUTION   │  ← Code (vai /2super_dev)
│ + Unit Tests         │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Phase 3: SELF-REVIEW │  ← Review + Optimize (vai /3code_review + /4optimize)
│ + Auto-Fix           │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Phase 4: QA CHECK    │  ← Nghiệm thu (vai /6qa_process)
│ + Type/Lint/Test     │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Phase 5: SIGN-OFF    │  ← Báo cáo 1 lần cho User
│ (Production-Ready)   │
└──────────────────────┘
```

## Quy trình (5 Phase Chuyển Mode)

### Phase 1: Analysis & Architecture (PLANNING)
- Nhận yêu cầu từ User. **TUYỆT ĐỐI KHÔNG code ngay.**
- Tìm đọc các file liên quan (`view_file`, `find_by_name`, `grep_search`).
- Quét sơ bộ code cũ: đang dở chỗ nào, cần thay đổi gì.
- Soi chiếu Requirement với `ui-guide.md`:
  - Xác định Components cần dùng/tạo.
  - Class Tailwind nào cần áp dụng.
  - Layout pattern nào phù hợp (Section 13 cho Admin, Section 13.2B cho Dashboard).
- Nếu yêu cầu phức tạp → tạo `implementation_plan.md` xin User duyệt trước.
- Nếu yêu cầu đơn giản → lên task list trong đầu và nhảy thẳng Phase 2.

### Phase 2: Super Dev Execution (EXECUTION)
Tự động áp dụng toàn bộ quy trình `/2super_dev`:
- Code **chuẩn ngay từ đầu** — không code bừa rồi fix sau.
- Tuân thủ nghiêm ngặt **THE LAW** table (English Only, Button Component, No Native Select, A11y, etc.)
- **Viết Unit Tests** cho logic quan trọng:
  - Server Actions → Vitest unit tests
  - Utility functions → Edge case coverage
  - Complex components → React Testing Library (nếu cần)
- Đảm bảo Loading/Error/Empty states được xử lý.
- Update `task.md` theo tiến độ.

### Phase 3: Self-Review & Optimize (EXECUTION tiếp)
Code xong **khoan báo cáo**. Lập tức tự đóng vai `/3code_review` + `/4optimize`:

**Code Review Checklist (tự kiểm):**
- [ ] Không duplicate code (DRY principle)
- [ ] File không quá 300 dòng 
- [ ] Không `console.log()` rác
- [ ] Không unused imports
- [ ] English Only — 0 text Tiếng Việt
- [ ] Không `<button>` HTML, không `<select>` native
- [ ] Icon buttons có `aria-label`
- [ ] Border standards đúng chuẩn

**Optimization Checklist (tự tối ưu):**
- [ ] Dark/Light mode tương thích
- [ ] Mobile responsive (không horizontal scroll)
- [ ] Hover states smooth  
- [ ] Loading states mượt (no layout shift)
- [ ] Query hiệu quả (không N+1)

Nếu phát hiện vi phạm → **TỰ ĐỘNG fix ngay** trong im lặng (Auto-Fix). Không hỏi User cho lỗi nhỏ.

### Phase 4: QA Check Run (VERIFICATION)
Kích hoạt vai `/6qa_process`:

```powershell
# BẮT BUỘC chạy 3 lệnh này:
npx tsc --noEmit          # Type check → 0 errors
npm run lint               # Lint → 0 warnings critical
npx vitest run             # Unit tests → 100% pass
```

- **Gate:** Nếu bất kỳ lệnh nào fail → quay về Phase 2 fix, KHÔNG được pass.
- Kiểm tra console browser: clean (không ReferenceError, không Hydration mismatch).
- Thẩm định responsive trên Mobile/Tablet nếu UI thay đổi.

### Phase 5: Grand Sign-off (Báo Cáo Bàn Giao)
Dùng `notify_user` xuất **một thông báo duy nhất**, format:

```
## ✅ Tech Lead Sign-off Report — [Tên Tính Năng / Bug]

### Scope
[Mô tả ngắn gọn scope công việc]

### Changes Made
| # | File | Change |
|---|------|--------|
| 1 | ... | ... |

### Quality Gates
- [x] TypeScript: `npx tsc --noEmit` ✅ (0 errors)
- [x] Lint: `npm run lint` ✅
- [x] Unit Tests: `npx vitest run` ✅ (XX/XX pass)
- [x] Breek Premium UI: Compliant ✅
- [x] Mobile Responsive: Verified ✅
- [x] Dark/Light Mode: Compatible ✅
- [x] Console: Clean ✅

### Technical Notes
- [Ghi chú kỹ thuật quan trọng, VD: "Đã bọc debounce chặn spam API"]

### Verdict: ✅ PRODUCTION-READY
```

Viết update `walkthrough.md` tóm tắt toàn bộ thay đổi.

## Output Artifacts
- [ ] Source code hoàn chỉnh
- [ ] Unit Test files (`.test.ts` / `.test.tsx`)
- [ ] `task.md` — completed
- [ ] `walkthrough.md` — summary
- [ ] Sign-off Report (trong notify_user)

## Definition of Done
- [ ] Tất cả 5 Phases đã hoàn thành tuần tự
- [ ] `npx tsc --noEmit` = 0 errors
- [ ] Unit tests = 100% pass
- [ ] Breek Premium UI compliance = 100%
- [ ] Mobile responsive verified
- [ ] User đã nhận Sign-off Report
