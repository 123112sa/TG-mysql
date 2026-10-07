import { Button, Checkbox, Empty, Select, Space, Spin } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { ScheduleReportField, ScheduleReportMode } from '../../types'
import DraggableModal from './DraggableModal'

type ScheduleReportModalProps = {
  open: boolean
  loading?: boolean
  fieldsLoading?: boolean
  fields: ScheduleReportField[]
  onCancel: () => void
  onDownload: (mode: ScheduleReportMode, fields: string[]) => void | Promise<void>
}

const DEFAULT_SELECTED_FIELD = 'product'

export default function ScheduleReportModal({
  open,
  loading = false,
  fieldsLoading = false,
  fields,
  onCancel,
  onDownload
}: ScheduleReportModalProps) {
  const [mode, setMode] = useState<ScheduleReportMode>('full')
  const [selectedFields, setSelectedFields] = useState<string[]>([DEFAULT_SELECTED_FIELD])
  const fieldOptions = useMemo(() => fields.map((field) => ({
    label: field.unit ? `${field.label}（${field.unit}）` : field.label,
    value: String(field.key)
  })), [fields])

  useEffect(() => {
    if (!open) return
    setMode('full')
    if (fields.length > 0) {
      const initialField = fields.some((field) => field.key === DEFAULT_SELECTED_FIELD)
        ? DEFAULT_SELECTED_FIELD
        : String(fields[0].key)
      setSelectedFields([initialField])
    }
  }, [open, fields])

  const allFieldKeys = fieldOptions.map((option) => option.value)

  return (
    <DraggableModal
      open={open}
      title="报表生成"
      width={620}
      footer={null}
      onCancel={onCancel}
      destroyOnClose
      className="schedule-report-modal"
    >
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <div className="schedule-report-modal__row">
          <span className="schedule-report-modal__label">报表类型</span>
          <Select<ScheduleReportMode>
            value={mode}
            options={[
              { label: '完整报表', value: 'full' },
              { label: '自定义报表', value: 'custom' }
            ]}
            onChange={setMode}
          />
        </div>

        {mode === 'custom' ? (
          <div className="schedule-report-modal__fields">
            <div className="schedule-report-modal__field-head">
              <strong>选择导出字段</strong>
              <Space size={4}>
                <Button type="link" size="small" disabled={fieldsLoading || !allFieldKeys.length} onClick={() => setSelectedFields(allFieldKeys)}>
                  全选
                </Button>
                <Button type="link" size="small" disabled={fieldsLoading || !selectedFields.length} onClick={() => setSelectedFields([])}>
                  清空
                </Button>
              </Space>
            </div>
            {fieldsLoading ? (
              <div className="schedule-report-modal__loading"><Spin /></div>
            ) : fieldOptions.length ? (
              <Checkbox.Group
                className="schedule-report-modal__checkboxes"
                options={fieldOptions}
                value={selectedFields}
                onChange={(values) => setSelectedFields(values.map(String))}
              />
            ) : (
              <Empty description="暂无可选字段" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        ) : null}

        <div className="schedule-report-modal__actions">
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            loading={loading}
            disabled={mode === 'custom' && !selectedFields.length}
            onClick={() => onDownload(mode, selectedFields)}
          >
            下载
          </Button>
        </div>
      </Space>
    </DraggableModal>
  )
}
