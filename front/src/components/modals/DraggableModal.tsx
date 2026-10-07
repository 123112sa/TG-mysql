import { Modal } from 'antd'
import type { ModalProps } from 'antd'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

type Point = {
  x: number
  y: number
}

type DragBounds = {
  left: number
  right: number
  top: number
  bottom: number
}

type DraggableModalProps = Omit<ModalProps, 'title'> & {
  title: ReactNode
}

const EDGE_PADDING = 16

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function DraggableModal({ title, open, ...props }: DraggableModalProps) {
  const dragRef = useRef<HTMLDivElement | null>(null)
  const startRef = useRef<Point>({ x: 0, y: 0 })
  const originRef = useRef<Point>({ x: 0, y: 0 })
  const boundsRef = useRef<DragBounds>({ left: 0, right: 0, top: 0, bottom: 0 })
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!open) {
      setPosition({ x: 0, y: 0 })
      setDragging(false)
    }
  }, [open])

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - startRef.current.x
      const deltaY = event.clientY - startRef.current.y

      setPosition({
        x: originRef.current.x + clamp(deltaX, boundsRef.current.left, boundsRef.current.right),
        y: originRef.current.y + clamp(deltaY, boundsRef.current.top, boundsRef.current.bottom)
      })
    }

    const handleMouseUp = () => {
      setDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging])

  const handleDragStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !dragRef.current) return

    const rect = dragRef.current.getBoundingClientRect()

    startRef.current = { x: event.clientX, y: event.clientY }
    originRef.current = position
    boundsRef.current = {
      left: -rect.left + EDGE_PADDING,
      right: window.innerWidth - rect.right - EDGE_PADDING,
      top: -rect.top + EDGE_PADDING,
      bottom: window.innerHeight - rect.bottom - EDGE_PADDING
    }

    event.preventDefault()
    setDragging(true)
  }

  return (
    <Modal
      {...props}
      open={open}
      title={
        <div className="draggable-modal__title" onMouseDown={handleDragStart}>
          {title}
        </div>
      }
      modalRender={(modal) => (
        <div
          ref={dragRef}
          className="draggable-modal"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`
          }}
        >
          {modal}
        </div>
      )}
    />
  )
}
