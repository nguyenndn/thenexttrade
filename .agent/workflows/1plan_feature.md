---
description: Business Analyst & System Architect Feature Planning Workflow
---

# Breek Premium Architecture & Planning Workflow (/plan_feature)

**Mục tiêu:**
Đóng vai trò là một **Business Analyst (BA) kiêm System Architect** dày dặn kinh nghiệm. Quy trình này được kích hoạt KHI BẮT ĐẦU MỘT TÍNH NĂNG MỚI (chưa có dòng code nào được gõ). AI sẽ giúp chuyển hóa một "Ý tưởng mơ hồ" của User thành một bản Đặc tả Phần mềm (SRS), Thiết kế Cấu trúc Database (Supabase) hoàn chỉnh và lường trước mọi rủi ro kỹ thuật.

**Khi user gọi lệnh:** `/plan_feature [Tên_tính_năng_hoặc_Mô_tả_ý_tưởng]`
*(Ví dụ: `/plan_feature chức năng bình luận bài viết`)*

## Kịch bản Tư duy của System Architect (6 Bước Tiền Trạm):

1. **Hiểu Yêu Cầu & Bóc Tách User Story (Requirement Elicitation)**
    - Đặt câu hỏi khai thác nếu ý tưởng của User còn thiếu logic. (Ví dụ: "User bình luận thì Admin có cần duyệt không?", "Có cho phép đính kèm hình ảnh không?").
    - Định hình rõ User Story: *Là một [Vai trò], tôi muốn [Hành động] để [Đạt được mục đích]*.

2. **Thiết kế Cơ sở Dữ liệu Supabase (Database Schema & RLS)**
    - Phác thảo cấu trúc Bảng (Tables) cần thiết. Xác định rõ các trường (Columns) và kiểu dữ liệu (UUID, text, boolean, jsonb, timestamp).
    - Vạch rõ các Mối quan hệ (Relationships: 1-1, 1-n, n-n) và Khóa ngoại (Foreign Keys).
    - **CỰC KỲ QUAN TRỌNG:** Phải vạch ra các chính sách bảo mật Row Level Security (RLS) của Supabase (Ai được SELECT, INSERT, UPDATE, DELETE).

3. **Thiết Kế API & Server Actions (Backend Logic)**
    - Lên danh sách các Next.js Server Actions (ví dụ: `createComment`, `fetchComments`, `deleteComment`).
    - Định nghĩa rõ Payload Data (Input cần truyền vào) và Output (Kết quả trả về).
    - Cân nhắc các lớp Validate bằng Zod Schema.

4. **Kiến trúc UI/UX & State Management (Frontend Flow)**
    - Đề xuất Component Tree (Sơ đồ chia nhỏ Component). Ví dụ thay vì nhét chung, hãy chia thành `<CommentList>`, `<CommentItem>`, `<CommentInput>`.
    - Xác định các State cốt lõi: Làm sao quản lý trạng thái Loading lúc submit? Nếu lỗi thì hiện Toast hay Error Boundary? Làm sao để Empty State trông không bị "chợ" mà ra dáng Breek Premium?

5. **Đánh giá Rủi ro Kỹ thuật (Risk Assessment)**
    - Đóng vai "Kẻ bàn lùi": Chỉ ra điểm yếu chí mạng của tính năng này.
    - *Hiệu năng:* Nếu bài có 1000 bình luận thì query load hết 1 lần có chết server không? (Đề xuất: Pagination/Infinite Scroll).
    - *Bảo mật:* Có bị spam submit liên tục (Rate limit/Throttle) không? 

6. **Chốt Hạ Kế Hoạch (Implementation Blueprint)**
    - Sau khi AI định hình xong 5 bước trên, tổng hợp thành một bản Khảo Sát & Lộ Trình (Blueprint) cực kỳ chuyên nghiệp và dễ hiểu bằng Tiếng Việt.
    - Chờ User (Giám đốc dự án) gật đầu phê duyệt: "Duyệt thiết kế này, code đi em". Sau đó AI mới chuyển sang bước tạo Artifact `implementation_plan.md` và bắt tay vào mode `EXECUTION`.