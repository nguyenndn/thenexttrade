---
name: code-simplify
description: Code simplification and anti-complexity workflow based on Addy Osmani's agent skills. Refactors code to reduce cognitive load, flatten deep nesting, and prioritize clarity over cleverness while strictly preserving original behavior.
---

# /code-simplify — Clarity Over Cleverness

## Purpose
Refactors complex, convoluted, or hard-to-maintain code into clean, readable, and direct implementations without changing its runtime behavior or introducing regressions.

> **Core Philosophy:** "Make it work, make it clear, make it fast — in that exact order." Clever code is a liability; clear code is an asset.

---

## 🛑 Fundamental Principles

1. **Chesterton's Fence:**  
   Never delete or rewrite an unfamiliar logic branch, type cast, or check until you understand *why* it was put there in the first place (e.g. edge-case protection, race condition prevention).
2. **Flatten Deep Nesting (Guard Clauses):**  
   Replace nested `if/else` pyramids with early guard returns:
   ```typescript
   // ❌ Deeply nested
   if (account) {
       if (account.isActive) {
           if (!isLocked) {
               return processOrder();
           }
       }
   }
   return null;

   // ✅ Guard clauses (Flat)
   if (!account || !account.isActive || isLocked) return null;
   return processOrder();
   ```
3. **No Nested Ternaries:**  
   Ban `condition ? (sub ? a : b) : c`. Use explicit `if/else`, early return, or lookup dictionaries.
4. **The Rule of 300-500:**  
   If a component exceeds 300 lines or contains multiple distinct responsibilities, decompose it into modular subcomponents and custom hooks.
5. **Single-Axis Refactoring:**  
   Apply changes incrementally. Change one thing at a time, verify, then proceed.

---

## 🛠️ Step-by-Step Refactoring Process

### Step 1: Baseline Verification
Before touching any code:
- Run `npx tsc --noEmit` to ensure the existing code compiles cleanly.
- Verify tests (if present) to confirm the baseline behavior is green.

### Step 2: Target Complexity Smells
Scan for:
- Deeply nested control flow (more than 3 levels).
- Mammoth functions (> 40 lines doing multiple things).
- Vague variable names (`temp`, `data2`, `resObj`).
- Redundant boolean flags and complex compound conditions.
- Dead code paths, unreachable branches, and unused variables.

### Step 3: Surgical Refactoring
- Extract cohesive helper functions with descriptive, verb-based names.
- Replace complex inline calculations with self-documenting constants or utility functions.
- Simplify state management: derive values instead of syncing duplicate `useState`.

### Step 4: Verification Gate
- Run `npx tsc --noEmit` and `npm run lint`.
- Verify behavior against original requirements.

---

## 🚨 Anti-Rationalizations & Red Flags

| Excuse / Rationalization | Senior Engineer Rebuttal |
| :--- | :--- |
| *"I can make this whole file 10 lines shorter with a one-liner reduce/regex."* | **Rejected.** Shorter does not mean simpler. A reader should understand the logic in 5 seconds without mental debugging. |
| *"I don't know why this null check is here, let's remove it to clean up."* | **Violates Chesterton's Fence.** Check git history or edge cases first. |
| *"I'll refactor everything in one giant commit."* | **High Risk.** Break into atomic, verifiable changes. |
