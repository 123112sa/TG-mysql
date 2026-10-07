import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Alert, Modal, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ScheduleResultValidationResult, ScheduleResultValidationRow } from '../../types'

type ScheduleResultValidationModalProps = {
  open: boolean
  loading: boolean
  result: ScheduleResultValidationResult | null
  onCancel: () => void
}

const validationColumns: ColumnsType<ScheduleResultValidationRow> = [
  {
    title: '日期',
    dataIndex: 'date',
    width: 112,
    fixed: 'left'
  },
  {
    title: '约束项',
    dataIndex: 'constraintName',
    width: 180
  },
  {
    title: '物料/指标',
    dataIndex: 'fieldLabel',
    width: 140
  },
  {
    title: '当前值',
    dataIndex: 'actual',
    width: 120,
    render: (value: number, row) => `${Number(value || 0).toFixed(3)}${row.unit || ''}`
  },
  {
    title: '约束要求',
    dataIndex: 'expected',
    width: 160
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    render: (status: ScheduleResultValidationRow['status']) =>
      status === 'pass' ? <Tag color="success">通过</Tag> : <Tag color="error">异常</Tag>
  },
  {
    title: '提示',
    dataIndex: 'message',
    minWidth: 320
  }
]

export default function ScheduleResultValidationModal({
  open,
  loading,
  result,
  onCancel
}: ScheduleResultValidationModalProps) {
  const failedRows = result?.rows.filter((row) => row.status === 'fail') || []
  const visibleRows = failedRows.length > 0 ? failedRows : result?.rows || []

  return (
    <Modal
      title="结果校验"
      open={open}
      width={980}
      footer={null}
      onCancel={onCancel}
      destroyOnHidden
    >
      <div className="schedule-validation-modal">
        {result ? (
          <Alert
            type={result.compliant ? 'success' : 'error'}
            showIcon
            icon={result.compliant ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            message={result.summaryMessage}
            description={`校验模型：${result.model.file}；共检查 ${result.checkedCount} 项，异常 ${result.failedCount} 项。`}
            className="schedule-validation-modal__summary"
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message={loading ? '正在校验调度结果...' : '点击结果校验后展示校验结果'}
            className="schedule-validation-modal__summary"
          />
        )}

        <Table<ScheduleResultValidationRow>
          rowKey={(row, index) => `${row.date}-${row.constraintKey}-${row.field}-${index}`}
          size="small"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1120 }}
          dataSource={visibleRows}
          columns={validationColumns}
        />
      </div>
    </Modal>
  )
}
