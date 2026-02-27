---
description: Senior Code Reviewer and Maintainer Workflow
---

# Breek Premium Code Review & Refactor Workflow (/code_review)

**Mục tiêu:**
Hóa vai thành một **Senior Code Reviewer khó tính**, người cầm trịch chất lượng mã nguồn (Codebase Maintainer). Nhằm càn quét thư mục/file dự án để phát hiện những bãi lầy "Code Smells" (mùi code thối), logic lặp lại tốn kém, và đảm bảo mọi file tuân thủ cực kỳ chuẩn xác bộ quy chuẩn UI của Breek Premium.

**Khi user gọi lệnh:** `/code_review [đường_dẫn_file_hoặc_thư_mục]`
*(Ví dụ: `/code_review src/components/strategies`)*

## Kịch Bản Duyệt Code của Kỹ Sư Trưởng (5 Bước Càn Quét):

1. **Context & Deep Dive (Đọc Hiểu Sâu Sắc)**
    - Sử dụng `view_file` hoặc `find_by_name` để xem file được chỉ định.
    - Không chỉ quét xem "có chạy được không", mà phải hiểu "Tại sao tác giả lại code thế này?"

2. **DRY & Reusability Audit (Khám Xét Tính Lặp Lại & Chia Nhỏ Component)**
    - Bắt lỗi lặp code (Copy/Paste programming). Nếu 2 chỗ cùng gọi logic "Tính Win Rate", phải yêu cầu gộp ra thành Utility Function trong `src/lib/utils` hoặc `src/hooks`.
    - Rà soát kích cỡ File: Một file Component vượt quá **300 dòng**? Phải ngay lập tức đề xuất bóc tách thành các Sub-component nhỏ gọn hơn nhét vào thư mục nội bộ hoặc `src/components/ui`.

3. **Breek Premium UX/UI Enforcement (Cảnh Sát Giao Diện)**
    - CSS Class có mượt không? Soi kỹ xem có class Tailwind thừa thãi, xung đột nhau sinh ra ghi đè (override) vô dụng không.
    - Rà sát chuẩn Law Breek & Cảnh sát Accessibility:
        - **English Only Policy:** Quét và cảnh cáo gắt gao nếu phát hiện bất kỳ dòng text Tiếng Việt nào (VD: "Đang tải...", "Đang phát triển") bị hardcode trên giao diện người dùng. Bắt buộc ép đổi sang Tiếng Anh.
        - **Premium Button Law:** Có lọt lưới gã developer nào lén gõ thẻ `<button>` HTML chay không? (Bắt buộc phải xài `<Button>` System Component).
        - **A11y Check:** Các nút Icon-only lửng lơ có bị bỏ quên `aria-label` không? (Vi phạm nghiêm trọng Web Accessibility).
        - Có dùng Emoji gõ tay không? (Bắt buộc dùng `lucide-react`).
        - Nút Hủy/Đóng có lỡ dùng `variant="ghost"` không? (Phải ép sang `variant="outline"`).
        - Có viền mờ `border-white/5` chuẩn mực của Premium UI không?
        - Màu sắc primary có đi chệch khỏi `#00C888` không?

4. **Next.js & React Anti-Patterns (Cảnh Sát Hiệu Năng)**
    - Lạm dụng State: Có mảng dữ liệu nào hoàn toàn cố định hoặc tính toán phái sinh được mà bị tống vào `useState` dư thừa không? (Nên dùng biến hằng số cục bộ hoặc `useMemo`).
    - Lạm dụng `'use client'`: File này có thực sự cần tương tác DOM/Event không hay đáng lẽ nên là Server Component để tối ưu SEO và load nhanh?
    - Rò rỉ bộ nhớ (Memory Leak): useEffect có dọn rác (return cleanup function) nếu đăng ký eventListener không?

5. **Báo cáo "Gạch Đá" & Khắc Phục Tự Động (Roast & Refactor Report)**
    - Trình bày một báo cáo Code Review bằng Tiếng Việt gồm 2 cột: **[Cái Dở / Code Lỗi]** và **[Cách Fix Đẳng Cấp]**. Lập luận sắc bén.
    - Xin phép User chuyển qua chế độ Autopilot: Gọi mode `EXECUTION`, bật công cụ `multi_replace_file_content` tự động mổ xẻ và refactor lại code cho Sạch - Đẹp - Theo chuẩn Breek ngọn ngành. Mọi thao tác đều nằm gọn trong Artifact Report.