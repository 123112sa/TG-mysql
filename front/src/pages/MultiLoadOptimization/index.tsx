import {
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  LineChartOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Button, DatePicker, Select, Space, Tag, Tooltip } from 'antd'
import type { Dayjs } from 'dayjs'
import RunContextBar from '../../components/workbench/RunContextBar'
import type { SchedulePlan } from '../../types'

type MultiLoadOptimizationPageProps = {
  activeCanvas: string
  canvasNames: string[]
  activeDate: Dayjs | null
  plans: SchedulePlan[]
  selectedPlanId?: string | number
  plansLoading: boolean
  planDeleting: boolean
  hasResult: boolean
  disableDate: (date: Dayjs) => boolean
  onCanvasChange: (canvasName: string) => void
  onDateChange: (date: Dayjs | null) => void
  onPlanChange: (planId: string | number | undefined) => void
  onCreatePlan: () => void
  onDeletePlan: () => void
  onViewResult: () => void
  onReset: () => void
  onResetView: () => void
}

export default function MultiLoadOptimizationPage({
  activeCanvas,
  canvasNames,
  activeDate,
  plans,
  selectedPlanId,
  plansLoading,
  planDeleting,
  hasResult,
  disableDate,
  onCanvasChange,
  onDateChange,
  onPlanChange,
  onCreatePlan,
  onDeletePlan,
  onViewResult,
  onReset,
  onResetView
}: MultiLoadOptimizationPageProps) {
  return (
    <RunContextBar
      title="多负荷优化"
      description="编排计划周期、目标产量与工艺路线"
      context={(
        <div className="run-context-fields">
          <div className="run-context-field">
            <span className="run-context-field__label">当前画布</span>
            <Select
              value={activeCanvas}
              options={canvasNames.map((name) => ({ value: name, label: name }))}
              className="canvas-name-select"
              onChange={onCanvasChange}
            />
          </div>
          <div className="run-context-field">
            <span className="run-context-field__label">历史方案</span>
            <Select
              allowClear
              showSearch
              placeholder="选择历史方案"
              loading={plansLoading}
              value={selectedPlanId}
              options={plans.map((plan) => ({
                value: plan.id as string | number,
                label: plan.planName || `${plan.startDate} ${plan.planningDays}天计划`
              }))}
              className="schedule-history-select schedule-history-select--context"
              optionFilterProp="label"
              onChange={onPlanChange}
            />
          </div>
          <div className="run-context-field">
            <span className="run-context-field__label">计算日期</span>
            <DatePicker
              allowClear={false}
              inputReadOnly
              value={activeDate}
              format="YYYY-MM-DD ddd"
              disabled={!hasResult}
              disabledDate={disableDate}
              className="schedule-date-picker schedule-date-picker--context"
              onChange={onDateChange}
            />
          </div>
          <div className="run-context-field run-context-field--status">
            <span className="run-context-field__label">方案状态</span>
            <Tag
              color={hasResult ? 'success' : 'default'}
              icon={hasResult ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              className="run-context-status-tag"
            >
              {hasResult ? '方案已加载' : '待创建方案'}
            </Tag>
          </div>
        </div>
      )}
      actions={(
        <Space size={8}>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreatePlan}>新建方案</Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={selectedPlanId === undefined || planDeleting}
            loading={planDeleting}
            onClick={onDeletePlan}
          >
            删除
          </Button>
          <Button icon={<LineChartOutlined />} disabled={!hasResult} onClick={onViewResult}>
            查看结果
          </Button>
        </Space>
      )}
      tools={(
        <Space size={2}>
          <Tooltip title="重置工作区">
            <Button type="text" icon={<ReloadOutlined />} onClick={onReset} aria-label="重置工作区" />
          </Tooltip>
          <Tooltip title="重置视图">
            <Button type="text" icon={<AimOutlined />} onClick={onResetView} aria-label="重置视图" />
          </Tooltip>
        </Space>
      )}
    />
  )
}
