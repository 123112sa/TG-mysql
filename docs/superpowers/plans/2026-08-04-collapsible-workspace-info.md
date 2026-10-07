# Collapsible Workspace Information Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the context information and canvas information in the right workspace panel independently collapsible, with a context title that matches the active event workspace.

**Architecture:** Keep the outer `CanvasRightPanel` collapse behavior unchanged. Refactor `CanvasSideInfo` to render two independent Ant Design `Collapse` items and keep the active workspace title supplied by `Dashboard`.

**Tech Stack:** React, TypeScript, Ant Design Collapse, CSS.

## Global Constraints

- Only modify the `TG更新` system.
- Both information sections are expanded by default and can be toggled independently.
- Preserve the existing palette view and outer right-panel collapse behavior.

---

### Task 1: Collapsible workspace information

**Files:**
- Modify: `front/src/eventWorkbenchStructure.test.ts`
- Modify: `front/src/components/workbench/CanvasSideInfo.tsx`
- Modify: `front/src/pages/Dashboard/index.tsx`
- Modify: `front/src/styles.css`

**Interfaces:**
- Consumes: `CanvasSideInfoProps.contextTitle`, `contextRows`, and `liveStats`.
- Produces: independent `context` and `canvas` collapse items.

- [ ] **Step 1: Write the failing structure test**

Require `CanvasSideInfo` to use Ant Design `Collapse`, default both item keys to expanded, and require Dashboard to supply the full workspace names.

- [ ] **Step 2: Run the structure test and verify it fails**

Run: `npx ts-node src/eventWorkbenchStructure.test.ts`

Expected: FAIL because the side information still uses static section containers.

- [ ] **Step 3: Implement the minimal component change**

Render `context` and `canvas` as independent `Collapse` items, preserve the existing data rows, and update `workbenchContextTitle` to `物料测算与预测` or `多负荷优化`.

- [ ] **Step 4: Add scoped visual styles**

Style only `.side-info__collapse` and its Ant Design item/header/content descendants so the existing right-panel frame remains unchanged.

- [ ] **Step 5: Verify**

Run the structure test, `git diff --check`, and `npm run build`.

