import {
  AimOutlined,
  FolderOpenOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { Button, Select, Space, Tag, Tooltip } from 'antd'
import type { ProjectSessionStatus } from '../../hooks/useProjectSession'
import RunContextBar from '../workbench/RunContextBar'

type ProjectContextBarProps = {
  projectName: string
  status: ProjectSessionStatus
  activeCanvas: string
  canvasNames: string[]
  hasCanvasContent: boolean
  onCanvasChange: (canvasName: string) => void
  onOpenProject: () => void
  onSaveProject: () => void
  onResetView: () => void
}

export const projectStatusConfig: Record<
  ProjectSessionStatus,
  { color: string; label: string }
> = {
  empty: { color: 'default', label: '未打开工程' },
  unsaved: { color: 'gold', label: '新建工程未保存' },
  loaded: { color: 'success', label: '已保存' },
  modified: { color: 'processing', label: '有未保存修改' }
}

export default function ProjectContextBar({
  projectName,
  status,
  activeCanvas,
  canvasNames,
  hasCanvasContent,
  onCanvasChange,
  onOpenProject,
  onSaveProject,
  onResetView
}: ProjectContextBarProps) {
  const statusConfig = projectStatusConfig[status]
  const isBlankProject = status === 'empty' || status === 'unsaved'

  return (
    <RunContextBar
      title="工程画布"
      description={isBlankProject
        ? '使用基础图库新建工程，或打开已有工程文件'
        : `正在编辑 ${projectName}`}
      context={(
        <div className="run-context-fields project-context-fields">
          <div className="run-context-field project-context-field--name">
            <span className="run-context-field__label">当前工程</span>
            <strong className="project-context-name" title={projectName}>{projectName}</strong>
          </div>
          <label className="run-context-field">
            <span className="run-context-field__label">当前画布</span>
            <Select
              value={activeCanvas}
              options={canvasNames.map((name) => ({ value: name, label: name }))}
              className="legacy-select legacy-select--wide canvas-name-select"
              onChange={onCanvasChange}
            />
          </label>
          <div className="run-context-field run-context-field--status">
            <span className="run-context-field__label">工程状态</span>
            <Tag color={statusConfig.color} className="run-context-status-tag">
              {statusConfig.label}
            </Tag>
          </div>
        </div>
      )}
      actions={(
        <Space size={10}>
          <Button icon={<FolderOpenOutlined />} onClick={onOpenProject}>
            打开工程
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={!hasCanvasContent}
            onClick={onSaveProject}
          >
            {isBlankProject ? '保存为工程' : '保存工程'}
          </Button>
        </Space>
      )}
      tools={(
        <Tooltip title={hasCanvasContent ? '适应画布' : '画布暂无内容'}>
          <Button
            type="text"
            aria-label="适应画布"
            icon={<AimOutlined />}
            disabled={!hasCanvasContent}
            onClick={onResetView}
          />
        </Tooltip>
      )}
    />
  )
}
