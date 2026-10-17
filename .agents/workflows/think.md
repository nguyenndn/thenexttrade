---
description: Deep sequential thinking and dynamic reasoning workflow. Activates sequentialthinking MCP tool for multi-step structured analysis, hypothesis verification, and architectural evaluation.
---

# /think — Deep Sequential Thinking & Reasoning Workflow

$ARGUMENTS

---

## Purpose

Kích hoạt chế độ **Suy luận tuần tự sâu (Sequential Thinking)** sử dụng MCP tool `sequentialthinking` thuộc server `sequential-thinking`. 
Được thiết kế cho các bài toán phức tạp, phân tích kiến trúc, rà soát mã nguồn (code audit), tái cấu trúc (refactoring), debug lỗi hiểm, hoặc tối ưu hóa luồng dữ liệu trước khi hành động.

---

## Quy tắc cốt lõi (Core Invariants)

1. **BẮT BUỘC gọi MCP `sequentialthinking`:**
   - Không chỉ "nghĩ thầm" trong phần tư duy mà **bắt buộc** phải gọi tool `call_mcp_tool` với `ServerName: "sequential-thinking"` và `ToolName: "sequentialthinking"`.
   - Tối thiểu từ 3 đến 5 bước tư duy (`thoughtNumber: 1..5`, điều chỉnh `totalThoughts` linh hoạt).

2. **Chu trình tư duy 5 pha (5-Phase Thought Cycle):**
   - **Pha 1 (Context & Intent):** Làm rõ vấn đề cốt lõi, mục tiêu người dùng, dữ liệu đầu vào.
   - **Pha 2 (Root Cause & Premise Challenge):** Thách thức các giả định ban đầu. Vấn đề thực sự nằm ở đâu? Có điểm mù hoặc ngộ nhận nào không?
   - **Pha 3 (Edge Cases & Tradeoffs):** Đánh giá các trường hợp biên, rủi ro hồi quy (regression), hiệu năng database/render, trải nghiệm người dùng (UX).
   - **Pha 4 (Hypothesis & Solution Alternatives):** Xây dựng tối thiểu 2-3 phương án giải quyết (Tối giản / Chuẩn kiến trúc / Đột phá).
   - **Pha 5 (Synthesis & Decision):** Chốt phương án tối ưu nhất kèm giải trình lý do rõ ràng.

3. **Cấm vội vàng code:**
   - Khi chạy `/think`, không được nhảy vào chỉnh sửa code nếu chưa qua bước suy luận và tổng hợp.
   - Kết hợp mượt mà với `/brainstorm` (lên ý tưởng), `/plan` (lập kế hoạch), hoặc `/dev` (thực thi).

---

## Các kịch bản kích hoạt (When to use /think)

- `/think [vấn đề]` — Phân tích chi tiết một vấn đề hoặc yêu cầu cụ thể.
- Khi gặp lỗi khó tái hiện (race conditions, memory leak, hydration mismatch, stale state).
- Khi đánh giá lại UI/UX của một màn hình xem thành phần nào dư thừa, lộn xộn.
- Khi thiết kế schema database, API contracts, hoặc nghiệp vụ tài chính/Forex.

---

## Cấu trúc phản hồi sau khi hoàn tất chuỗi Thinking

```markdown
## 🧠 Phân tích Suy luận Tuần tự (Sequential Thinking Summary)

### 1. Bản chất cốt lõi của bài toán
[Định nghĩa vấn đề chính xác, loại bỏ các chi tiết nhiễu]

### 2. Các điểm mù & Giả định đã được kiểm chứng
- Giả định 1: [Đúng/Sai + Lý do]
- Giả định 2: [Đúng/Sai + Lý do]

### 3. Phân tích Các phương án & Tradeoffs
| Tiêu chí | Phương án A | Phương án B | Phương án C |
|---|---|---|---|
| Ưu điểm | ... | ... | ... |
| Rủi ro / Tradeoff | ... | ... | ... |
| Độ phức tạp (Effort) | S / M / L | S / M / L | S / M / L |

### 4. Kết luận & Đề xuất hành động tiếp theo
[Đề xuất rõ ràng kèm bước thực thi cụ thể]
```
