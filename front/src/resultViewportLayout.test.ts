import { readFileSync } from 'fs'
import { join } from 'path'
import assert from 'assert'

const root = process.cwd()
const dashboardSource = readFileSync(join(root, 'src/pages/Dashboard/index.tsx'), 'utf8')
const stylesSource = readFileSync(join(root, 'src/styles.css'), 'utf8')

assert(
  dashboardSource.includes("activeTopMenu === 'result' ? ' dashboard-main--result' : ''"),
  'result routes should opt into a viewport-bound content container'
)
assert(
  stylesSource.includes('.dashboard-main--result'),
  'result pages should have a scoped content layout'
)
assert(
  stylesSource.includes('height: 100dvh;'),
  'the dashboard should follow the dynamic browser viewport height'
)
assert(
  stylesSource.includes('.result-workspace::-webkit-scrollbar-thumb'),
  'the main result scrollbar should remain visually discoverable'
)
assert(
  stylesSource.includes('overflow-y: auto;'),
  'overflowing result content should remain reachable through vertical scrolling'
)
assert(
  stylesSource.includes('scrollbar-gutter: stable;'),
  'result scrolling should not shift the layout when the scrollbar appears'
)
assert(
  !dashboardSource.includes("window.addEventListener('resize', handleViewportResize)"),
  'resizing the viewport should preserve the current reading position instead of forcing the result workspace back to the top'
)
assert(
  dashboardSource.includes('breakpoint="lg"') &&
    dashboardSource.includes('collapsedWidth={64}') &&
    dashboardSource.includes('onCollapse={setSiderCollapsed}'),
  'the Ant Design sider should collapse responsively on narrow viewports'
)
assert(
  stylesSource.includes('@media (max-width: 1440px)') &&
    stylesSource.includes('.result-plan-bar__actions'),
  'result controls and summary content should reflow on laptop-sized viewports'
)
assert(
  stylesSource.includes('@media (max-width: 992px)') &&
    stylesSource.includes('.schedule-monitor-overview') &&
    stylesSource.includes('.schedule-trend-summary-grid'),
  'result summaries should use responsive grid breakpoints instead of being clipped'
)
assert(
  dashboardSource.includes('scroll={{ x: 1320 }}'),
  'the daily table should retain horizontal overflow for its wide columns'
)
assert(
  stylesSource.includes('.result-table-card .ant-table-content::-webkit-scrollbar'),
  'the daily table horizontal scrollbar should remain visually discoverable'
)
assert(
  !dashboardSource.includes('scroll={{ x: 1320, y: 520 }}'),
  'the daily table should not create a second vertical scrolling container'
)

console.log('result viewport layout verified')
