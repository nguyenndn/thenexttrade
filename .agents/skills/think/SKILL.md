---
name: think
description: Deep sequential thinking and dynamic reasoning protocol via sequentialthinking MCP tool. Use whenever deep reflection, premise verification, architectural tradeoff analysis, or systematic problem decomposition is needed.
allowed-tools: sequentialthinking, Read, Edit, Write
version: 1.0
priority: HIGH
---

# think — Deep Sequential Thinking Protocol

> **CORE SKILL** — Kích hoạt khả năng suy luận tuần tự sâu sắc, đa chiều qua MCP tool `sequentialthinking`.

---

## 1. Nguyên tắc hoạt động

Khi người dùng yêu cầu suy nghĩ sâu, hoặc kích hoạt `/think`:
1. Bắt buộc kích hoạt tool `sequentialthinking` thuộc MCP `sequential-thinking`.
2. Không thực hiện suy luận nông cạn (shallow thinking) một lượt. Thực hiện tối thiểu từ 3 đến 5 steps tư duy liên tiếp.
3. Liên tục cập nhật các thuộc tính:
   - `thought`: Nội dung bước tư duy hiện tại.
   - `thoughtNumber`: Số thứ tự của bước.
   - `totalThoughts`: Ước lượng tổng số bước (tăng giảm linh hoạt theo độ phức tạp).
   - `nextThoughtNeeded`: `true` nếu cần đào sâu thêm, `false` khi đã tìm ra giải pháp tối ưu.
   - `isRevision`, `revisesThought`: Dùng khi nhận ra hướng đi trước đó chưa tối ưu hoặc phát hiện lỗ hổng.

---

## 2. Các pha tư duy bắt buộc (Thinking Chain)

1. **Context & Root Intent:** 
   - Không chỉ nghe bề mặt yêu cầu, tìm hiểu động cơ sâu xa đằng sau mong muốn của người dùng.
   - Định vị các ranh giới nghiệp vụ (domain boundaries) liên quan.

2. **Premise Challenge (Thách thức tiền đề):**
   - Vấn đề user nêu có phải là nguyên nhân gốc rễ hay chỉ là triệu chứng?
   - Giả định nào có thể sai hoặc ngộ nhận?
   - Có giải pháp đơn giản hơn không (KISS/YAGNI)?

3. **Tradeoffs & Edge Cases:**
   - Điều gì sẽ hỏng nếu áp dụng giải pháp này?
   - Ảnh hưởng gì tới hiệu năng (SSR, bundle size, DB queries, UI responsiveness)?
   - Các trường hợp ngoại lệ: user mới, data null/undefined, mạng chập chờn, quyền hạn hạn chế.

4. **Multi-Approach Generation:**
   - Luôn đưa ra từ 2-3 phương án:
     + *Phương án 1 (Minimal Viable):* Thay đổi ít nhất, an toàn nhất.
     + *Phương án 2 (Architectural Optimal):* Chuẩn cấu trúc, dài hạn, dễ mở rộng.
     + *Phương án 3 (Radical / Lateral):* Đổi mới góc nhìn, giải quyết triệt để.

5. **Actionable Synthesis:**
   - Kết luận súc tích, khách quan, có khuyến nghị rõ ràng (Recommended).
