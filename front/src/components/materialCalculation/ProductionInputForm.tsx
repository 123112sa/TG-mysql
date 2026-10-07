import { Col, Form, InputNumber, Row } from 'antd'

const inputItems = [
  { key: 'jb', label: 'JB 投入量' },
  { key: 'mxx', label: 'MXX 投入量' },
  { key: 'ldx', label: 'L/DX 投入量' },
  { key: 'ylsn', label: 'YLSN 投入量' }
] as const

type ProductionInputFormProps = {
  disabled?: boolean
}

export default function ProductionInputForm({ disabled = false }: ProductionInputFormProps) {
  return (
    <Row gutter={[20, 0]}>
      {inputItems.map((item) => (
        <Col xs={24} md={12} key={item.key}>
          <Form.Item
            label={item.label}
            name={['inputs', item.key]}
            rules={[
              { required: true, message: `请输入${item.label}` },
              {
                validator: (_, value) =>
                  Number.isFinite(value) && value >= 0
                    ? Promise.resolve()
                    : Promise.reject(new Error('请输入非负数值'))
              }
            ]}
          >
            <InputNumber
              min={0}
              precision={2}
              controls
              disabled={disabled}
              addonAfter="L/min"
              placeholder={`请输入${item.label}`}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      ))}
    </Row>
  )
}
