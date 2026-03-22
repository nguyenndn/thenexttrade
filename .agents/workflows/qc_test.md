---
description: Senior QC Test Case Generation and Verification Workflow
---

# QC Test Workflow (/qc_test)

## Vai trò & Mục tiêu
Hóa thân thành **Senior QC Engineer** khắt khe và tỉ mỉ. Phân tích một trang hoặc luồng cụ thể để vạch ra Test Plan, viết Test Cases bao phủ mọi ngóc ngách (Positive, Negative, Edge Cases), viết Automated Tests và bắt mọi bug tiềm ẩn trước khi release.

## Pre-Conditions (Điều kiện tiên quyết)
- [ ] Tính năng/trang đã được dev hoàn thành
- [ ] URL hoặc đường dẫn file đã được chỉ định
- [ ] Dev server đang chạy (để test thực tế nếu cần)

## Mandatory References
- `design/ui-guide.md` — UI standards
- `rules.md` — Project conventions
- Source code của trang/component target

## Quy trình (6 Bước Kiểm Thử)

### 1. Requirement Analysis (Khảo Sát Hiện Trạng)
- Đọc mã nguồn component target (dùng `view_file`, `grep_search`).
- Lập bản đồ tư duy:
  - **Inputs:** Dữ liệu đầu vào (form fields, URL params, props)
  - **Outputs:** Kết quả mong đợi (render, API response, state changes)
  - **States:** Loading, Empty, Data, Error, Disabled
  - **Actions:** User interactions (click, type, submit, navigate)

### 2. Test Scenario Generation (Lên Kịch Bản)
Vạch danh sách Test Cases chia làm **6 nhóm**:

#### A. UI/UX & Accessibility
| ID | Test Case | Priority |
|----|-----------|----------|
| UI-01 | Hiển thị đúng trên Mobile (375px) | High |
| UI-02 | Hiển thị đúng trên Tablet (768px) | High |
| UI-03 | Hiển thị đúng trên Desktop (1440px) | Medium |
| UI-04 | Dark Mode hiển thị đúng | High |
| UI-05 | Light Mode hiển thị đúng | High |  
| UI-06 | Keyboard Tab navigation hoạt động | Medium |
| UI-07 | Screen Reader (aria-labels) đầy đủ | Medium |

#### B. Language Check
| ID | Test Case | Priority |
|----|-----------|----------|
| LANG-01 | Không có text Tiếng Việt trên UI | 🔴 Critical |
| LANG-02 | Toast/Alert messages đều Tiếng Anh | 🔴 Critical |
| LANG-03 | Placeholder/Empty State đều Tiếng Anh | 🔴 Critical |

#### C. Functional Testing
| ID | Test Case | Priority |
|----|-----------|----------|
| FUNC-01 | Happy Path: Flow hoàn chỉnh từ đầu đến cuối | 🔴 Critical |
| FUNC-02 | Negative: Điền sai / bỏ trống → Validation hiện đúng | High |
| FUNC-03 | Negative: Email sai format, số âm, ký tự đặc biệt | High |
| FUNC-04 | Boundary: Max length input | Medium |

#### D. State & Error Handling
| ID | Test Case | Priority |
|----|-----------|----------|
| STATE-01 | Loading state hiển thị (spinner/skeleton) | High |
| STATE-02 | Empty state hiển thị đúng khi không có data | High |
| STATE-03 | Error state: API trả 500 → Toast error friendly | High |
| STATE-04 | Retry: Sau error có thể thử lại | Medium |

#### E. Security & Boundaries
| ID | Test Case | Priority |
|----|-----------|----------|
| SEC-01 | XSS: Inject `<script>alert('xss')</script>` vào input | 🔴 Critical |
| SEC-02 | Auth: Unauthorized user không access được | 🔴 Critical |
| SEC-03 | Rate Limit: Spam submit liên tục | Medium |

#### F. Regression
| ID | Test Case | Priority |
|----|-----------|----------|
| REG-01 | Các tính năng liên quan không bị ảnh hưởng | High |
| REG-02 | Navigation/Routing vẫn hoạt động đúng | High |

### 3. Viết Automated Tests (Test Code)
- **Unit Tests (Vitest):** Cho Server Actions, Utility functions, business logic:
  ```typescript
  // src/actions/comment.test.ts
  import { describe, it, expect } from 'vitest'
  
  describe('createComment', () => {
    it('should create comment with valid data', async () => { ... })
    it('should reject empty content', async () => { ... })
    it('should reject unauthorized users', async () => { ... })
  })
  ```
- **Component Tests (React Testing Library):** Cho UI components phức tạp.
- Chạy verify: `npx vitest run` — đảm bảo 100% pass.

### 4. Mental Execution (Mô Phỏng Kiểm Thử)
- Đọc luồng logic code, nhẩm tính:
  - Truyền **garbage data** vào → logic có crash không?
  - Thiếu **Optional Chaining** `?.` ở đâu?
  - **Race condition**: 2 request đồng thời có gây conflict?
- Khoanh vùng đoạn code **tỷ lệ sinh bug cao nhất**.

### 5. Device & Browser Matrix
Test trên các device/browser phổ biến:

| Device | Resolution | Browser | Status |
|--------|-----------|---------|--------|
| iPhone SE | 375x667 | Safari | ⬜ |
| iPhone 14 | 390x844 | Safari | ⬜ |
| iPad Air | 820x1180 | Safari | ⬜ |
| Desktop | 1440x900 | Chrome | ⬜ |
| Desktop | 1920x1080 | Firefox | ⬜ |

### 6. QC Report (Báo Cáo Nghiệm Thu)
Tổng hợp Test Report bằng Tiếng Việt:

```
## QC Test Report — [Tên Trang/Component]
### Tổng quan
- Tổng Test Cases: XX
- ✅ Pass: XX | ❌ Fail: XX | ⬜ Skipped: XX

### Bugs Found (Severity: Critical → Low)
| # | Severity | Test ID | Mô tả | Đề xuất Fix |
|---|----------|---------|--------|-------------|
| 1 | 🔴 Critical | LANG-01 | ... | ... |

### Coverage Matrix
| Nhóm | Cases | Pass Rate |
|------|-------|-----------|
| UI/UX | X/Y | 100% |
| Language | X/Y | 100% |
| Functional | X/Y | 95% |
```

## Output Artifacts
- [ ] Test Report (trong chat hoặc walkthrough.md)
- [ ] Automated Test files (`.test.ts` / `.test.tsx`)
- [ ] Bug list với severity levels

## Definition of Done
- [ ] Tất cả Critical test cases đã pass
- [ ] Automated tests viết xong và pass 100%
- [ ] Không có text Tiếng Việt trên UI
- [ ] Bugs đã được report với severity + fix suggestion

## Workflow tiếp theo
→ `/2super_dev` (Fix bugs found) → `/6qa_process` (Final QA before release)