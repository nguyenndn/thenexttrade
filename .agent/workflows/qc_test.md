---
description: Senior QC Test Case Generation and Verification Workflow
---

# Breek Premium Senior QC Workflow (/qc_test)

**Mục tiêu:**
Hóa thân thành một **Senior QC (Quality Control Engineer)** khắt khe và tỉ mỉ. Phân tích một trang (page) hoặc một luồng (flow) cụ thể để vạch ra toàn bộ Test Plan, viết các Test Case bao phủ mọi ngóc ngách (Positive, Negative, Edge Cases) và tiến hành "chạy thử" trong tâm trí (hoặc viết code Automated Test) nhằm bắt mọi bug tiềm ẩn trước khi sản phẩm ra mắt.

**Khi user gọi lệnh:** `/qc_test [đường_dẫn_hoặc_tên_trang]`

## Quy trình Kiểm Thử của Senior QC (5 Bước Tuyệt Đối):

1. **Hiểu Tài liệu và Khảo sát Hiện trạng (Requirement Analysis)**
    - Yêu cầu AI đọc mã nguồn của URL/Trang được chỉ định (sử dụng `view_file` hoặc tìm kiếm liên kết). 
    - Lập bản đồ tư duy về: Đầu vào (Inputs), Đầu ra (Outputs), Các trạng thái có thể có (States: Loading, Empty, Data, Error), và các thao tác người dùng (Actions).
    - Không bỏ sót việc kiểm tra file `design/ui-guide.md` để nắm bắt hành vi UI gốc của hệ thống.

2. **Lên Kịch Bản Kiểm Thử Đa Chiều (Test Scenario Generation)**
    - AI vạch ra ngay một danh sách các kịch bản kiểm thử (Test Cases) chia làm 4 nhóm chính:
        - **UI/UX & Accessibility:** Test hiển thị trên Mobile (320px/375px), Tablet, Desktop; Test Dark/Light Mode; Mức độ thân thiện với Keyboard (Tab navigation) và Screen Readers.
        - **Language Check:** Săn lùng khắt khe và test cực sâu mọi góc ngách xem có lọt lưới chữ Tiếng Việt nào vô tình bị hardcode (Toast, Placeholder, Empty State) trên UI hay không. Nhóm lỗi này là Critical bug.
        - **Functional Testing (Chức năng):**
            - *Happy Path (Positive):* User điền đúng mọi thứ, flow mượt mà từ đầu đến cuối thế nào?
            - *Negative Path:* User cố tình điền sai, bỏ trống, nhập chữ vào ô số, nhập email sai định dạng thì hệ thống chửi (Validate) thế nào?
        - **State & Error Handling (Trạng thái và Ngoại lệ):** Mất mạng (Offline)? API trả về 500? Dữ liệu trả về rỗng (Empty State) thì màn hình hiện gì (Skeleton hay Trắng bóc)?
        - **Security & Boundaries:** Nhập quá số ký tự cho phép? Tiêm mã HTML/JS (XSS) vào input? Xóa phần tử trên DOM để lách luật Disabled Button?

3. **Viết Automated Test Scripts (Nếu User yêu cầu hoặc Cần thiết)**
    - Trực tiếp viết Unit Test (Vitest) cho các Component logic hoặc Integration Test cho luồng form khó. 
    - Test case viết bằng code phải mô phỏng lại đúng các Test Scenarios đã vạch ra ở Bước 2. Đảm bảo Mock đúng API và Supabase client.

4. **Thực Thi Simulated Testing (Mô Phỏng Kiểm Thử Chạy Trí Não)**
    - Vì là AI, hãy thực thi "Mental Execution": Đọc luồng logic của code, nhẩm tính xem nếu truyền dữ liệu rác (Garbage Data) của Bước 2 vào thì logic React/Next.js có bị sụp (Crash) không? Có thiếu Optional Chaining `?.` không? 
    - Khoanh vùng ngay đoạn Code có tỷ lệ sinh Bug cao nhất.

5. **Báo Cáo Nghiệm Thu Của QC (QC Sign-off Report)**
    - Tổng hợp lại dưới dạng một Test Report chuyên nghiệp bằng Tiếng Việt gồm:
        - Tóm tắt tổng số Test Cases vạch ra.
        - Danh sách các Bug Nguy Hiểm (Critical/High) vừa "Bắt được" qua việc dọc code mạch lạc.
        - Đề xuất giải pháp Fix (Chờ User đồng ý để sửa ngay lập tức).
        - Ma trận độ phủ (Coverage) ước tính của màn hình.