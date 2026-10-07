import assert from 'assert'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
const dashboardSource = readFileSync(join(root, 'src/pages/Dashboard/index.tsx'), 'utf8')
const reportsApiSource = readFileSync(join(root, 'src/api/reports.ts'), 'utf8')
const scheduleApiSource = readFileSync(join(root, 'src/api/schedule.ts'), 'utf8')
const constraintModalSource = readFileSync(
  join(root, 'src/components/modals/ConstraintPreviewModal.tsx'),
  'utf8'
)
const validationModalPath = join(root, 'src/components/modals/ScheduleResultValidationModal.tsx')

assert(
  reportsApiSource.includes('/api/reports/schedule/fields') &&
    reportsApiSource.includes('/custom'),
  'report API should support field discovery and custom downloads'
)
assert(
  scheduleApiSource.includes('/api/schedule/constraint-fields') &&
    scheduleApiSource.includes('/api/schedule/constraint-preview'),
  'schedule API should support constraint field discovery and preview runs'
)
assert(
  scheduleApiSource.includes('/api/schedule/plans/') &&
    scheduleApiSource.includes('/validation') &&
    scheduleApiSource.includes('validateScheduleResultApi'),
  'schedule API should support saved result validation'
)
assert(
  existsSync(join(root, 'src/components/modals/ScheduleReportModal.tsx')),
  'the report generator should be an isolated modal component'
)
assert(
  existsSync(join(root, 'src/components/modals/ConstraintPreviewModal.tsx')),
  'the constraint preview should be an isolated modal component'
)
assert(
  existsSync(validationModalPath),
  'the schedule result validation view should be an isolated modal component'
)
assert(
  constraintModalSource.includes('filterConstraintFieldsForRoute') &&
    constraintModalSource.includes('schedule?.plan.route'),
  'constraint fields should be filtered for the selected process route before submission'
)
assert(
  dashboardSource.includes('<ScheduleReportModal') &&
    dashboardSource.includes('<ConstraintPreviewModal') &&
    dashboardSource.includes('约束试运行'),
  'Dashboard should expose both migrated workflows without replacing its current layout'
)

assert(
  dashboardSource.includes('<ScheduleResultValidationModal') &&
    dashboardSource.includes('结果校验') &&
    dashboardSource.indexOf('结果校验') < dashboardSource.indexOf('打开对应画布'),
  'Dashboard should expose result validation before the canvas action on the daily result page'
)

console.log('schedule extensions structure verified')
