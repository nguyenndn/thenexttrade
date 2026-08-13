# AI Coding Contract — Rules & Workflow để AI bám sát plan (không code thiếu)

> Áp dụng cho team vận hành repo bằng **Antigravity (Gemini)** hoặc bất kỳ AI coding tool nào.
> Mục tiêu: hết tình trạng *"plan đề ra nhưng AI code thiếu rất nhiều"*.

---

## 1. Vì sao AI "code thiếu"? (chẩn đoán thật, đã kiểm trong repo này)

AI không cố tình làm biếng. Nó thiếu vì **cấu trúc cho phép thiếu**. Các nguyên nhân thực tế:

| # | Nguyên nhân | Hệ quả | Cách chặn |
|---|---|---|---|
| 1 | Plan viết kiểu *mô tả* (WHAT), không phải checklist (WHAT + FILES + VERIFY) | AI tự bịa task list → bịa là rớt item | Chuẩn plan ở mục 3 |
| 2 | Không có luật "đọc file trước khi sửa" được bắt buộc | AI code theo tưởng tượng về codebase → sai schema, trùng logic | AGENTS.md RULE 1 |
| 3 | Không có lệnh verify bắt buộc cho từng bước | "Xong" = "viết code xong 1 lần", không chạy tsc/lint/build | AGENTS.md RULE 4 |
| 4 | Không có bước tự đối chiếu diff với plan | Item đầu làm kỹ, item cuối làm lướt hoặc bỏ (attention decay) | AGENTS.md RULE 6 |
| 5 | Chữ "etc.", "và các thứ tương tự", "xử lý phần còn lại" | AI tự quyết cái nào là *tùy chọn* rồi bỏ | Cấm trong chuẩn plan |
| 6 | Không có danh sách "không được làm" | AI sửa cả code không liên quan (scope creep), mục thật bị chôn vùi | DO-NOT list trong plan |
| 7 | Không có cam kết báo cáo DONE/BLOCKED từng mục | AI nói "xong" sau đoán 1 lần; người duyệt không biết cái gì bị bỏ | AGENTS.md RULE 7 |

> ⚠️ **Phát hiện cụ thể trong repo này:** workflow `/dev` và `/plan_feature` vốn
> đã bắt buộc đọc `rules.md` trước khi code, nhưng **`rules.md` không tồn tại** → AI được
> lệnh đọc file không có → bỏ qua → 0 quy tắc được áp dụng. Đã tạo file này để vá lỗ hổng.

---

## 2. Những gì đã được thêm/sửa trong repo

| Thay đổi | Nội dung |
|---|---|
| **`AGENTS.md`** (root, MỚI) | Standing Execution Contract — **7 rules bất biến**. Đây là file "luật" chính, được auto-load bởi các AI tool đọc `AGENTS.md` (GitHub standard). |
| **`rules.md`** (root, MỚI) | Stub vá lỗ hổng: các workflow cũ (`/dev`, `/plan_feature`, `/code_review`) bắt buộc đọc file này nhưng nó từng không tồn tại. Toàn bộ quy tắc đã gộp vào `AGENTS.md`; file này chỉ giữ làm "lối vào" trỏ sang `AGENTS.md`. |
| **`.agents/workflows/dev.md`** (SỬA) | Gắn `AGENTS.md` vào danh sách bắt buộc đọc; thêm bước "restate plan as checklist" (Bước 1), "self-audit diff vs checklist" + "báo cáo DONE/BLOCKED" (Bước 7), và Definition of Done mới. |
| **`.agents/workflows/plan_feature.md`** (SỬA) | Sửa reference hỏng: plan nói "chuyển sang `/2super_dev`" nhưng workflow thực tế là `/dev`. |

---

## 3. Workflow anh dùng từ giờ (3 bước)

```
[1] PLAN      → Em (Claude) viết plan theo PLAN FORMAT STANDARD (mục 4 bên dưới).
                Plan luôn là checklist đánh số, mỗi bước có FILES + ACCEPTANCE + VERIFY,
                kèm DO-NOT list và EXIT criteria.

[2] CHẠY      → Dán plan vào Gemini (Antigravity) kèm câu khởi động (mục 5).
                AGENTS.md ở root sẽ tự được đọc nếu tool hỗ trợ; nếu không, câu khởi
                động dưới đây bắt buộc nó phải đọc + tuân thủ.

[3] CHECK     → Gemini trả Execution Report theo template AGENTS.md RULE 7.
                Anh (hoặc em) đối chiếu từng item: DONE / BLOCKED.
                Item nào BLOCKED → bảo nó làm tiếp. Item nào "xong" mà thiếu → vi phạm RULE 5.
```

> Vòng lặp này hiệu quả vì **trách nhiệm theo dõi** nằm ở 2 chỗ: AI phải tự báo (Rule 7),
> và anh có checklist gốc để đối chiếu — không còn phụ thuộc vào trí nhớ hay thiện chí của AI.

---

## 4. PLAN FORMAT STANDARD (chuẩn để viết mọi plan)

Một plan tốt là **checklist thực thi được**, không phải đoạn mô tả. Cấu trúc tối thiểu:

```markdown
# <Tên task> — Implementation Plan

## GOAL
1 câu: "xong" nghĩa là gì với người dùng (đo được, không mơ hồ).

## CONTEXT / READ FIRST
- Danh sách file AI BẮT BUỘC đọc trước khi code (đường dẫn chính xác).

## DO-NOT (không được đụng)
- Liệt kê những gì KHÔNG được sửa / refactor / đổi tên / "cải thiện".

## STEPS (checklist đánh số — mỗi bước đủ 4 mục)
1. **<Tiêu đề ngắn>**
   - FILES: path đọc / path sửa / path tạo (chính xác)
   - CHANGE: hành vi cụ thể (input → output), KHÔNG viết "cải thiện X"
   - ACCEPTANCE: câu kiểm tra được để biết bước đã xong
   - VERIFY: lệnh chạy để chứng minh (vd `npx tsc --noEmit`)
2. ... (mỗi bước độc lập, đều ràng buộc như nhau)

## EXIT
- Lệnh verify tổng thể (vd `npm run build`) + template báo cáo (theo AGENTS.md Rule 7).
```

**Cấm trong plan:** "etc.", "và những thứ tương tự", "xử lý phần còn lại", "làm đẹp thêm",
"optimize". Mỗi item phải đếm được, kiểm được.

> 📌 **Quy ước với em:** từ giờ bất kỳ plan nào em viết cho anh (VD file academy master prompt,
> plan sửa bug, plan feature) đều tuân theo chuẩn này — anh không cần nhắc lại.

---

## 5. Câu khởi động dán kèm mọi plan (paste-ready)

Khi dán plan cho Gemini, dán kèm khối này trước plan:

```text
You are executing a plan in this repo. Before anything else:

1. Read `AGENTS.md` at the repo root — it is a binding execution contract with 7 rules.
   Obey every rule, even if the plan below doesn't repeat them.
2. In your first reply, restate THIS plan as a numbered checklist (Rule 2). Split any
   step with several deliverables into its own items. Never merge, drop, or simplify.
3. Work item by item: read files first, make the change, run the verify command, tick.
   Post progress as you go.
4. Before finishing: self-audit your diff against the checklist (Rule 6). Re-check the
   joints (imports exported, API routes reachable, fields in types+forms+DB, DB↔UI).
5. End with the Execution Report template from AGENTS.md (Rule 7): every item is DONE
   (what + verify command) or BLOCKED (exact reason). List plan items not done, and any
   change you made that was NOT in the plan.

PLAN:
<paste plan here>
```

---

## 6. Lưu ý cho repo này (từ kinh nghiệm các lần thiếu)

- **Script Prisma:** viết CommonJS (`.cjs`), chạy `node prisma/*.cjs` — đừng để AI dùng
  ts-node vì repo bật `noImplicitAny` → TS7006 dễ làm script fail nửa chừng rồi bị bỏ.
- **Academy content:** page render sẵn `<h1>` tiêu đề → content phải dùng `<h2>` section,
  không `<h1>`; ảnh nhúng `<figure><img>`; publish = `status: "published"` trong DB
  (Lesson không có `publishedAt`).
- **Verify hình ảnh / nội dung:** sau khi AI nói xong, mở UI + đối chiếu bảng file trong
  plan — đây là "tai mắt" của anh, AI chỉ tự báo theo Rule 7.
