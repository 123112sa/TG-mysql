# Integrated Canvas Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present the run context, canvas, and status area as one continuous workbench and allow the auxiliary right panel to collapse.

**Architecture:** Keep business pages unchanged. `CanvasWorkbench` owns the shared work-surface structure, while `CanvasRightPanel` owns its local expanded state and accessible toggle. Shared CSS controls the unified frame, responsive behavior, and restrained industrial styling.

**Tech Stack:** React, TypeScript, Ant Design, CSS

## Global Constraints

- Modify only `D:/TG/TG/TG/TG更新`.
- Preserve all calculation, canvas, routing, and data-loading behavior.
- Use a maximum 8px radius and restrained shadows.
- Keep the left navigation unchanged.

---

### Task 1: Collapsible Right Panel

**Files:**
- Modify: `front/src/components/workbench/CanvasRightPanel.tsx`
- Test: `front/src/eventWorkbenchStructure.test.ts`

- [ ] Add a failing source-level contract for the collapse state and accessible toggle.
- [ ] Run the workbench structure test and confirm the missing behavior fails.
- [ ] Add local collapse state, tooltip, toggle button, and preserved panel content.
- [ ] Re-run the workbench structure test and confirm it passes.

### Task 2: Unified Work Surface

**Files:**
- Modify: `front/src/components/workbench/CanvasWorkbench.tsx`
- Modify: `front/src/styles.css`
- Test: `front/src/eventWorkbenchStructure.test.ts`

- [ ] Add failing contracts for the unified work-surface and collapsed panel styles.
- [ ] Run the workbench structure test and confirm the missing styles fail.
- [ ] Replace the nested card treatment with one shared frame and style the right panel as a collapsible auxiliary surface.
- [ ] Re-run structure and route tests.
- [ ] Run `git diff --check` and `npm run build`.
