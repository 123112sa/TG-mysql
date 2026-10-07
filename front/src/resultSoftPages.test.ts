import { readFileSync } from 'fs'
import { join } from 'path'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

const root = process.cwd()
const dashboardSource = readFileSync(join(root, 'src/pages/Dashboard/index.tsx'), 'utf8')
const monitorOverviewSource = readFileSync(join(root, 'src/components/charts/ScheduleMonitorOverview.tsx'), 'utf8')
const stylesSource = readFileSync(join(root, 'src/styles.css'), 'utf8')

assert(
  dashboardSource.includes('result-page result-page--monitor-soft'),
  'monitor page should opt into local soft styling'
)
assert(
  dashboardSource.includes('result-page result-page--trend-soft'),
  'trend page should opt into local soft styling'
)
assert(
  stylesSource.includes('.result-page--monitor-soft .result-chart-card'),
  'monitor soft styles should be scoped to monitor page'
)
assert(
  stylesSource.includes('.result-page--trend-soft .result-chart-card'),
  'trend soft styles should be scoped to trend page'
)
assert(stylesSource.includes('border-radius: 14px'), 'soft pages should use rounder cards')
assert(stylesSource.includes('rgba(40, 90, 140, 0.06)'), 'soft pages should use a lighter shadow')
assert(monitorOverviewSource.includes("import { Card, Progress } from 'antd'"), 'monitor overview should use antd Card')
assert(
  dashboardSource.includes("import ScheduleMonitorOverview from '../../components/charts/ScheduleMonitorOverview'"),
  'dashboard should render the shared monitor overview component'
)
assert(
  dashboardSource.includes('<Card className="result-workspace__header" size="small">'),
  'result page headers should use antd Card without hoverable'
)
assert(
  !dashboardSource.includes('<div className="result-workspace__header">'),
  'old plain div result page header should be removed'
)
assert(
  (monitorOverviewSource.match(/<Card/g) || []).length === 5,
  'monitor overview should render five antd cards'
)
assert(
  (monitorOverviewSource.match(/hoverable/g) || []).length === 5,
  'monitor overview cards should be hoverable'
)
assert(
  stylesSource.includes('.schedule-monitor-card .ant-card-body'),
  'monitor cards should style antd card body'
)
assert(
  !stylesSource.includes('min-height: 96px'),
  'old plain-div monitor card patch should be removed'
)
assert(
  !stylesSource.includes('TG2.0 soft visual theme overrides'),
  'soft page styling must not reintroduce global theme overrides'
)

console.log('result soft page styling verified')
