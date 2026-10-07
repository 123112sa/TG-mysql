import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { useState, type ReactNode } from 'react'

type CanvasRightPanelProps = {
  children: ReactNode
}

export default function CanvasRightPanel({ children }: CanvasRightPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const toggleLabel = collapsed ? '展开右侧信息栏' : '收起右侧信息栏'

  return (
    <aside
      className={`side-info canvas-right-panel${collapsed ? ' canvas-right-panel--collapsed' : ''}`}
    >
      <div className="canvas-right-panel__header">
        {collapsed ? null : <span>工作区信息</span>}
        <Tooltip title={toggleLabel} placement="left">
          <Button
            type="text"
            icon={collapsed ? <LeftOutlined /> : <RightOutlined />}
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            aria-controls="canvas-right-panel-content"
            onClick={() => setCollapsed((current) => !current)}
          />
        </Tooltip>
      </div>
      <div
        id="canvas-right-panel-content"
        className="canvas-right-panel__content"
        hidden={collapsed}
      >
        {children}
      </div>
    </aside>
  )
}
