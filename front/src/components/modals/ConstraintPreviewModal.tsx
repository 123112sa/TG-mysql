import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, InputNumber, Select, Space, Spin, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { listScheduleConstraintFieldsApi, previewScheduleConstraintsApi } from '../../api/schedule'
import type {
  ScheduleConstraintComparison,
  ScheduleConstraintField,
  ScheduleConstraintOperator,
  ScheduleConstraintPreviewResult,
  ScheduleConstraintRule,
  ScheduleOptimizeResult
} from '../../types'
import DraggableModal from './DraggableModal'

type ConstraintPreviewModalProps = {
  open: boolean
  schedule: ScheduleOptimizeResult | null
  onCancel: () => void
}

const MAX_RULE_COUNT = 20
const DEFAULT_FIELD = 'product'
const OPERATOR_OPTIONS: Array<{ label: string; value: ScheduleConstraintOperator }> = [
  { label: '下限 >=', value: 'min' },
  { label: '上限 <=', value: 'max' },
  { label: '固定值 =', value: 'fixed' }
]

function filterConstraintFieldsForRoute(fields: ScheduleConstraintField[], route?: string) {
  const normalizedRoute = String(route ?? '').toUpperCase()
  const unsupportedField = normalizedRoute === 'MXX'
    ? 'ldx'
    : normalizedRoute === 'LDX'
      ? 'mxx'
      : null

  return unsupportedField
    ? fields.filter((field) => String(field.key) !== unsupportedField)
    : fields
}

function createRule(
  schedule: ScheduleOptimizeResult | null,
  fields: ScheduleConstraintField[],
  usedFields: string[] = []
): ScheduleConstraintRule | null {
  const available = fields.find((field) => !usedFields.includes(String(field.key)))
  const preferred = usedFields.length === 0
    ? fields.find((field) => String(field.key) === DEFAULT_FIELD) ?? available
    : available
  const field = String(preferred?.key ?? DEFAULT_FIELD)
  if (fields.length && !preferred) return null
  const value = schedule?.dailyResults?.[0]?.[field as keyof ScheduleOptimizeResult['dailyResults'][number]]
  return {
    field,
    operator: 'min',
    value: typeof value === 'number' ? Number(value.toFixed(3)) : 0
  }
}

function formatNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(3)).toString() : '-'
}

function renderCheckTag(ok: boolean, label: string) {
  return <Tag color={ok ? 'success' : 'error'}>{label}{ok ? '：通过' : '：未通过'}</Tag>
}

export default function ConstraintPreviewModal({ open, schedule, onCancel }: ConstraintPreviewModalProps) {
  const [fields, setFields] = useState<ScheduleConstraintField[]>([])
  const [rules, setRules] = useState<ScheduleConstraintRule[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<ScheduleConstraintPreviewResult | null>(null)

  useEffect(() => {
    if (!open) return
    setPreview(null)
    setFieldsLoading(true)
    listScheduleConstraintFieldsApi()
      .then((nextFields) => {
        const availableFields = filterConstraintFieldsForRoute(nextFields, schedule?.plan.route)
        setFields(availableFields)
        const initialRule = createRule(schedule, availableFields)
        setRules(initialRule ? [initialRule] : [])
      })
      .catch((error) => {
        setFields([])
        setRules([])
        message.error(error instanceof Error ? error.message : '约束字段加载失败')
      })
      .finally(() => setFieldsLoading(false))
  }, [open, schedule])

  const fieldOptions = useMemo(() => fields.map((field) => ({
    label: `${field.label}${field.unit ? `（${field.unit}）` : ''}`,
    value: String(field.key)
  })), [fields])

  const updateRule = (index: number, patch: Partial<ScheduleConstraintRule>) => {
    setRules((current) => current.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...patch } : rule))
    setPreview(null)
  }

  const handleAddRule = () => {
    if (rules.length >= MAX_RULE_COUNT) {
      message.info(`最多允许${MAX_RULE_COUNT}条约束`)
      return
    }
    const nextRule = createRule(schedule, fields, rules.map((rule) => String(rule.field)))
    if (!nextRule) {
      message.info('没有更多可添加的约束字段')
      return
    }
    setRules((current) => [...current, nextRule])
    setPreview(null)
  }

  const handlePreview = async () => {
    if (!schedule) return
    if (!rules.length || rules.some((rule) => !rule.field || !Number.isFinite(Number(rule.value)))) {
      message.info('请至少填写一条有效约束')
      return
    }
    setPreviewLoading(true)
    try {
      setPreview(await previewScheduleConstraintsApi({
        planName: schedule.plan.planName || '约束试运行',
        startDate: schedule.plan.startDate,
        planningDays: schedule.plan.planningDays,
        targetAmount: schedule.plan.targetAmount,
        route: schedule.plan.route,
        rules: rules.map((rule) => ({ ...rule, value: Number(rule.value) }))
      }))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '约束试运行失败')
    } finally {
      setPreviewLoading(false)
    }
  }

  const columns: ColumnsType<ScheduleConstraintComparison> = [
    { title: '变量', dataIndex: 'label', key: 'label', width: 150 },
    { title: '类别', dataIndex: 'group', key: 'group', width: 100, render: (value?: string) => value || '-' },
    { title: '原方案', dataIndex: 'before', key: 'before', align: 'right', render: formatNumber },
    { title: '试运行', dataIndex: 'after', key: 'after', align: 'right', render: formatNumber },
    { title: '变化量', dataIndex: 'delta', key: 'delta', align: 'right', render: formatNumber },
    { title: '变化比例', dataIndex: 'deltaPercent', key: 'deltaPercent', align: 'right', render: (value) => value == null ? '-' : `${formatNumber(value)}%` },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80, render: (value?: string) => value || '-' }
  ]

  return (
    <DraggableModal
      open={open}
      title="约束规则试运行与影响预览"
      width={960}
      footer={null}
      onCancel={onCancel}
      destroyOnClose
      className="constraint-preview-modal"
    >
      {!schedule ? <Empty description="请先选择一个多负荷优化方案" /> : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div className="constraint-preview-modal__summary">
            <span>方案 {schedule.plan.planName || '-'}</span>
            <span>{schedule.plan.startDate} 至 {schedule.plan.endDate}</span>
            <span>{schedule.plan.planningDays}天</span>
            <span>目标产量 {schedule.plan.targetAmount} 吨</span>
            <span>路线 {schedule.plan.route}</span>
          </div>
          <div className="constraint-preview-modal__actions">
            <Button icon={<PlusOutlined />} disabled={fieldsLoading || rules.length >= Math.min(MAX_RULE_COUNT, fields.length)} onClick={handleAddRule}>
              添加约束
            </Button>
            <Button type="primary" loading={previewLoading} onClick={handlePreview}>试运行</Button>
          </div>
          {fieldsLoading ? <div className="constraint-preview-modal__loading"><Spin /></div> : (
            <div className="constraint-preview-modal__rules">
              {rules.map((rule, index) => (
                <div className="constraint-preview-rule-row" key={`${String(rule.field)}-${index}`}>
                  <Select
                    showSearch
                    value={String(rule.field)}
                    options={fieldOptions.map((option) => ({
                      ...option,
                      disabled: rules.some((item, itemIndex) => itemIndex !== index && String(item.field) === option.value)
                    }))}
                    optionFilterProp="label"
                    onChange={(field) => updateRule(index, { field })}
                  />
                  <Select<ScheduleConstraintOperator> value={rule.operator} options={OPERATOR_OPTIONS} onChange={(operator) => updateRule(index, { operator })} />
                  <InputNumber value={rule.value} min={0} precision={3} onChange={(value) => updateRule(index, { value: Number(value ?? 0) })} />
                  <Button danger icon={<DeleteOutlined />} disabled={rules.length <= 1} onClick={() => {
                    setRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index))
                    setPreview(null)
                  }} />
                </div>
              ))}
            </div>
          )}
          {preview ? (
            <>
              <div className="constraint-preview-modal__checks">
                {renderCheckTag(preview.checks.feasible, '模型可行')}
                {renderCheckTag(preview.checks.targetSatisfied, '目标满足')}
                {renderCheckTag(preview.checks.constraintsEffective, '约束生效')}
              </div>
              <Alert
                showIcon
                type={preview.checks.feasible && preview.checks.targetSatisfied && preview.checks.constraintsEffective ? 'success' : 'warning'}
                message="试运行结果"
                description={preview.checks.messages.join('；')}
              />
              <Table<ScheduleConstraintComparison>
                className="constraint-preview-modal__table"
                rowKey="field"
                size="small"
                columns={columns}
                dataSource={preview.comparison}
                pagination={false}
                scroll={{ x: 760, y: 300 }}
              />
            </>
          ) : (
            <Alert showIcon type="info" message="试运行不会覆盖正式配置" description="新增约束仅用于本次临时求解，系统将对比原方案和试运行方案的关键指标。" />
          )}
        </Space>
      )}
    </DraggableModal>
  )
}
