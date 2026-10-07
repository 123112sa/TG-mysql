# Result Responsive Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make result pages resize reliably across viewport sizes and expose one clear vertical scrollbar.

**Architecture:** The dashboard layout owns the viewport height through a flex height chain. `result-workspace` is the only vertical scrolling container, while Ant Design tables keep horizontal overflow only. Responsive breakpoints reflow the plan toolbar and summary cards without changing business behavior.

**Tech Stack:** React 18, TypeScript, Ant Design 6, CSS, Node assertion tests

## Global Constraints

- Modify only `D:\TG\TG\TG\TG更新`.
- Preserve all result data and navigation behavior.
- Keep one vertical scroll owner on result pages.
- Do not add dependencies.

---

### Task 1: Lock Responsive Scrolling Behavior

**Files:**
- Modify: `front/src/resultViewportLayout.test.ts`

- [ ] Add assertions for dynamic viewport sizing, one vertical scroll owner, visible scrollbar styling, responsive toolbar reflow, and removal of the table's fixed vertical scroll.
- [ ] Run `npx ts-node src/resultViewportLayout.test.ts` and verify it fails before implementation.

### Task 2: Implement the Single Scroll Container

**Files:**
- Modify: `front/src/pages/Dashboard/index.tsx`
- Modify: `front/src/styles.css`

- [ ] Remove `y: 520` from the daily optimization table while retaining horizontal table scrolling.
- [ ] Replace fixed viewport calculations with a `100dvh` dashboard height and a complete `min-height: 0` flex chain.
- [ ] Consolidate result scrolling into `.result-workspace` and remove the redundant scoped scroll block.
- [ ] Add visible cross-browser scrollbar styling.
- [ ] Add responsive toolbar, summary card, and detail grid rules.

### Task 3: Verify

**Files:**
- Test: `front/src/resultViewportLayout.test.ts`
- Test: existing result and routing tests

- [ ] Run the focused viewport test.
- [ ] Run all existing result-related tests.
- [ ] Run `npm run build`.
- [ ] Start Vite and verify desktop and narrow viewport layouts when browser tooling is available.
