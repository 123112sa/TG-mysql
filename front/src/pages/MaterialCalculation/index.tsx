import {
  AimOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ControlOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Button, Segmented, Select, Space, Tag, Tooltip } from 'antd'
import RunContextBar from '../../components/workbench/RunContextBar'
import type { SolveMode } from '../../types'

type MaterialCalculationPageProps = {
  mode: SolveMode
  activeCanvas: string
  canvasNames: string[]
  parametersReady: boolean
  resultReady: boolean
  running: boolean
  onModeChange: (mode: SolveMode) => void
  onCanvasChange: (canvasName: string) => void
  onOpenParameters: () => void
  onRun: () => void
  onViewResult: () => void
  onReset: () => void
  onResetView: () => void
}

export default function MaterialCalculationPage({
  mode,
  activeCanvas,
  canvasNames,
  parametersReady,
  resultReady,
  running,
  onModeChange,
  onCanvasChange,
  onOpenParameters,
  onRun,
  onViewResult,
  onReset,
  onResetView
}: MaterialCalculationPageProps) {
  const isForwardMode = mode === 'input-to-output'

  return (
    <RunContextBar
      title="物料测算与预测"
      description={isForwardMode ? '根据物料投入量预测产品产量' : '根据目标产量反算物料需求'}
      headingExtra={(
        <Segmented
          value={mode}
          options={[
            { label: '产量预测', value: 'input-to-output' },
            { label: '投料反算', value: 'output-to-input' }
          ]}
          onChange={(value) => onModeChange(value as SolveMode)}
        />
      )}
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
          <div className="run-context-field run-context-field--status">
            <span className="run-context-field__label">参数状态</span>
            <Tag
              color={parametersReady ? 'success' : 'default'}
              icon={parametersReady ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              className="run-context-status-tag"
            >
              {parametersReady ? '参数已录入' : '待录入参数'}
            </Tag>
          </div>
        </div>
      )}
      actions={(
        <Space size={8}>
          <Button icon={<ControlOutlined />} onClick={onOpenParameters}>参数设置</Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={running}
            disabled={!parametersReady}
            onClick={onRun}
          >
            开始测算
          </Button>
          <Button icon={<LineChartOutlined />} disabled={!resultReady} onClick={onViewResult}>
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
