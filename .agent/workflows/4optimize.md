---
description: Automated UI/UX, Feature, Code, and Mobile Responsive Optimization Workflow
---

# Breek Premium Optimization Workflow (/optimize)

**Mục tiêu:**
Tự động hóa luồng suy nghĩ (chain of thought) để rà soát, đề xuất và cải thiện một URL/Trang hoặc một Component cụ thể theo tiêu chuẩn "WOW Factor" của dự án (Breek Premium UI Guide).

**Khi user gọi lệnh:** `/optimize [đường_dẫn_hoặc_tên_trang]`

## Quy trình làm việc (AI hãy tuân thủ nghiêm ngặt 5 bước sau):

1. **Thẩm định Tiêu chuẩn "Breek Premium" (Đọc UI Guide)**
    - BẮT BUỢC: Truớc khi phân tích bất kỳ code nào, AI phải check và bám sát file `design/ui-guide.md` để đảm bảo không sai lệch Design System cốt lõi (Màu sắc, Variants, Hover effects, Typography).
    - KHÔNG ĐƯỢC tự bịa class Tailwind nếu không có trong Guide.

2. **Khảo sát Hiện trạng & Thu thập Context (Đọc Code)**
    - Tìm và đọc file nguồn chính của URL/Trang hoặc Component được nhắc đến (Sử dụng `find_by_name` và `view_file` hoặc `codebase_search`).
    - Phân tích bố cục DOM, logic React/Next.js (Server/Client), các dependency đang dùng và khả năng render dữ liệu thực tế.

3. **Phân tích Đa chiều (Lên kịch bản "Bắt bệnh")**
    AI phải tự đặt và trả lời 5 lăng kính sau dựa trên file code vừa đọc:
    - **Aesthetics & UI:** Đã đủ "Breek Premium" chưa? (Thiếu viền, thiếu border-white/5, màu sắc cục mịch, hover thô cứng, khoảng cách margin/padding mất cân đối).
    - **UX & Cấu trúc (Features/Reusability):** Có điểm đau (pain point) nào cho user không? Logic UI lặp lại có cần gộp thành Shared Component không (ưu tiên `src/components/ui/`)? Giao diện tab có cần gom gọn không?
    - **Chế độ hiển thị:** Đã hỗ trợ đẩy đủ màu sắc tương phản cho cả Light Mode và Dark Mode chưa? 
    - **Mobile Responsive:** Giao diện có nguy cơ tràn viền ngang trên điện thoại không? Có cần ẩn bớt cột trên Mobile, đổi dạng Grid sang Flex column, bo menu thành Hamburger không?
    - **Code Cleanliness & Performance:** Code có bị gọi quá nhiều API cùng lúc, có cần skeleton cho UX mượt không?

4. **Tổng hợp Báo cáo Khuyến nghị (Giao tiếp với User)**
    - Thay vì tự tiện sửa code ngay lập tức, AI hãy dùng tool `notify_user` để trình bày **3 đến 5 điểm góp ý sắc sảo nhất** (giống như bài phân tích tối ưu trang Strategies).
    - Báo cáo phải viết bằng Tiếng Việt, ngắn gọn, súc tích, chia gạch đầu dòng rõ ràng.
    - Chờ User xác nhận (Ví dụ: "OK, làm đi em" hoặc "Anh chỉ cần sửa điểm 1 và 3").

5. **Kế hoạch Thực thi (Implementation & Artifacts)**
    - Nắm bắt phản hồi của user, chuyển sang mode `PLANNING` tạo `implementation_plan.md` cho file quan trọng, sau đó chuyển `EXECUTION`.
    - Viết update lộ trình vào thẻ `task.md`.
    - Sửa code thông qua `multi_replace_file_content` hoặc `replace_file_content` với chú ý cao độ vào việc không làm hỏng tính toàn vẹn của thư viện và CSS cũ.

6. **Kiểm tra và Hoàn thiện (QA Check)**
    - Nếu thay đổi liên quan đến cấu trúc TS/TSX phức tạp, lập tức tự kiểm tra hoặc yêu cầu check terminal log.
    - Rà soát Pre-Delivery Checklist dự án: Đảm bảo Dark/Light tương thích, Không dùng Icon Emoji (Phải dùng Lucide React), giao diện Responsive (sm, lg) nguyên vẹn.
    - Báo cáo kết quả cuối cùng qua `notify_user` và kết thúc workflow.