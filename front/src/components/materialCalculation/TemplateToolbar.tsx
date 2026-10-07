import { CopyOutlined, DatabaseOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { Button, Select, Space, Tooltip } from 'antd'
import type { MaterialParameterTemplate } from '../../types'

type TemplateToolbarProps = {
  templates: MaterialParameterTemplate[]
  loading?: boolean
  selectedTemplateId?: number
  onSelect: (templateId?: number) => void
  onLoad: () => void
  onSaveAs: () => void
  onManage: () => void
}

export default function TemplateToolbar({
  templates,
  loading = false,
  selectedTemplateId,
  onSelect,
  onLoad,
  onSaveAs,
  onManage
}: TemplateToolbarProps) {
  return (
    <div className="material-template-toolbar">
      <Select
        allowClear
        showSearch
        loading={loading}
        value={selectedTemplateId}
        optionFilterProp="label"
        placeholder="选择参数模板"
        options={templates.map((template) => ({
          value: template.id,
          label: template.name
        }))}
        onChange={onSelect}
        style={{ minWidth: 220 }}
      />
      <Space wrap>
        <Button
          icon={<FolderOpenOutlined />}
          disabled={!selectedTemplateId}
          onClick={onLoad}
        >
          加载模板
        </Button>
        <Button icon={<CopyOutlined />} onClick={onSaveAs}>
          另存为模板
        </Button>
        <Tooltip title="查询、编辑、复制和删除模板">
          <Button icon={<DatabaseOutlined />} onClick={onManage}>
            模板管理
          </Button>
        </Tooltip>
      </Space>
    </div>
  )
}
