# Trading Style Assessment (Know Your Style) — Spec từ Implementation Thật của MMFX

> **Tài liệu nghiên cứu từ page `mmfx-know-your-style.vercel.app`** (trích xuất trực tiếp từ client bundle JS) và kế hoạch triển khai cho TheNextTrade.
> *Phiên bản:* 2.0 — *Ngày cập nhật:* 21/08/2026 — *Trạng thái:* Research → Proposal & Architecture Spec

---

## 📌 Executive Summary (Tóm Tắt Tổng Quan)

Tính năng **Trading Style Assessment (Know Your Style)** là hệ thống trắc nghiệm tâm lý & hành vi giao dịch gồm **14 câu hỏi** (thực tế mmfx dùng **14 câu tiếng Anh** với 3–7 lựa chọn/câu, không cố định 4 như bản v1) đo trên **6 trục tâm lý** và phân loại trader vào **8 Archetypes**.

⚠️ **Điểm sửa so với bản v1.0** (quan trọng):
- **Archetypes: 6 → 8.** Tên thật của mmfx khác hẳn (xem §II). Bản cũ có 4 archetype không tồn tại (`Scalp Addict`, `Disciplined Operator`, `Impulsive Gambler`, `Intuitive Maverick`) và thiếu 6 archetype thật.
- **14 câu hỏi là câu tiếng Anh thật của mmfx** (kèm theme + trọng số chấm điểm + delta dimension từng option), không phải 14 câu tự đặt.
- **Thuật toán chấm điểm**: counter cộng trọng số `scoring` trên 8 archetypes → lấy max → **tiebreak bằng câu q5** → có **trường hợp đặc biệt** (q1=a & q5=g & q7=e ⇒ `brand_new_beginner`). Dimension 0–100 được chuẩn hóa từ delta âm/dương (xem §IV).
- **Vị trí (trả lời câu hỏi "dashboard hay public")**: mmfx là **100% public lead magnet** (SPA độc lập, không cần login, có `?app=1` để nhúng, nút email-self, không có khái niệm dashboard). Khuyến nghị TheNextTrade: **public làm funnel chính** + lưu kết quả vào dashboard profile khi đã login (mô hình lai như bản cũ, nhưng public trước, dashboard sau).

Hệ thống mang lại giá trị 4-trong-1:
1. 🧲 **Public Lead Magnet (Viral)**: Thu hút trader tham gia test, chia sẻ kết quả, chuyển đổi đăng ký.
2. 🤖 **AI Coach Hyper-Personalization**: Kết quả (archetype + 6 dimension + report) là đầu vào chuẩn cho AI Coach.
3. 📋 **Cá Nhân Hóa Dashboard**: Gợi ý Trading Rules theo điểm yếu của từng style.
4. 👑 **IB & CRM Intelligence**: Admin/IB nhìn thấy nhãn style + điểm yếu để tư vấn tài khoản phù hợp.

---

## 🧠 I. Khung Đo Lường Tâm Lý (6 Core Dimensions)

Bài test đánh giá trader trên thang điểm **0 – 100** theo 6 chiều (chuẩn hóa từ tổng delta +/− mỗi câu, xem §IV). **Xác nhận: 6 trục này của bản v1.0 khớp 100% với mmfx** (tên + nhãn thấp/cao đều trùng):

| ID | Trục Đo Lường | Thang Điểm Thấp (lowPole) | Thang Điểm Cao (highPole) |
|---|---|---|---|
| `process_routine` | **Process & Routine** | *Wings it* (giao dịch tự phát) | *Routine-driven* (chuẩn bị kỹ, journal) |
| `decisiveness` | **Decisiveness** | *Hesitant* (do dự, FOMO) | *Decisive* (quyết đoán) |
| `risk_discipline` | **Risk Discipline** | *Reckless* (đánh bạc, gồng lỗ) | *Disciplined* (quản trị vốn chặt) |
| `emotional_control` | **Emotional Control** | *Tilt-prone* (dễ cay cú, trả thù) | *Composed* (bình thản) |
| `consistency` | **Consistency** | *System-hopper* (đổi hệ thống) | *Committed* (kiên định) |
| `independent_conviction` | **Independent Conviction** | *Dependent* (phụ thuộc tín hiệu) | *Independent* (tự phân tích) |

**Cách đọc kết quả của mmfx**: 6 dimension được xếp tăng dần; **2 điểm thấp nhất (≤ 50) và 2 cao nhất (≥ 60) được đánh dấu** — câu tagline: *"Six dimensions of how you trade. Your weakest are where the money leaks."* (Điểm yếu chính là chỗ thủng tiền).

---

## 🎯 II. Bộ 8 Phong Cách Giao Dịch (Archetypes) — Tên Thật của MMFX

Thuật toán cộng trọng số `scoring` trong từng option để tìm ra **1 trong 8 archetypes**:

| ID | Tên hiển thị (mmfx) | Bản dịch gợi ý (VNI) | Bản v1 cũ (SAI — bỏ) |
|---|---|---|---|
| `reckless_gambler` | **The Reckless Gambler** | Tay Chơi Liều Lĩnh | 🎲 Impulsive Gambler ❌ |
| `analysis_paralyser` | **The Analysis Paralyser** | Kẻ Do Dự Tri Thức | ✅ giữ nguyên |
| `signal_dependent` | **The Signal Dependent** | Kẻ Phụ Thuộc Tín Hiệu | ❌ không có |
| `indicator_stacker` | **The Indicator Stacker** | Thợ Chất Đống Chỉ Báo | ❌ không có |
| `emotional_revenge_trader` | **The Emotional Revenge Trader** | Kẻ Trả Thù Cảm Xúc | ❌ không có |
| `news_trader` | **The News Trader** | Kẻ Đu Tin Tức | ❌ không có |
| `system_hopper` | **The System Hopper** | Thợ Săn Chén Thánh | ✅ giữ nguyên |
| `brand_new_beginner` | **The Brand New Beginner** | Tân Binh | ❌ không có |

Mỗi archetype trong bundle JS có cấu trúc JSON đầy đủ để render trang kết quả:

```
{ id, name, summary,
  strengths: string[], weaknesses: string[], common_mistakes: string[],
  focus: string[],
  mmfx_path: { resources: string[], tier: "free"|"team_mm"|"mentorship", cta_text: string },
  keystone: { path, label, why } }
```

### Ví dụ cấu trúc đầy đủ (The Reckless Gambler)
```json
{
  "id": "reckless_gambler",
  "name": "The Reckless Gambler",
  "summary": "High risk tolerance, no system, chases price, blows accounts and reloads.",
  "strengths": ["Bold and takes action", "Isn't afraid of the market", "High engagement"],
  "weaknesses": ["No edge", "No risk management", "No patience"],
  "common_mistakes": ["Revenge trading after losses", "Doubling down on losing positions", "Sizing up to chase a feeling"],
  "focus": ["Build a system before sizing up", "Capital preservation comes before profit", "Pre-defined position sizing rules"],
  "mmfx_path": { "resources": ["MM System eBook"], "tier": "team_mm",
    "cta_text": "Start with the MM System eBook to learn the framework, then open a Team MM tier account with the broker to lock in accountability and structure." },
  "keystone": { "path": "/course", "label": "Managing & Routine module", "why": "Build the risk rules first — fixed sizing and hard stops before anything else." }
}
```
(7 archetype còn lại cũng có đủ 8 trường này — có thể export nguyên cụm từ bundle khi implement.)

---

## 📝 III. 14 Câu Hỏi Thật Của MMFX (English, Verbatim)

Mỗi câu có: `id`, `theme`, `text` (tiếng Anh gốc), `options[]` mỗi option gồm `id` (a/b/c/…), `text`, `scoring` (trọng số → archetype), và `dimensions` (delta +/− → 6 trục, tùy option).

| # | theme | Câu hỏi (EN gốc) | # option | Đặc điểm |
|---|---|---|---|---|
| q1 | Experience | How long have you been trading? | 4 | q1→a nặng `brand_new_beginner:3` |
| q2 | Style & Timeframe | What's your typical trade duration on **XAU/USD**? | 5 | Có option "I don't trade gold yet" |
| q3 | Your Edge | When you enter a trade, what's the actual reason? | 6 | "Multiple indicators all lining up" → `indicator_stacker:3` |
| q4 | Risk & Sizing | How would you describe your usual position sizing? | 5 | "Size up when losing" → `emotional_revenge_trader:3` |
| q5 | **Your Leak** | **Which of these hurts you most?** | 7 | **Câu tiebreaker** + đặc biệt |
| q6 | Signals | How do you use signals from others? | 4 | "Trade blind" → `signal_dependent:3` |
| q7 | Psychology | After a loss, what's most typical for you? | 5 | q7→e tham gia special-case |
| q8 | Motivation | Why are you trading? | 6 | Không có scoring archetype, chỉ dimension |
| q9 | Your Routine | Before you place a trade, how often is the plan — entry, stop, target — decided in advance? | 4 | "Always written down" → process_routine:+3 |
| q10 | Review & Journaling | Do you journal your trades and review them? | 4 | "Every trade" → process_routine:+3, consistency:+1 |
| q11 | Commitment | You've followed a strategy for 8 trades and you're slightly down. What's your move? | 4 | "Start looking for a better strategy" → `system_hopper:3` |
| q12 | Decisiveness | A setup you trade appears, but it's only about 80% textbook. What do you do? | 4 | "Skip — only perfect" → `analysis_paralyser:3` |
| q13 | Under Pressure | Gold spikes 30 pips against you seconds after you enter — your stop is not hit. What actually happens? | 4 | "Move stop further" → risk_discipline:−3 |
| q14 | Independence | If every signal group and indicator vanished tomorrow, could you find and manage a trade on a bare XAU/USD chart? | 4 | "No — wouldn't know where to start" → `signal_dependent:2` |

> **Ghi chú thiết kế**: Toàn bộ nội dung quiz của mmfx là **tiếng Anh** (kể cả text). TheNextTrade dùng UI tiếng Anh theo design system hiện tại — nên giữ nguyên câu EN gốc, có thể thêm song ngữ sau này. Các câu hỏi đều hỏi về **XAU/USD** (vàng) vì là sản phẩm của MMFX; TheNextTrade tương đương cũng trade vàng → giữ nguyên là hợp lý.

**Bảng scoring chi tiết từng option** (để implement chính xác — trích trực tiếp từ bundle):

<details>
<summary>Chi tiết 14 câu × option × scoring/dimensions (bấm để mở)</summary>

```
q1 "How long have you been trading?"
  a Less than 6 months        → brand_new_beginner:3, reckless_gambler:1
  b 6 months to 2 years       → reckless_gambler:1, indicator_stacker:1, system_hopper:1, emotional_revenge_trader:1
  c 2 to 5 years              → system_hopper:1, indicator_stacker:1, analysis_paralyser:1, emotional_revenge_trader:1
  d 5+ years                  → analysis_paralyser:2, news_trader:1   | dims: process_routine:+1

q2 "What's your typical trade duration on XAU/USD?"
  a Minutes (in and out same hour)     → emotional_revenge_trader:2, reckless_gambler:1   | dims: emotional_control:−1
  b Hours (multiple times per day)     → news_trader:2, indicator_stacker:1, emotional_revenge_trader:1
  c A day or two                       → indicator_stacker:2, analysis_paralyser:1, news_trader:1   | dims: process_routine:+1
  d Days to weeks                      → news_trader:2, analysis_paralyser:1   | dims: process_routine:+1, emotional_control:+1
  e I don't trade gold yet             → brand_new_beginner:2

q3 "When you enter a trade, what's the actual reason?"
  a A specific setup from a system I follow       → analysis_paralyser:2, system_hopper:2   | dims: independent_conviction:+2, process_routine:+1
  b A signal someone else gave me                 → signal_dependent:3                       | dims: independent_conviction:−3
  c Multiple indicators all lining up (RSI+MACD+MAs) → indicator_stacker:3, analysis_paralyser:1 | dims: independent_conviction:−1, decisiveness:−1
  d A news event or economic release              → news_trader:3                           | dims: independent_conviction:+1
  e A feeling based on what I see                 → reckless_gambler:2, emotional_revenge_trader:1 | dims: risk_discipline:−1, process_routine:−1
  f I just want to be in a trade                  → reckless_gambler:3, emotional_revenge_trader:1 | dims: risk_discipline:−2, emotional_control:−1, process_routine:−2

q4 "How would you describe your usual position sizing?"
  a Small and consistent (same % every trade)     → analysis_paralyser:2, system_hopper:1, news_trader:1 | dims: risk_discipline:+3, process_routine:+1
  b Varies a little when I'm more confident       → emotional_revenge_trader:1, news_trader:1   | dims: risk_discipline:+1
  c Sometimes big when I'm sure                   → reckless_gambler:2, emotional_revenge_trader:1 | dims: risk_discipline:−1
  d I size up when I am losing to win it back     → emotional_revenge_trader:3, reckless_gambler:2 | dims: risk_discipline:−3, emotional_control:−2
  e No real plan                                  → reckless_gambler:2, brand_new_beginner:1, emotional_revenge_trader:1 | dims: risk_discipline:−2, process_routine:−2

q5 "Which of these hurts you most?"   ⭐ TIEBREAKER
  a Hesitating and missing trades I should have taken   → analysis_paralyser:3   | dims: decisiveness:−3
  b Chasing price after the move is already gone        → reckless_gambler:2, emotional_revenge_trader:1 | dims: decisiveness:−1, risk_discipline:−1, emotional_control:−1
  c Over-trading when there's nothing there             → reckless_gambler:2, emotional_revenge_trader:1, news_trader:1 | dims: process_routine:−1, emotional_control:−1
  d Blowing up after a losing streak                    → emotional_revenge_trader:3, reckless_gambler:1 | dims: emotional_control:−3, risk_discipline:−1
  e Switching systems before any of them get a chance to work → system_hopper:4   | dims: consistency:−3
  f Indicators contradict each other and I freeze       → indicator_stacker:3   | dims: decisiveness:−2, independent_conviction:−1
  g I haven't traded enough to know                     → brand_new_beginner:2

q6 "How do you use signals from others?"
  a I trade them blind, that's my whole approach   → signal_dependent:3   | dims: independent_conviction:−3
  b I use them as one input alongside my own analysis → news_trader:1, analysis_paralyser:1 | dims: independent_conviction:+2
  c I ignore them entirely                         → indicator_stacker:1, analysis_paralyser:1, news_trader:1 | dims: independent_conviction:+2
  d I don't follow any signal sources              → brand_new_beginner:1, indicator_stacker:1 | dims: independent_conviction:+1

q7 "After a loss, what's most typical for you?"
  a Calm — I review and move on            → analysis_paralyser:1, news_trader:1 | dims: emotional_control:+3, process_routine:+1
  b I want to win it back immediately      → emotional_revenge_trader:3, reckless_gambler:1 | dims: emotional_control:−3, risk_discipline:−1
  c I step away and come back fine later   → analysis_paralyser:1 | dims: emotional_control:+2
  d I avoid trading for days               → analysis_paralyser:2, system_hopper:1 | dims: emotional_control:−1, decisiveness:−1
  e I haven't lost meaningfully yet        → brand_new_beginner:2

q8 "Why are you trading?"   (không có scoring archetype — chỉ dimension)
  a Build a consistent income        → dims: process_routine:+1
  b Supplement what I earn elsewhere → (không có)
  c Build up for a prop firm         → analysis_paralyser:1 | dims: process_routine:+1
  d Go full-time eventually          → indicator_stacker:1, news_trader:1
  e Curious / exploring              → brand_new_beginner:2
  f Not sure yet                     → brand_new_beginner:2

q9 "Before you place a trade, how often is the plan — entry, stop, target — decided in advance?"
  a Always — it's written down before I click   → analysis_paralyser:1 | dims: process_routine:+3, risk_discipline:+2
  b Usually, at least clear in my head          → (không scoring)     | dims: process_routine:+1, risk_discipline:+1
  c Sometimes — depends on the setup            → (không scoring)     | dims: process_routine:0
  d Rarely — I decide as it unfolds             → reckless_gambler:1, emotional_revenge_trader:1 | dims: process_routine:−2, risk_discipline:−1

q10 "Do you journal your trades and review them?"
  a Every trade, reviewed regularly   → analysis_paralyser:1 | dims: process_routine:+3, consistency:+1
  b On and off                        → (không scoring)     | dims: process_routine:+1
  c I've tried but don't keep it up   → system_hopper:1     | dims: process_routine:−1, consistency:−1
  d No, I don't journal               → reckless_gambler:1, brand_new_beginner:1 | dims: process_routine:−2

q11 "You've followed a strategy for 8 trades and you're slightly down. What's your move?"
  a 8 trades tells me nothing — keep going to a real sample → analysis_paralyser:1 | dims: consistency:+3, emotional_control:+1
  b Tweak the rules and continue                            → indicator_stacker:1 | dims: consistency:0
  c Start looking for a better strategy                     → system_hopper:3     | dims: consistency:−3
  d Stop trading until I feel confident again               → analysis_paralyser:1 | dims: consistency:−1, decisiveness:−2

q12 "A setup you trade appears, but it's only about 80% textbook. What do you do?"
  a Take it — no setup is ever 100%   → news_trader:1     | dims: decisiveness:+3
  b Take it, but smaller              → (không scoring)   | dims: decisiveness:+2, risk_discipline:+1
  c Wait for more confirmation        → analysis_paralyser:2 | dims: decisiveness:−2
  d Skip it — I only take perfect setups → analysis_paralyser:3 | dims: decisiveness:−3

q13 "Gold spikes 30 pips against you seconds after you enter — your stop is not hit. What actually happens?"
  a Nothing — my stop is set and I leave it alone   → analysis_paralyser:1 | dims: risk_discipline:+3, emotional_control:+2
  b I watch it closely, ready to bail out early     → (không scoring)     | dims: emotional_control:−1, decisiveness:−1
  c I move my stop further to give it room          → emotional_revenge_trader:2, reckless_gambler:1 | dims: risk_discipline:−3, emotional_control:−1
  d I add to the position for a better average      → reckless_gambler:2, emotional_revenge_trader:1 | dims: risk_discipline:−3, emotional_control:−2

q14 "If every signal group and indicator vanished tomorrow, could you find and manage a trade on a bare XAU/USD chart?"
  a Yes, comfortably — I read structure myself   → analysis_paralyser:1 | dims: independent_conviction:+3, process_routine:+1
  b Mostly, but I'd be slower                    → (không scoring)      | dims: independent_conviction:+1
  c Not really — I lean on my tools and signals  → indicator_stacker:1, signal_dependent:1 | dims: independent_conviction:−2
  d No — I wouldn't know where to start          → signal_dependent:2, brand_new_beginner:1 | dims: independent_conviction:−3
```
</details>

---

## ⚙️ IV. Thuật Toán Chấm Điểm (Extracted từ bundle)

### Bước 1 — Xác định Archetype (client-side, thuần deterministic)
```js
// 1. TRƯỜNG HỢP ĐẶC BIỆT: mẫu "newbie" rõ ràng => thẳng kết quả
if (answers.q1 === "a" && answers.q5 === "g" && answers.q7 === "e") return "brand_new_beginner";

// 2. Counter trên 8 archetypes, khởi tạo 0
let counter = {
  reckless_gambler: 0, analysis_paralyser: 0, signal_dependent: 0,
  indicator_stacker: 0, emotional_revenge_trader: 0, news_trader: 0,
  system_hopper: 0, brand_new_beginner: 0
};

// 3. Với mỗi câu đã trả lời: cộng toàn bộ entry trong option.scoring vào counter
for (const q of QUESTIONS) {
  const sel = answers[q.id]; if (!sel) continue;
  const opt = q.options.find(o => o.id === sel);
  if (opt) for (const [arch, w] of Object.entries(opt.scoring)) counter[arch] += w;
}

// 4. Tìm archetype có counter lớn nhất
let winners = [], max = -1;
for (const [arch, s] of Object.entries(counter)) {
  if (s > max) { max = s; winners = [arch]; }
  else if (s === max) winners.push(arch);
}

// 5. TIEBREAK: nếu có >1 archetype bằng điểm, dùng scoring của option q5
//    (chọn archetype có trọng số cao nhất trong option q5 mà user đã chọn)
if (winners.length > 1) {
  const q5opt = QUESTIONS.find(q => q.id === "q5").options.find(o => o.id === answers.q5);
  if (q5opt) {
    let best = winners[0], bestW = q5opt.scoring[best] ?? 0;
    for (const arch of winners.slice(1)) {
      const w = q5opt.scoring[arch] ?? 0;
      if (w > bestW) { bestW = w; best = arch; }
    }
    return best;
  }
}
return winners[0]; // không hòa => kết quả duy nhất
```

### Bước 2 — Tính 6 Dimension Scores (0 – 100, chuẩn hóa min/max)
1. **Raw score mỗi trục** = tổng `option.dimensions[dim]` (delta +/−) của 14 câu đã chọn (option nào không có dimension → 0).
2. **Chuẩn hóa theo khoảng [min, max] cố định của từng trục**, được tính sẵn bằng cách duyệt toàn bộ option của 14 câu:
   ```
   range[dim].min += min(delta của dim qua mọi option của mỗi câu)
   range[dim].max += max(delta của dim qua mọi option của mỗi câu)
   ```
3. `score = round((raw − min) / (max − min) * 100)`, clamp 0–100.
4. Kết quả là mảng 6 trục, **sắp xếp tăng dần**, đánh dấu 2 thấp nhất (≤ 50) + 2 cao nhất (≥ 60).

### Bước 3 — Sinh Report (server-side AI)
```js
const res = await fetch("/api/generate-report", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ archetype, answers })
});
// trả về: { report_text: <markdown do AI sinh>, dimensions: { dim: 0-100, ... } }
```
- Server nhận `archetype` + `answers`, sinh **report_text dạng markdown** (report cá nhân hóa) + **dimensions**.
- Client chỉ tính archetype + dimension raw; **report_text do server/AI viết** → TheNextTrade có thể thay bằng prompt của AI Coach (xem §VII).

---

## 🖥️ V. Màn Hình Kết Quả & "Your Next Moves"

Sau khi trả lời hết 14 câu, màn hình trải qua trạng thái "analysing" với các loading text luân phiên (1600ms/cái):
> "Reading your answers…" → "Mapping your risk behaviour…" → "Cross-referencing 8 archetypes…" → "Finding your leak…" → "Writing your assessment…"

**Layout trang kết quả** (gom từ bundle):
1. **6 dimension bars** xếp tăng dần; thấp nhất hiển thị đỏ (#D9531A, ≤40) / cam (#E0892E, 41–64) / xanh (#4E9A5B, ≥65); 2 trục thấp nhất + 2 cao nhất được đánh dấu badge.
2. **Card archetype**: tên + summary + `strengths[]` + `weaknesses[]` + `common_mistakes[]` + `focus[]`.
3. **"Your next moves"**: 
   - **Keystone card** (primary, viền cam `#FF5A1F`) = `keystone.path` + `keystone.label` + `keystone.why`.
   - Danh sách **moves** (label + why + nút "→"), mỗi move trỏ vào 1 path trong map `M`:
     `/course` (MM System Course) · `/strategies` · `/library` (eBook Library) · `/live-classes` · `/daily-analysis` · `/calendar` (Economic Calendar) · `/bots/fundamental` (Fundamental Desk) · `/signals` · `/indicators` · `/news` (News & Articles).
   - `mmfx_path.cta_text` = CTA nâng cấp (free → `team_mm` → `mentorship`).
4. **Hành động chia sẻ**: nút **email-self** + (khi nhúng `?app=1`) `window.parent.postMessage({ source: "mmfx-kys", type: "send-copy-kys", ... })` để app cha nhận kết quả.

---

## 🏛️ VI. Chiến Lược Vị Trí (Trả Lời: Dashboard hay Public?)

**Kết luận từ nghiên cứu mmfx**: mmfx chọn **hoàn toàn public** — SPA độc lập không login, có `?app=1` để nhúng vào member app, không có bất kỳ lưu trữ tài khoản nào. Lý do sản phẩm chọn public:
- Quiz là **lead magnet**: người lạ trả lời được ngay (0 friction), thấy kết quả hấp dẫn → share card → kéo traffic.
- `?app=1` cho phép tái sử dụng cùng 1 component khi đã login mà không cần xây 2 luồng.
- Không cần persist vì mục tiêu là conversion, không phải lưu hồ sơ sâu.

**Khuyến nghị cho TheNextTrade — mô hình lai (public trước, dashboard sau)**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🌍 PUBLIC LEAD MAGNET (làm trước)                                        │
│ /trading-style                                                          │
│ • Không yêu cầu login                                                    │
│ • 14 câu ~ 2 phút, xem kết quả ngay                                     │
│ • Share card lên MXH + CTA "Create free account to save your path"      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ Login / đăng ký → tự động gán result
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 📱 DASHBOARD PROFILE (làm sau, tái dùng cùng component)                 │
│ /dashboard/profile · /dashboard/coach · /admin/ib/traders               │
│ • Lưu archetype + 6 dimension + report vào Prisma                       │
│ • AI Coach nhận context (archetype, điểm yếu nhất, dimension scores)    │
│ • Gợi ý Trading Rules theo style                                        │
│ • Admin/IB xem nhãn style + điểm yếu để tư vấn tài khoản                │
└─────────────────────────────────────────────────────────────────────────┘
```

Lý do **public trước**: (1) đúng mô hình mmfx đã validate; (2) không cần auth flow nên ship nhanh; (3) thu data lead magnet ngay. Dashboard chỉ là "lớp lưu trữ + cá nhân hóa" chồng lên cùng 1 quiz engine.

---

## 🗄️ VII. Database Schema (Đề xuất cho TheNextTrade)

```prisma
model TradingStyleAssessment {
  id               String   @id @default(cuid())
  userId           String?  @map("user_id") @db.Uuid
  guestSessionId   String?  @map("guest_session_id") @db.VarChar(64)

  // Kết quả chính
  archetype        String   @db.VarChar(50) // 1 trong 8 id: reckless_gambler, analysis_paralyser, ...
  archetypeTitle   String   @map("archetype_title") @db.VarChar(100) // "The Reckless Gambler"

  // 6 Dimension Scores (0 - 100, sau chuẩn hóa)
  processScore       Int  @map("process_score")
  decisivenessScore  Int  @map("decisiveness_score")
  riskScore          Int  @map("risk_score")
  emotionScore       Int  @map("emotion_score")
  consistencyScore   Int  @map("consistency_score")
  convictionScore    Int  @map("conviction_score")

  // Dữ liệu gốc + report
  answersJson      Json   @map("answers_json")      // { q1: "a", q2: "c", ... }
  reportText       String @db.Text @map("report_text") // markdown AI sinh (Bước 3)

  // 2 điểm yếu nhất (để AI Coach + IB CRM hành động nhanh, không cần parse lại)
  weakestLeaksJson Json   @map("weakest_leaks_json") // [{dim, score}] top-2 thấp nhất

  completedAt      DateTime @default(now()) @map("completed_at") @db.Timestamptz(6)
  user             User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([guestSessionId])
  @@index([archetype])
  @@map("trading_style_assessments")
}
```
> `strengths/weaknesses/common_mistakes/focus/keystone/moves` KHÔNG cần lưu — là dữ liệu tĩnh của từng archetype, đặt trong `src/config/quiz-archetypes.ts` (export từ bundle), chỉ cần lưu `archetype` để join.

---

## 🚀 VIII. Lộ Trình Triển Khai (Điều chỉnh theo spec thật)

### Giai đoạn 1: Quiz Engine (Public /trading-style)
- [ ] Chuyển bộ dữ liệu thật: `src/config/quiz-questions.ts` (14 câu + scoring + dimensions) + `src/config/quiz-archetypes.ts` (8 archetype JSON đầy đủ + moves map M).
- [ ] `src/lib/quiz/scoring.ts`: implement thuật toán §IV Bước 1 (counter → max → tiebreak q5 → special-case) + Bước 2 (chuẩn hóa dimension 0–100) — **có unit test đối chiếu với mmfx** (vd: full test-case cho 1 bộ answers cụ thể).
- [ ] `src/app/trading-style/page.tsx` + `QuizFlow.tsx` (framer-motion, Breek dark theme, rounded-xl, lucide icons).
- [ ] Trang kết quả `QuizResultReport.tsx`: dimension bars (2 thấp/2 cao nổi bật) + archetype card + Your next moves (keystone + moves).

### Giai đoạn 2: Report AI + Lead Magnet
- [ ] Server Action / route sinh `report_text` markdown (dùng prompt AI Coach sẵn có, truyền archetype + dimensions + answers).
- [ ] Share card (tải ảnh kết quả) + CTA "Create free account to save your path".
- [ ] Hỗ trợ `?app=1` + `postMessage({source:"mmfx-kys", type:"send-copy-kys"})` để nhúng sau login.

### Giai đoạn 3: Dashboard & AI Coach Hyper-Personalization
- [ ] Prisma model `TradingStyleAssessment` + Server Action lưu (guest → gán userId khi login).
- [ ] Hiển thị Trading Style + Radar/dimension bars trong `/dashboard/profile`.
- [ ] Nạp `archetype + weakestLeaks + dimensions` vào System Prompt AI Coach.
- [ ] Nhãn Trading Style trong Admin IB Trader Monitor (`/admin/ib/traders`).

---

*Tài liệu cập nhật từ nghiên cứu implementation thật của MMFX (bundle `app/page-79b98492e5c70974.js`), thay thế bản v1.0 (6 archetype + câu hỏi tự đặt). Lưu tại `docs/features/trading-style-assessment.md`.*
