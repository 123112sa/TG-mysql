import { Col, Form, Input, InputNumber, Row, Select } from 'antd'

type TargetOutputFormProps = {
  disabled?: boolean
}

const products = [
  { value: 'TG', label: '硬质糖果成品' }
]

export default function TargetOutputForm({ disabled = false }: TargetOutputFormProps) {
  return (
    <Row gutter={[20, 0]}>
      <Col xs={24} md={12}>
        <Form.Item
          label="目标产品"
          name={['target', 'productCode']}
          rules={[{ required: true, message: '请选择目标产品' }]}
        >
          <Select disabled={disabled} options={products} />
        </Form.Item>
        <Form.Item name={['target', 'productName']} hidden>
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          label="目标产量"
          name={['target', 'amount']}
          rules={[
            { required: true, message: '请输入目标产量' },
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
            addonAfter="吨"
            placeholder="请输入目标产量"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
    </Row>
  )
}
