import { Alert, Descriptions } from 'antd'
import type { OutputToInputResult } from '../../types'
import DraggableModal from './DraggableModal'

type InputRequirementResultModalProps = {
  open: boolean
  result: OutputToInputResult | null
  onCancel: () => void
}

export default function InputRequirementResultModal({
  open,
  result,
  onCancel
}: InputRequirementResultModalProps) {
  const items = result
    ? [
        { key: 'jb', label: 'JB 投入量', children: `${result.jb.toFixed(2)} L/min` },
        { key: 'mxx', label: 'MXX 投入量', children: `${result.mxx.toFixed(2)} L/min` },
        { key: 'ldx', label: 'L/DX 投入量', children: `${result.ldx.toFixed(2)} L/min` },
        { key: 'ylsn', label: 'YLSN 投入量', children: `${result.ylsn.toFixed(2)} L/min` }
      ]
    : []

  return (
    <DraggableModal
      open={open}
      title="投入量要求"
      footer={null}
      onCancel={onCancel}
      width={640}
      className="system-modal input-requirement-result-modal"
      destroyOnClose
    >
      <Alert
        className="system-modal-tip"
        type="info"
        showIcon
        message="当前为投料反算模式，投入量要求为测算结果，仅供查看。"
      />
      <Descriptions
        className="input-requirement-result-list"
        bordered
        column={1}
        size="middle"
        items={items}
      />
    </DraggableModal>
  )
}
