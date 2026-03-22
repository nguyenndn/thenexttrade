---
description: Automated UI/UX, Feature, Code, and Mobile Responsive Optimization Workflow
---

# Optimization Workflow (/optimize)

## Vai trò & Mục tiêu
Đóng vai **UX Engineer & Performance Specialist**. Rà soát, đề xuất và cải thiện một URL/Trang hoặc Component cụ thể theo tiêu chuẩn "WOW Factor" của Breek Premium UI Guide. Tối ưu cả về thẩm mỹ, hiệu năng và trải nghiệm người dùng.

## Pre-Conditions (Điều kiện tiên quyết)
- [ ] Trang/Component target đã hoạt động (không bị crash)
- [ ] URL hoặc đường dẫn file đã được User chỉ định

## Mandatory References (Đọc TRƯỚC KHI phân tích)
- `design/ui-guide.md` — THE LAW: Nguồn sự thật duy nhất
- `rules.md` — Workspace conventions
- **KHÔNG ĐƯỢC tự bịa class Tailwind nếu không có trong ui-guide.md**

## Quy trình (6 Bước Tối Ưu)

### 1. Thẩm Định Tiêu Chuẩn Breek (Read UI Guide)
- Đọc `design/ui-guide.md` trước khi phân tích bất kỳ code nào.
- Ghi nhớ các quy chuẩn: Colors, Typography, Components, Layout Patterns, Border Standards.

### 2. Khảo Sát Hiện Trạng (Read Code)
- Tìm và đọc file nguồn chính (dùng `find_by_name`, `view_file`, `grep_search`).
- Phân tích: DOM structure, React logic (Server/Client), dependencies, data rendering.
- Ghi nhận **hiện trạng trước tối ưu** (để so sánh Before/After sau này).

### 3. Phân Tích Đa Chiều (7 Lăng Kính "Bắt Bệnh")

| # | Lăng kính | Câu hỏi kiểm tra |
|---|-----------|-------------------|
| 1 | **Premium Aesthetics** | Đủ "Breek Premium" chưa? Có `<button>` HTML, `<select>` native nào cần diệt? |
| 2 | **English Only** | Có text Tiếng Việt lọt trên UI (Toast, Placeholder, Empty State)? |
| 3 | **Accessibility (A11y)** | Icon buttons có `aria-label`? Keyboard navigation hoạt động? |
| 4 | **UX & Reusability** | Pain points cho user? Logic UI lặp cần gộp Shared Component? |
| 5 | **Dark/Light Mode** | Đủ contrast cho cả 2 mode? Thiếu class `dark:...` nào? |
| 6 | **Mobile Responsive** | Tràn viền ngang? Cần ẩn cột? Grid → Flex-col? Hamburger menu? |
| 7 | **Performance** | Gọi quá nhiều API? Cần Skeleton loading? Unused imports? Bundle size? |

### 4. Báo Cáo Khuyến Nghị (Report to User)
- **KHÔNG tự tiện sửa code ngay.** Dùng `notify_user` trình bày:
  - **3 đến 5 điểm góp ý sắc sảo nhất** (ưu tiên Critical → High → Medium)
  - Mỗi điểm gồm: **Vấn đề → Tác động → Giải pháp đề xuất**
- Báo cáo bằng Tiếng Việt, ngắn gọn, chia bullet points.
- **Chờ User xác nhận** ("OK, làm đi em" hoặc "Anh chỉ cần sửa điểm 1 và 3").

### 5. Thực Thi (Implementation)
- Nhận feedback User → chuyển mode `EXECUTION`.
- Viết `task.md` cho các thay đổi.
- Sửa code bằng `replace_file_content` / `multi_replace_file_content`.
- **Cẩn trọng cao:** Không làm hỏng logic/CSS cũ đang hoạt động.

### 6. Kiểm Tra & Hoàn Thiện (Post-Optimization QA)
- Chạy verify:
  ```powershell
  npx tsc --noEmit    # Type check
  ```
- Rà soát **Pre-Delivery Checklist** (từ `rules.md`):
  - [ ] No emojis used as icons?
  - [ ] Hover states smooth and consistent?
  - [ ] Dark/Light mode compatible?
  - [ ] Mobile responsive (No horizontal scroll)?
  - [ ] Console clean of errors?
- Báo cáo kết quả qua `notify_user` và kết thúc workflow.

## Output Artifacts
- [ ] Optimization Report (trong chat)
- [ ] Code đã tối ưu (các file sửa)
- [ ] `walkthrough.md` — Before/After summary

## Definition of Done
- [ ] Tất cả điểm User approve đã implement
- [ ] Pre-Delivery Checklist pass 100%
- [ ] `npx tsc --noEmit` pass
- [ ] UI không bị regression (so sánh trước/sau)

## Workflow tiếp theo
→ `/6qa_process` (QA kiểm thử) hoặc `/3code_review` (nếu thay đổi lớn)