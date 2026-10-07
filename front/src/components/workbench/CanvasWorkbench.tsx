import type { ReactNode } from 'react'
import CanvasRightPanel from './CanvasRightPanel'

type CanvasWorkbenchProps = {
  contextBar: ReactNode
  children: ReactNode
  rightPanel?: ReactNode
}

export default function CanvasWorkbench({ contextBar, children, rightPanel }: CanvasWorkbenchProps) {
  return (
    <div className="canvas-workbench">
      <section className="workspace-panel workspace-panel--full canvas-workbench__main canvas-workbench__surface">
        {contextBar}
        <div className="canvas-workbench__canvas">{children}</div>
      </section>
      {rightPanel ? <CanvasRightPanel>{rightPanel}</CanvasRightPanel> : null}
    </div>
  )
}
