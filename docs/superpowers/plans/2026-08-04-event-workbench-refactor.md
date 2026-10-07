# Event Workbench Structural Refactor

**Goal:** Split the event canvas area into a shared workbench shell with material-calculation and multi-load-optimization page configurations, while preserving the existing canvas engine and calculation APIs.

## Scope

1. Keep `CanvasWorkspace` as the single canvas engine.
2. Add reusable workbench components for the context bar, canvas body, and right panel.
3. Add page-level context components for material calculation and multi-load optimization.
4. Reduce the Event sidebar to three entries: event customization, material calculation and prediction, and multi-load optimization.
5. Add distinct event workspace routes while keeping `/event` compatible.
6. Reuse existing modal, solve, plan, result, and reset handlers.

## Verification

- Run the event workbench source-structure test.
- Run the router test.
- Run the existing result-page tests.
- Run the production build.
