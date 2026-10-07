import { readFileSync } from 'fs'
import { join } from 'path'
import assert from 'assert'

const root = process.cwd()
const source = readFileSync(join(root, 'src/components/charts/ScheduleTrendChart.tsx'), 'utf8')
const dashboardSource = readFileSync(join(root, 'src/pages/Dashboard/index.tsx'), 'utf8')

assert(source.includes('showSymbol: false'), 'trend chart should hide ordinary nodes by default')
assert(source.includes('symbolSize: 4'), 'trend chart should keep ordinary nodes small when shown')
assert(source.includes("symbolSize: 11"), 'trend chart should use a stronger selected node')
assert(source.includes("shadowBlur: 16"), 'selected trend node should have a softer glow')
assert(source.includes("rgba(47,115,217,0.12)"), 'trend area gradient should start lighter')
assert(source.includes("rgba(47,115,217,0)"), 'trend area gradient should fade to transparent')
assert(source.includes("class=\"schedule-trend-tooltip-card\""), 'trend tooltip should render as a card')
assert(source.includes("extraCssText"), 'trend tooltip should use elevated card CSS')
assert(source.includes("style={{ height: 300, width: '100%' }}"), 'trend chart should use a lower container height')
assert(dashboardSource.includes('schedule-trend-summary-grid'), 'trend page should render a metric summary grid')
assert(dashboardSource.includes('hoverable'), 'trend summary cards should be hoverable')

console.log('schedule trend visual styles verified')
