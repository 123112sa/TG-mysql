import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Button, Drawer, Popconfirm, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MaterialParameterTemplate } from '../../types'

type TemplateManagerDrawerProps = {
  open: boolean
  templates: MaterialParameterTemplate[]
  loading?: boolean
  zIndex?: number
  onClose: () => void
  onRefresh: () => void
  onEdit: (template: MaterialParameterTemplate) => void
  onCopy: (template: MaterialParameterTemplate) => void
  onDelete: (template: MaterialParameterTemplate) => void
}

export default function TemplateManagerDrawer({
  open,
  templates,
  loading = false,
  zIndex,
  onClose,
  onRefresh,
  onEdit,
  onCopy,
  onDelete
}: TemplateManagerDrawerProps) {
  const columns: ColumnsType<MaterialParameterTemplate> = [
    {
      title: '模板名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (name, template) => (
        <div className="material-template-name">
          <strong>{name}</strong>
          <span>{template.description || '暂无说明'}</span>
        </div>
      )
    },
    {
      title: '测算模式',
      dataIndex: 'mode',
      width: 110,
      render: (mode) => (
        <Tag color={mode === 'input-to-output' ? 'blue' : 'cyan'}>
          {mode === 'input-to-output' ? '产量预测' : '投料反算'}
        </Tag>
      )
    },
    {
      title: '路线',
      dataIndex: 'route',
      width: 80
    },
    {
      title: '操作',
      key: 'actions',
      width: 124,
      fixed: 'right',
      render: (_, template) => (
        <Space size={2}>
          <Tooltip title="编辑模板">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(template)} />
          </Tooltip>
          <Tooltip title="复制模板">
            <Button type="text" icon={<CopyOutlined />} onClick={() => onCopy(template)} />
          </Tooltip>
          <Popconfirm
            title="删除参数模板"
            description="删除后无法恢复，确定继续吗？"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(template)}
          >
            <Tooltip title="删除模板">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Drawer
      title="参数模板管理"
      open={open}
      width="min(760px, 92vw)"
      zIndex={zIndex}
      onClose={onClose}
      extra={<Button icon={<ReloadOutlined />} onClick={onRefresh}>刷新</Button>}
    >
      <Table
        rowKey="id"
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={templates}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        scroll={{ x: 620 }}
      />
    </Drawer>
  )
}
