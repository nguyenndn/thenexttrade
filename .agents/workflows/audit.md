---
description: Master Audit — gọi 1 lần, chạy tuần tự Code Review → Optimize → QA Test → Tech Lead Sign-off.
---

# Master Audit Workflow (/audit)

## Vai trò & Mục tiêu
Workflow **"Nhạc trưởng"** duy nhất — thay vì gọi lắt nhắt `/code_review`, `/optimize`, `/qa`, `/tech_lead`, User chỉ cần gọi **`/audit`** một lần. Hệ thống sẽ tự động chạy tuần tự 4 phase, tổng hợp report cuối cùng.

## Input cần từ User
- **Scope**: File/thư mục/URL cần audit
- **Nếu không chỉ định**: Tự detect từ `git diff --stat`

---

## Orchestration Flow

```
User: /audit [scope]
    │
    ▼
┌───────────────────────────┐
│ Phase 1: CODE REVIEW      │  ← Chất lượng code, DRY, security
│ (vai /code_review)        │
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Phase 2: OPTIMIZE         │  ← UI/UX, responsive, performance
│ (vai /optimize)           │
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Phase 3: QA               │  ← Test cases + Production-Ready
│ (vai /qa)                 │
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│ Phase 4: TECH LEAD SIGN   │  ← Tổng hợp + Final Verdict
│ (vai /tech_lead Phase 4-5)│
└───────────────────────────┘
```

---

## Coverage Matrix

| Concern | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---------|---------|---------|---------|---------|
| Code Quality / DRY | ✅ Primary | | | |
| Security (XSS, Auth) | ✅ Primary | | ✅ Verify | |
| UI Enforcement | ✅ Audit | ✅ Fix | ✅ Final | |
| Responsive / Mobile | | ✅ Primary | ✅ Verify | |
| Dark/Light Mode | | ✅ Primary | ✅ Verify | |
| Performance / Bundle | | ✅ Primary | ✅ Verify | |
| Test Cases / Edge | | | ✅ Primary | |
| Language (EN only) | ✅ Flag | | ✅ Enforce | |
| Static Checks (tsc/lint) | | | ✅ Run | ✅ Gate |
| Unit Tests | | | ✅ Write+Run | ✅ Gate |
| SEO / A11y | | | ✅ Primary | |
| Final Verdict | | | | ✅ Primary |

---

## Quy trình Chi Tiết

### Phase 1: Code Review (PLANNING mode)
Áp dụng toàn bộ `/code_review`:
1. Deep dive đọc code trong scope
2. DRY & Reusability (duplicate, file > 300 dòng)
3. UI Enforcement checklist
4. React/Next.js anti-patterns
5. Security review

> ⚠️ **Auto-Fix:** Medium trở xuống → fix luôn. High/Critical → ghi nhận.

### Phase 2: Optimize (EXECUTION mode)
Áp dụng toàn bộ `/optimize`:
1. Premium Aesthetics audit
2. Dark/Light mode compatibility
3. Mobile responsive (375px → 1440px)
4. Performance scan
5. Accessibility

> ⚠️ **Auto-Fix:** Responsive/dark mode rõ ràng → fix luôn. UX lớn → ghi nhận.

### Phase 3: QA (VERIFICATION mode)
Áp dụng toàn bộ `/qa` (Phase A + B):
1. Requirement analysis → test scenarios (6 nhóm)
2. Viết Automated Tests (Vitest)
3. Mental execution: trace code, edge cases
4. Static checks (tsc + lint + vitest)
5. Breek Premium UI Audit (9 checks)
6. UX, Performance, Security, SEO verification
7. Auto-Fix minor violations

### Phase 4: Tech Lead Sign-off (VERIFICATION mode)
1. Review outputs từ Phase 1-3
2. Quality Gates lần cuối
3. Tổng hợp Final Report
4. Verdict: PRODUCTION-READY / CONDITIONAL / NEEDS FIX

---

## Final Report Format

```markdown
## 🔍 Master Audit Report — [Scope/Feature Name]

### Summary
| Phase | Status | Findings |
|-------|--------|----------|
| 1. Code Review | ✅/⚠️/❌ | X critical, Y high, Z medium |
| 2. Optimize | ✅/⚠️/❌ | X items improved, Y pending |
| 3. QA | ✅/⚠️/❌ | X/Y test cases pass, 9/9 UI checks |
| 4. Tech Lead | ✅/⚠️/❌ | Quality gates result |

### Auto-Fixed
| # | File | Issue | Fix Applied |
|---|------|-------|-------------|

### Needs User Decision
| # | Severity | File | Issue | Options |
|---|----------|------|-------|---------|

### Quality Gates
- [ ] TypeScript: `npx tsc --noEmit`
- [ ] Lint: `npm run lint`
- [ ] Unit Tests: `npx vitest run`
- [ ] Breek Premium UI: 9/9
- [ ] Mobile / Dark Mode / SEO / Security / Console

### Verdict: ✅ PRODUCTION-READY / ⚠️ CONDITIONAL / ❌ NEEDS FIX
```

---

## Rules
1. **Không hỏi User giữa chừng** — chạy hết 4 phases rồi báo cáo 1 lần
2. **Auto-fix lỗi nhỏ** — Medium/Low fix luôn
3. **Ghi nhận lỗi lớn** — Critical/High để User quyết định
4. **Scope detection** — Không chỉ scope → dùng `git diff --stat`
5. **Không pass Phase nếu có Critical blocker** — báo sớm
6. **Deduplicate** — Không report cùng issue 2 lần

## Workflow tiếp theo
→ `/push_code` (nếu PRODUCTION-READY)
→ `/super_dev` (nếu cần fix Critical)
