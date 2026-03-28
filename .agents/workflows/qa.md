---
description: Unified QA workflow — Test Planning, Automated Tests, and Production-Ready Verification in one pass.
---

# QA Workflow (/qa)

## Vai trò & Mục tiêu
Hóa thân thành **Senior QA Engineer** khắt khe và tỉ mỉ. Kết hợp **Test Case Generation** (cũ `/qc_test`) và **Production-Ready Verification** (cũ `/qa_process`) thành 1 luồng duy nhất. Phân tích trang/luồng cụ thể, viết Test Cases, chạy Automated Tests, rà soát UI/Security/SEO, và bắt mọi bug tiềm ẩn trước khi release.

## Pre-Conditions
- [ ] Tính năng/trang đã dev xong
- [ ] URL hoặc đường dẫn file đã được chỉ định
- [ ] Dev server đang chạy (nếu cần test thực tế)

## Mandatory References
- `design/ui-guide.md` — UI standards
- `rules.md` — Project conventions
- Source code của trang/component target

---

## Quy trình (8 Bước)

### Phase A: Test Planning & Case Generation

#### 1. Requirement Analysis (Khảo Sát)
- Đọc mã nguồn component target (`view_file`, `grep_search`).
- Lập bản đồ:
  - **Inputs:** Form fields, URL params, props
  - **Outputs:** Render, API response, state changes
  - **States:** Loading, Empty, Data, Error, Disabled
  - **Actions:** User interactions (click, type, submit, navigate)

#### 2. Test Scenario Generation (Kịch Bản)
Vạch danh sách Test Cases chia **6 nhóm**:

**A. UI/UX & Accessibility**
| ID | Test Case | Priority |
|----|-----------|----------|
| UI-01 | Hiển thị đúng Mobile (375px) | High |
| UI-02 | Hiển thị đúng Tablet (768px) | High |
| UI-03 | Hiển thị đúng Desktop (1440px) | Medium |
| UI-04 | Dark Mode hiển thị đúng | High |
| UI-05 | Light Mode hiển thị đúng | High |
| UI-06 | Keyboard Tab navigation | Medium |
| UI-07 | Screen Reader (aria-labels) | Medium |

**B. Language Check**
| ID | Test Case | Priority |
|----|-----------|----------|
| LANG-01 | Không có text Tiếng Việt trên UI | 🔴 Critical |
| LANG-02 | Toast/Alert messages đều English | 🔴 Critical |
| LANG-03 | Placeholder/Empty State đều English | 🔴 Critical |

**C. Functional Testing**
| ID | Test Case | Priority |
|----|-----------|----------|
| FUNC-01 | Happy Path: Flow hoàn chỉnh | 🔴 Critical |
| FUNC-02 | Negative: Sai/bỏ trống → Validation | High |
| FUNC-03 | Negative: Email sai, số âm, ký tự đặc biệt | High |
| FUNC-04 | Boundary: Max length input | Medium |

**D. State & Error Handling**
| ID | Test Case | Priority |
|----|-----------|----------|
| STATE-01 | Loading state (spinner/skeleton) | High |
| STATE-02 | Empty state khi không có data | High |
| STATE-03 | Error state: API 500 → Toast friendly | High |
| STATE-04 | Retry sau error | Medium |

**E. Security & Boundaries**
| ID | Test Case | Priority |
|----|-----------|----------|
| SEC-01 | XSS: Inject script vào input | 🔴 Critical |
| SEC-02 | Auth: Unauthorized không access được | 🔴 Critical |
| SEC-03 | Rate Limit: Spam submit | Medium |

**F. Regression**
| ID | Test Case | Priority |
|----|-----------|----------|
| REG-01 | Tính năng liên quan không bị ảnh hưởng | High |
| REG-02 | Navigation/Routing vẫn đúng | High |

#### 3. Viết Automated Tests
- **Unit Tests (Vitest):** Server Actions, Utility functions, business logic
- **Component Tests:** React Testing Library cho UI phức tạp
- Chạy verify: `npx vitest run` — 100% pass

#### 4. Mental Execution (Mô Phỏng)
- Truyền garbage data → logic có crash?
- Thiếu Optional Chaining `?.` ở đâu?
- Race condition: 2 request đồng thời?
- Khoanh vùng code tỷ lệ sinh bug cao nhất

---

### Phase B: Production-Ready Verification

#### 5. Static & Runtime Checks
// turbo
```powershell
npx tsc --noEmit
```
// turbo
```powershell
npm run lint
```
// turbo
```powershell
npx vitest run
```
- **Gate:** Tất cả phải **0 errors**. Fail → fix trước.
- Console browser: **SẠCH** — Không ReferenceError, Hydration mismatch.

#### 6. Breek Premium UI Audit (THE LAW)

| # | Check Item | Severity | Auto-Fix? |
|---|-----------|----------|-----------|
| 6.1 | **English Only:** Không có chữ Tiếng Việt | 🔴 Critical | ✅ |
| 6.2 | **Premium Button:** Không `<button>` HTML chay | 🔴 Critical | ✅ |
| 6.3 | **No Native Select:** Không `<select>` native | 🔴 Critical | ✅ |
| 6.4 | **Lucide Icons:** Không Emoji làm icon | 🔴 Critical | ✅ |
| 6.5 | **A11y Labels:** Icon buttons có `aria-label` | 🟡 High | ✅ |
| 6.6 | **Cancel Variant:** Cancel/Close dùng `variant="outline"` | 🟡 High | ✅ |
| 6.7 | **Border Standards:** Light `border-gray-200`, Dark `dark:border-white/10` | 🟠 Medium | ✅ |
| 6.8 | **Border Radius:** Minimum `rounded-lg` | 🟠 Medium | ✅ |
| 6.9 | **Primary Actions:** `bg-primary hover:bg-[#00C888]` | 🟠 Medium | ✅ |

#### 7. UX, Performance, Security & SEO
- **Mobile:** Tuyệt đối KHÔNG horizontal scroll. Table dài → `overflow-x-auto`.
- **Dark/Light Mode:** Đủ contrast cả 2 mode.
- **Loading States:** Button `isLoading` + spinner. Data fetching có Skeleton.
- **Empty States:** Component Empty State thân thiện.
- **Image:** `<Image>` (next/image) thay `<img>`.
- **Client vs Server:** Maximize Server Components.
- **Input Validation:** Server Actions validate bằng Zod.
- **Auth Guard:** Protected routes kiểm tra session.
- **Error Handling:** API calls bọc `try/catch` + Toast friendly.
- **SEO (Public pages):** `<title>`, `<meta description>`, 1 `<h1>`, semantic HTML.

#### 8. Auto-Fix & QA Report

**Auto-Fix:** Vi phạm nhỏ → tự động fix ngay:
- Thêm `aria-label` thiếu
- Đổi `variant="ghost"` → `outline` cho Cancel
- Xóa `console.log()` rác
- Thêm locale `'en-US'` cho `toLocaleDateString()`

**QA Report:**
```
## QA Report — [Tên Trang/Component]

### Summary
- Tổng Test Cases: XX
- ✅ Pass: XX | ❌ Fail: XX | ⬜ Skipped: XX

### Production-Ready Checklist
- [x] Static Checks: tsc + lint + vitest ✅
- [x] Breek Premium UI: 9/9 checks ✅
- [x] Mobile Responsive ✅
- [x] Dark/Light Mode ✅
- [x] Security ✅
- [x] Console Clean ✅

### Bugs Found
| # | Severity | Test ID | Mô tả | Fix |
|---|----------|---------|--------|-----|

### Auto-Fixes Applied
| # | File | Change |
|---|------|--------|

### Verdict: ✅ APPROVED / ⚠️ CONDITIONAL / ❌ NEEDS FIX
```

---

## Output Artifacts
- [ ] QA Report (trong chat hoặc walkthrough.md)
- [ ] Automated Test files (`.test.ts` / `.test.tsx`)
- [ ] Bug list với severity levels
- [ ] Auto-fixed code

## Definition of Done
- [ ] Tất cả Critical test cases pass
- [ ] Automated tests pass 100%
- [ ] Breek Premium UI 9/9 checks
- [ ] Không text Tiếng Việt trên UI
- [ ] Mobile responsive verified
- [ ] Console clean

## Workflow tiếp theo
→ `/super_dev` (Fix bugs found)
→ `/push_code` (nếu APPROVED)
