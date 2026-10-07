import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

const root = process.cwd()
const dashboardSource = readFileSync(join(root, 'src/pages/Dashboard/index.tsx'), 'utf8')
const routerSource = readFileSync(join(root, 'src/router/index.ts'), 'utf8')
const canvasWorkbenchSource = readFileSync(
  join(root, 'src/components/workbench/CanvasWorkbench.tsx'),
  'utf8'
)
const canvasRightPanelSource = readFileSync(
  join(root, 'src/components/workbench/CanvasRightPanel.tsx'),
  'utf8'
)
const canvasSideInfoSource = readFileSync(
  join(root, 'src/components/workbench/CanvasSideInfo.tsx'),
  'utf8'
)
const runContextBarSource = readFileSync(join(root, 'src/components/workbench/RunContextBar.tsx'), 'utf8')
const projectContextBarSource = readFileSync(
  join(root, 'src/components/project/ProjectContextBar.tsx'),
  'utf8'
)
const projectSessionSource = readFileSync(join(root, 'src/hooks/useProjectSession.ts'), 'utf8')
const canvasWorkspaceSource = readFileSync(
  join(root, 'src/components/canvas/CanvasWorkspace.tsx'),
  'utf8'
)
const materialPageSource = readFileSync(join(root, 'src/pages/MaterialCalculation/index.tsx'), 'utf8')
const optimizationPageSource = readFileSync(join(root, 'src/pages/MultiLoadOptimization/index.tsx'), 'utf8')
const stylesSource = readFileSync(join(root, 'src/styles.css'), 'utf8')

const requiredFiles = [
  'src/components/workbench/CanvasWorkbench.tsx',
  'src/components/workbench/RunContextBar.tsx',
  'src/components/workbench/CanvasRightPanel.tsx',
  'src/components/workbench/CanvasSideInfo.tsx',
  'src/components/project/ProjectContextBar.tsx',
  'src/hooks/useProjectSession.ts',
  'src/pages/MaterialCalculation/index.tsx',
  'src/pages/MultiLoadOptimization/index.tsx'
]

requiredFiles.forEach((file) => {
  assert(existsSync(join(root, file)), `missing workbench module: ${file}`)
})

assert(
  dashboardSource.includes("key: 'event-material-calculation'"),
  'event sidebar should expose material calculation and prediction'
)
assert(
  dashboardSource.includes("key: 'event-multi-load-optimization'"),
  'event sidebar should expose multi-load optimization'
)
assert(!dashboardSource.includes("key: 'event-input-output'"), 'legacy input-to-output menu item should be removed')
assert(!dashboardSource.includes("key: 'event-output-input'"), 'legacy output-to-input menu item should be removed')
assert(!dashboardSource.includes("key: 'event-solve'"), 'legacy standalone solve menu item should be removed')
assert(!dashboardSource.includes("key: 'event-reset'"), 'legacy standalone reset menu item should be removed')
assert(
  routerSource.includes("materialCalculation: '/event/material-calculation'"),
  'material calculation workspace route should be defined'
)
assert(
  routerSource.includes("multiLoadOptimization: '/event/multi-load-optimization'"),
  'multi-load optimization workspace route should be defined'
)
assert(dashboardSource.includes('<CanvasWorkbench'), 'dashboard should render the shared canvas workbench')
assert(
  dashboardSource.includes('<ProjectContextBar') &&
    !dashboardSource.includes('title="工程画布"'),
  'dashboard should delegate project context rendering to ProjectContextBar'
)
assert(
  projectContextBarSource.includes('<RunContextBar') &&
    projectContextBarSource.includes('projectStatusConfig') &&
    projectContextBarSource.includes('当前工程') &&
    projectContextBarSource.includes('工程状态'),
  'project context bar should compose the shared context bar with project-specific fields'
)
assert(
  projectSessionSource.includes('useReducer') &&
    projectSessionSource.includes("type: 'changed'") &&
    projectSessionSource.includes("type: 'loaded'") &&
    projectSessionSource.includes("type: 'saved'") &&
    projectSessionSource.includes("type: 'cleared'"),
  'project session hook should own the project lifecycle state transitions'
)
assert(
  canvasWorkspaceSource.includes('onProjectChanged?: () => void') &&
    canvasWorkspaceSource.includes('onProjectOpened?: (project: NpimsProjectFile) => void'),
  'canvas workspace should report edits and library project loads without owning project session state'
)
assert(
  canvasRightPanelSource.includes('canvas-right-panel--collapsed') &&
    canvasRightPanelSource.includes('aria-expanded'),
  'the auxiliary right panel should provide an accessible collapsed state'
)
assert(
  canvasSideInfoSource.includes('<Collapse') &&
    canvasSideInfoSource.includes("defaultActiveKey={['context', 'canvas']}"),
  'workspace context and canvas information should be independently collapsible and expanded by default'
)
assert(
  !canvasSideInfoSource.includes("key: 'result'") &&
    canvasSideInfoSource.includes('CalculatorOutlined') &&
    canvasSideInfoSource.includes('side-info__inline-result') &&
    canvasSideInfoSource.includes('side-info__result-list') &&
    !canvasSideInfoSource.includes('<Statistic') &&
    canvasSideInfoSource.includes('resultRows'),
  'material calculation results should render as rows inside the material context section'
)
assert(
  dashboardSource.includes('outputToInputResult: OutputToInputResult | null') &&
    dashboardSource.includes('materialResultRows') &&
    dashboardSource.includes("? '测算结果' : undefined"),
  'dashboard should map both material calculation modes into right-panel result rows'
)
assert(
  dashboardSource.includes("? '多负荷优化'") &&
    dashboardSource.includes(": '物料测算与预测'"),
  'workspace context title should match the active event workspace'
)
assert(
  canvasWorkbenchSource.includes('canvas-workbench__surface'),
  'the context bar and canvas should share one work-surface frame'
)
assert(
  runContextBarSource.includes('headingExtra?: ReactNode'),
  'run context bar should support first-row business controls'
)
assert(
  runContextBarSource.includes('run-context-bar__controls'),
  'run context bar should expose a separate second-row controls area'
)
assert(materialPageSource.includes('headingExtra={'), 'material mode selector should render beside the title')
assert(
  materialPageSource.includes('<Tag') && !materialPageSource.includes('<Badge'),
  'material parameter status should use the Ant Design Tag component'
)
assert(
  !optimizationPageSource.includes('headingExtra={') &&
    optimizationPageSource.includes('run-context-field run-context-field--status'),
  'optimization plan status should render with the second-row context fields'
)
assert(
  optimizationPageSource.includes('<Tag') && !optimizationPageSource.includes('<Badge'),
  'optimization plan status should use the Ant Design Tag component'
)
assert(
  materialPageSource.includes('run-context-field__label') &&
    materialPageSource.includes('当前画布') &&
    materialPageSource.includes('参数状态'),
  'material context controls should use labelled fields'
)
assert(
  optimizationPageSource.includes('run-context-field__label') &&
    optimizationPageSource.includes('当前画布') &&
    optimizationPageSource.includes('历史方案') &&
    optimizationPageSource.includes('计算日期'),
  'optimization context controls should use labelled fields'
)
assert(stylesSource.includes('.run-context-fields'), 'run context bar should style grouped context fields')
assert(stylesSource.includes('min-height: 124px'), 'run context bar should provide a taller two-row layout')
assert(
  /\.run-context-fields\s*\{[^}]*align-items:\s*flex-start;/.test(stylesSource),
  'run context field labels should share the same top alignment'
)
assert(
  /\.run-context-status-tag\.ant-tag\s*\{[^}]*(?:\r?\n)\s*height:\s*38px;[^}]*box-sizing:\s*border-box;/.test(
    stylesSource
  ),
  'run status tags should use the same fixed control height as the other context controls'
)
assert(
  stylesSource.includes('.run-context-bar .ant-segmented-item-selected'),
  'the active calculation mode should have a deliberate selected state'
)
assert(
  stylesSource.includes('.canvas-workbench__canvas > .legacy-canvas-shell'),
  'the canvas should be visually framed as a work surface'
)
assert(
  stylesSource.includes('.canvas-right-panel--collapsed') &&
    stylesSource.includes('.canvas-right-panel__content'),
  'the right panel should have expanded and collapsed visual states'
)

console.log('event workbench structure verified')
