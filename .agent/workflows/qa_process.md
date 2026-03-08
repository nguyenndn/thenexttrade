---
description: Automated Quality Assurance and Verification Workflow
---

# Breek Premium QA & Verification Workflow (/qa_process)

**Mục tiêu:**
Quy trình kiểm thử nghiêm ngặt đạt chuẩn Production-Ready (QA) áp dụng sau khi dev/optimize xong một tính năng. Đảm bảo code chạy ổn định, không lỗi vặt, responsive tốt, hiệu suất cao, bảo mật đầy đủ và chuẩn xác 100% theo Breek Premium Design System trước khi release đến tay người dùng.

**Khi user gọi lệnh:** `/qa_process` (Hoặc AI tự động kích hoạt ở Bước cuối cùng của quy trình `/optimize`).

## Kịch bản Kiểm tra & Tự Sửa Lỗi (Production-Ready QA Checklist):

1. **Kiểm tra Lỗi Cú pháp & Logic (Static & Runtime Checks)**
    - Chạy `npm run check` (hoặc test types JS/TS nếu không có lệnh riêng). Đảm bảo không có dòng lỗi Type đỏ nào liên quan.
    - Đảm bảo Terminal / Console browser SẠCH TƯNG: Không có ReferenceErrors, không có Hydration Mismatch errors. 
    - Nếu có Unit Test / Integration Test cho component đó, bắt buộc test pass 100%.

2. **Thẩm định "The LAW" - Breek Premium UI Guide**
    - **English Only Enforcement:** Càn quét khắt khe bề mặt giao diện, Toast và Form. NỘI QUY: Không được phép sót một chữ Tiếng Việt nào trên UI. Tự động Auto-Fix dịch toàn bộ text bị lỗi sang Tiếng Anh chuẩn (VD: "Tính năng đang phát triển" -> "Coming soon").
    - **Aesthetics Check:** Tuyệt đối không dùng class Tailwind chung chung kiểu `bg-blue-500`, `rounded-md`. Primary Action phải đúng chuẩn: `bg-primary hover:bg-[#00C888]`, `text-white`, `rounded-xl`.
    - Nút Cancel / Back / Đóng: BẮT BUỢC dùng `variant="outline"`, không dùng chữ trơn `variant="ghost"`.
    - Viền và Shadow chuẩn Breek Premium: Phải có `border-white/5` (Light mode `border-white/10`) và `rounded-xl` (Nghiêm cấm dùng sm/md thay thế).
    - **Icons:** Tất cả icon phải từ thư viện `lucide-react`. TRỪ ĐIỂM NGAY nếu thấy dùng Emoji làm icon trên giao diện (Ví dụ: ❌, 🚀, 📈 sẽ phải tự động sửa thành X, Rocket, TrendingUp).

3. **Kiểm tra UX & Edge Cases cực đoan**
    - **Mobile View (Sm, Md):** Trên màn nhỏ, tuyệt đối KHÔNG XUẤT HIỆN thanh cuộn ngang rác (horizontal scroll). Bảng (Table) dài phải được bọc trong `overflow-x-auto custom-scrollbar`. Layout Grid nhiều cột phải tụt về Flex-col.
    - **Tương thích Dark/Light Mode:** Form, Modal, Text đã set đủ class `dark:bg-[#151925]` / `dark:bg-[#1E2028]`, `dark:text-white` và class `bg-white`, `text-gray-900` cho chế độ sáng chưa?
    - **Loading State Mượt mà:** Nút Submit gọi API phải có trạng thái `isLoading` (quay spinner Loader2) và `disabled`. Tránh giật layout (layout shift) bằng Skeleton Loading hoặc hiệu ứng mờ nhạt tạm thời lúc fetch data.

4. **Hiệu suất & Tối ưu hóa (Performance & Next.js Best Practices)**
    - **Tối ưu Assets:** Các hình ảnh tĩnh có sử dụng `<Image>` từ `next/image` thay cho thẻ `<img>` thường chưa? Tránh load ảnh kích thước mộc.
    - **Clean Code:** Rút lại file: Đã xóa sạch các hàm import thừa (`unused imports`), console.log rác, và các mảng/biến không sử dụng để giảm Bundle Size chưa? Cleanup logic thừa từ `useEffect`.
    - **Client vs Server:** Đã tối đa hóa việc dùng Server Components (chạy trực tiếp server) chưa? Khuyến khích hạn chế gắn `'use client'` lên cấp gốc nếu không thực sự cần.

5. **Bảo mật & Tính xác thực dữ liệu (Security & Validation)**
    - Input Validation: Form Submit thao tác Data Base có được parse và validate trước chuẩn quy chuẩn (như Zod) ở phía Backend/Server Action không?
    - Fallback Ngăn Crack: Ứng dụng dứt khoát không được "trắng màn" (500 Error) khi API lỗi. Mọi luồng API Call phải được bọc bằng `Try/Catch` và hiển thị thông báo thân thiện (Friendly Error) qua UI Toast (`sonner` plugin).

6. **Tối ưu Hóa Công cụ tìm kiếm & Trải nghiệm Truy cập (SEO & A11y)**
    - SEO: Trang nội dung (Public) có khai báo thẻ `<title>`, `<meta description>` đúng chuẩn và chừa duy nhất một thẻ đỉnh `<h1>` đại diện cấu trúc phân cấp không?
    - Accessibility (A11y): Các Icon Button (nút điều hướng không chứa text) phải có gắn `aria-label` mô tả hành động đó phục vụ người khuyết tật. Chắc chắn Modal Form dễ dàng di chuyển bằng phím tab qua lại hợp lý.

7. **Autopilot: Review & Khắc phục tức thì (Auto-Fix)**
    - Phát hiện bất kỳ lỗi vi phạm nhỏ nào ở toàn bộ các hạng mục trên -> AI lập tức âm thầm chuyển mode **EXECUTION**, dùng tool sửa lại code ngay lập tức (không nhắc hoặc chờ User phải chỉ tay). 
    - Ví dụ: Thấy `<Button variant="ghost">` -> Sửa thành `outline`, Thấy import rác -> Delete đi, Thêm `aria-label` vào Icon.

8. **Báo cáo Nghiệm Thu Phát Hành (Final Release Sign-off)**
    - Sau khi AI xác nhận bản thân càn quét hoàn hảo tuyệt đối 100%, xuất ra Báo cáo QA Release dõng dạc cho User (Tiếng Việt). 
    - Định dạng form gồm Tick Xanh `[x] Đã Pass` với từng đề mục từ 1 tới 6 ở Cấp Độ Production. Tường thuật ngắn gọn "AI đã vừa tự tiện đè mã ở đâu để fix chui" nhằm minh bạch cho sếp (User). Thể hiện mình là một Tester xuất sắc.