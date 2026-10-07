# Test Outline Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a revised DOCX test outline that preserves the existing formal document format, reflects current implemented functions, and uses only task-book section 1.2.1 and corresponding section 1.3 (1) as acceptance boundaries.

**Architecture:** Convert the legacy DOC reference to a working DOCX without changing the source, distill its layout and style contract, then build the revised document from that reference. Content is organized into five traceable test projects; implemented auxiliary functions appear in procedures and evidence, while unimplemented task requirements remain explicit preconditions and mandatory tests.

**Tech Stack:** Microsoft Word automation for legacy conversion and field refresh, bundled Python 3 with `python-docx`, packaged document audit and render helpers, Word/PDF page rendering fallback when packaged LibreOffice is unavailable.

## Global Constraints

- Acceptance scope is limited to task-book section 1.2.1 and corresponding section 1.3 (1).
- Section 1.2.6 and section 1.3 (6) requirements must not appear as test requirements.
- DCS/MES ingestion and mode-search, CoDE, and PSO selection remain mandatory task tests even though current implementation evidence was not found.
- Production prediction is an optional test and cannot affect the mandatory pass conclusion.
- Existing features may be used as test procedures or evidence only when they support an in-scope requirement.
- The two source documents remain unchanged.
- The final result is one DOCX file with blank result fields and no pre-filled pass conclusion.

---

### Task 1: Prepare and distill the retained document format

**Files:**
- Read: `C:\Users\XUCHEN\Desktop\TG相关\制造过程操作优化系统-测试大纲8.11.doc`
- Create: `D:\TG\.artifact_work\test-outline\reference.docx`
- Create: `D:\TG\.artifact_work\test-outline\artifact.md`
- Create: `D:\TG\.artifact_work\test-outline\reference-render\page-*.png`

**Interfaces:**
- Consumes: the legacy test-outline source and the bundled document runtime.
- Produces: a byte-identified DOCX reference and a complete layout/style contract for authoring.

- [ ] **Step 1: Convert the legacy DOC into a separate DOCX reference**

Open the source read-only in Microsoft Word and save a new DOCX to the task work directory. Record the source and converted file hashes and never overwrite the original DOC.

- [ ] **Step 2: Render and inspect every reference page**

Attempt the packaged `render_docx.py` workflow first. If bundled LibreOffice is unavailable, export the converted reference to PDF with Microsoft Word and rasterize every page with the bundled Python imaging/PDF libraries. Inspect all pages for the cover, signature page, table of contents, heading hierarchy, tables, page numbering, and section breaks.

- [ ] **Step 3: Audit the reference structure and styles**

Run `section_audit.py` and `style_lint.py`; inspect styles, numbering, section properties, header/footer parts, and tables. Record exact page geometry, margins, paragraph roles, fonts, spacing, table widths, borders, repeated elements, and editable slots in `artifact.md`.

- [ ] **Step 4: Verify the distillation contract**

Confirm that `artifact.md` accounts for every distinct page pattern and that the original DOC remains unchanged.

### Task 2: Build the requirements and feature traceability content

**Files:**
- Read: `C:\Users\XUCHEN\Desktop\TG相关\更新和解释-2026年模块1和6的任务-曹跃负责.docx`
- Read: `D:\TG\docs\superpowers\specs\2026-09-14-test-outline-revision-design.md`
- Read: relevant current implementation files under `D:\TG\front`, `D:\TG\back`, and `D:\TG\optimize`
- Create: `D:\TG\.artifact_work\test-outline\content-outline.md`

**Interfaces:**
- Consumes: task-book wording, approved design, and verified implementation inventory.
- Produces: final source text for all document sections and tables.

- [ ] **Step 1: Create the mandatory requirement map**

Map data acquisition, historical process variables, reverse optimization, constrained solving, optimal load/material allocation, reporting/query, monitoring/prediction, and production decision to task-book section 1.2.1 or section 1.3 (1).

- [ ] **Step 2: Classify implemented functions**

Classify each current function as a mandatory acceptance function, supporting test mechanism, optional function, or out-of-scope function. Keep parameter templates, routes, history, constraint preview, result validation, custom reports, trends, and canvas result display in supporting roles where appropriate.

- [ ] **Step 3: Draft five test projects**

Write complete content for:

1. Data ingestion and model input preparation
2. Material calculation and reverse calculation
3. Multi-load optimization and production decision
4. Optimization result analysis and monitoring prediction
5. Report generation and query

Each project must contain test time, location, system state, equipment, methods and steps, and direct pass criteria. Procedures must use controlled scenarios, independent recomputation, constraint verification, and cross-module data reconciliation.

- [ ] **Step 4: Draft the result assessment and retained administrative sections**

Prepare a blank result table and retain the source confidentiality/safety section as an administrative testing measure, without turning it into a product requirement.

- [ ] **Step 5: Run scope and placeholder checks**

Search the drafted content for section 1.2.6 concepts, unsupported numerical thresholds, pre-filled results, vague placeholders, and click-only test wording. Correct every occurrence before authoring.

### Task 3: Author the revised DOCX from the retained format

**Files:**
- Read: `D:\TG\.artifact_work\test-outline\reference.docx`
- Read: `D:\TG\.artifact_work\test-outline\artifact.md`
- Read: `D:\TG\.artifact_work\test-outline\content-outline.md`
- Create: `D:\TG\质量一致性下的多负荷优化管控系统-测试大纲-修订版.docx`
- Create: `D:\TG\.artifact_work\test-outline\build_test_outline.py`

**Interfaces:**
- Consumes: the retained DOCX format and approved content.
- Produces: one revised formal test-outline DOCX.

- [ ] **Step 1: Mark the artifact edit operation**

Run the packaged marker exactly once with operation kind `edit`, expected output count `1`, and output format `docx` immediately before the first authoring command.

- [ ] **Step 2: Create a working copy and replace intended slots**

Start from `reference.docx`, preserve the page system and styles, update the title consistently, retain the cover metadata and signature page, and replace the table of contents and body with the revised content. Reuse the reference heading, body, and table styles; do not overwrite the source DOC or the converted reference.

- [ ] **Step 3: Build the test project and assessment tables**

Use intentional column widths, visible light-gray borders, readable padding, vertically centered cells, repeated headers when a table spans pages, and blank test-result cells.

- [ ] **Step 4: Add and refresh navigation fields**

Insert or preserve page numbering and a Word table-of-contents field. Refresh fields using Microsoft Word when available; otherwise set `w:updateFields` so Word refreshes them on open.

- [ ] **Step 5: Run structural checks**

Confirm that the final package contains expected styles, numbering, sections, headers/footers, fields, and tables, and contains no internal citation tokens or authoring notes.

### Task 4: Render, inspect, and revise the final DOCX

**Files:**
- Read: `D:\TG\质量一致性下的多负荷优化管控系统-测试大纲-修订版.docx`
- Create: `D:\TG\.artifact_work\test-outline\final-render-<iteration>\page-*.png`

**Interfaces:**
- Consumes: the authored DOCX.
- Produces: a visually verified final DOCX with all defects corrected.

- [ ] **Step 1: Render every final page**

Run the packaged renderer first. If it cannot run because bundled LibreOffice is unavailable, export with Word and rasterize with the bundled Python runtime. Use a new render directory for each iteration.

- [ ] **Step 2: Inspect every page at full resolution**

Check the cover, signature page, table of contents, all test-project headings, long tables, page breaks, headers, footers, page numbers, and Chinese glyphs. Reject clipping, overlap, awkward table splitting, broken borders, missing text, and stale fields.

- [ ] **Step 3: Correct defects and rerender**

Update only the intended output DOCX, rerun structural checks, and render to a new iteration directory until every page is clean.

- [ ] **Step 4: Verify content scope and delivery state**

Extract the final DOCX text and confirm the five approved test projects, mandatory DCS/MES and algorithm tests, optional production-prediction label, blank result cells, and absence of module 1.2.6 requirements. Confirm the final file exists and is non-empty.

- [ ] **Step 5: Deliver the final DOCX**

Return only `D:\TG\质量一致性下的多负荷优化管控系统-测试大纲-修订版.docx` as the document deliverable; keep render images and work files internal.
