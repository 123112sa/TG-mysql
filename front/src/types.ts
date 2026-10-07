import type { NpimsProjectFile } from './utils/npimsProject'

export type LoginFormState = {
  username: string
  password: string
}

export type RegisterFormState = {
  username: string
  password: string
  confirmPassword: string
}

export type ScheduleInput = {
  jb: number
  mxx: number
  ldx: number
  ylsn: number
}

export type SolveMode = 'input-to-output' | 'output-to-input'

export type Xh2Route = 'MXX' | 'LDX'

export type OutputTargetInput = {
  productName: string
  amount: number
  unit: string
}

export type MaterialTarget = {
  productCode: string
  productName: string
  amount: number
}

export type MaterialParameterDraft = {
  mode: SolveMode
  route: Xh2Route
  inputs?: ScheduleInput
  target?: MaterialTarget
}

export type MaterialParameterConfiguration = MaterialParameterDraft & {
  version: number
  updatedAt: string
}

export type MaterialParameterTemplate = MaterialParameterDraft & {
  id: number
  name: string
  description: string
  version: number
  createdAt: string
  updatedAt: string
}

export type MaterialParameterTemplateInput = MaterialParameterDraft & {
  name: string
  description: string
  version?: number
}

export type PlanScheduleInput = {
  planName: string
  startDate: string
  planningDays: number
  targetAmount: number
  route: Xh2Route
}

export type SchedulePlan = {
  id?: number | string
  planName?: string
  startDate: string
  endDate: string
  planningDays: number
  targetAmount: number
  route: Xh2Route
  status?: string
  remark?: string
  createdAt?: string
}

export type DailyScheduleResult = {
  date: string
  dayIndex: number
  dayName: string
  jb: number
  mxx: number
  ldx: number
  dnx: number
  sa: number
  fsa: number
  ylsn: number
  nx: number
  product: number
  mxxflc: number
  x2_2d: number
  cztg: number
  txxhcc: number
  yttg: number
  tg: number
}

export type ScheduleReportMode = 'full' | 'custom'

export type ScheduleReportField = {
  key: keyof DailyScheduleResult | string
  label: string
  unit?: string
}

export type ScheduleOptimizeResult = {
  plan: SchedulePlan
  dailyResults: DailyScheduleResult[]
  project?: NpimsProjectFile
  projectsByDate?: Record<string, NpimsProjectFile>
  report?: {
    fileName: string
    downloadUrl: string
  }
}

export type ScheduleConstraintOperator = 'min' | 'max' | 'fixed'

export type ScheduleConstraintField = {
  key: keyof DailyScheduleResult | string
  label: string
  unit?: string
  group?: string
}

export type ScheduleConstraintRule = {
  field: keyof DailyScheduleResult | string
  operator: ScheduleConstraintOperator
  value: number
}

export type ScheduleConstraintPreviewInput = PlanScheduleInput & {
  rules: ScheduleConstraintRule[]
}

export type ScheduleConstraintComparison = {
  field: string
  key?: string
  label: string
  group?: string
  unit?: string
  before: number
  after: number | null
  delta: number | null
  deltaPercent?: number | null
}

export type ScheduleConstraintPreviewChecks = {
  feasible: boolean
  targetSatisfied: boolean
  constraintsEffective: boolean
  messages: string[]
}

export type ScheduleConstraintPreviewResult = {
  baseline: ScheduleOptimizeResult
  trial: ScheduleOptimizeResult | null
  rules: ScheduleConstraintRule[]
  comparison: ScheduleConstraintComparison[]
  checks: ScheduleConstraintPreviewChecks
}

export type ScheduleResultValidationRow = {
  date: string
  dayIndex: number | string
  constraintKey: string
  constraintName: string
  field: string
  fieldLabel: string
  unit?: string
  actual: number
  expected: string
  status: 'pass' | 'fail'
  message: string
}

export type ScheduleResultValidationResult = {
  plan: SchedulePlan
  model: {
    file: string
    name: string
  }
  compliant: boolean
  summaryMessage: string
  rows: ScheduleResultValidationRow[]
  failedCount: number
  checkedCount: number
}

export type OutputToInputResult = {
  jb: number
  mxx: number
  ldx: number
  ylsn: number
  route?: Xh2Route
  project?: NpimsProjectFile
}

export type InputToOutputResult = {
  route?: Xh2Route
  project?: NpimsProjectFile
  outputs?: Array<{
    outputName?: string
    outputAmount?: number
    type?: string
  }>
}

export type AuthUser = {
  id?: string | number
  username: string
  displayName?: string
  token?: string
}

export type AuthStatus =
  | 'success'
  | 'account_not_found'
  | 'password_error'
  | 'account_exists'
  | 'register_success'
  | 'validation_error'
  | 'server_error'

export type AuthResult = {
  status: AuthStatus
  message: string
  user?: AuthUser
  raw?: unknown
}
