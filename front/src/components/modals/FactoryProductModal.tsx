import { Alert, Card, Descriptions, InputNumber, Statistic } from 'antd'
import { useEffect, useState } from 'react'
import { getFactoryProductApi } from '../../api/factoryProduct'
import type { SolveMode } from '../../types'
import DraggableModal from './DraggableModal'

type FactoryProductModalProps = {
  open: boolean
  mode: SolveMode
  onCancel: () => void
}

export default function FactoryProductModal({ open, mode, onCancel }: FactoryProductModalProps) {
  const [amount, setAmount] = useState<number | null>(100)
  const isReadOnlyResult = mode === 'input-to-output'
  const now = new Date()
  const currentDate = `${now.getMonth() + 1}月${now.getDate()}日:`

  useEffect(() => {
    if (!open) {
      return
    }

    getFactoryProductApi()
      .then((data) => {
        setAmount(data.amount)
      })
      .catch(() => {
        setAmount(100)
      })
  }, [open])

  return (
    <DraggableModal
      open={open}
      title="出厂产品"
      footer={null}
      onCancel={onCancel}
      width={760}
      className="system-modal"
      destroyOnClose
    >
      <div className="factory-product-form">
        {isReadOnlyResult ? (
          <>
            <div className="result-panel-heading">
              <span>计算结果</span>
              <strong>{currentDate}</strong>
            </div>
            <Card
              className="input-requirement-result-card factory-product-result-card"
              size="small"
              hoverable
            >
              <div className="factory-product-result-card__layout">
                <div>
                  <div className="input-requirement-result-card__label">硬质糖果成品</div>
                  <Statistic value={amount ?? 0} precision={2} suffix="吨" />
                </div>
                <div className="factory-product-result-card__details">
                  <div>
                    <span>当前日期</span>
                    <strong>{currentDate}</strong>
                  </div>
                  <div>
                    <span>目标产品</span>
                    <strong>硬质糖果成品</strong>
                  </div>
                  <div>
                    <span>结果类型</span>
                    <strong>产量预测计算结果</strong>
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Alert
              className="system-modal-tip"
              type="info"
              showIcon
              message="请设置出厂产品目标产量，单位为吨。"
            />
            <Card className="factory-product-card" size="small">
          <div className="factory-product-card__summary">
            <div>
              <div className="factory-product-card__eyebrow">目标设置</div>
              <Statistic title="硬质糖果成品" value={amount ?? 0} precision={2} suffix="吨" />
            </div>
          </div>
          <Descriptions className="factory-product-descriptions" size="small" column={3}>
            <Descriptions.Item label="当前日期">{currentDate}</Descriptions.Item>
            <Descriptions.Item label="目标产品">硬质糖果成品</Descriptions.Item>
            <Descriptions.Item label="展示类型">目标产量</Descriptions.Item>
          </Descriptions>
            <div className="factory-product-form__edit">
              <span className="factory-product-form__edit-label">目标产量</span>
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                value={amount}
                onChange={(value) => setAmount(value)}
                placeholder="请输入目标产量"
                className="factory-product-form__input"
              />
              <span className="factory-product-form__unit">吨</span>
            </div>
            </Card>
          </>
        )}
      </div>
    </DraggableModal>
  )
}
