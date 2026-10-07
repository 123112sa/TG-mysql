import { Card } from 'antd'
import type { ReactNode } from 'react'

type RunContextBarProps = {
  title: string
  description: string
  headingExtra?: ReactNode
  context?: ReactNode
  actions?: ReactNode
  tools?: ReactNode
}

export default function RunContextBar({
  title,
  description,
  headingExtra,
  context,
  actions,
  tools
}: RunContextBarProps) {
  return (
    <Card className="run-context-card" size="small">
      <div className="run-context-bar">
        <div className="run-context-bar__heading">
          <div className="run-context-bar__identity">
            <strong>{title}</strong>
            <span>{description}</span>
          </div>
          {headingExtra ? <div className="run-context-bar__heading-extra">{headingExtra}</div> : null}
        </div>
        <div className="run-context-bar__controls">
          {context ? <div className="run-context-bar__context">{context}</div> : null}
          {actions ? <div className="run-context-bar__actions">{actions}</div> : null}
          {tools ? <div className="run-context-bar__tools">{tools}</div> : null}
        </div>
      </div>
    </Card>
  )
}
