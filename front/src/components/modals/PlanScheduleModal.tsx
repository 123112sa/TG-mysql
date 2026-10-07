import { Form, Input, InputNumber, Select } from 'antd'
import type { PlanScheduleInput, Xh2Route } from '../../types'
import DraggableModal from './DraggableModal'

type PlanScheduleModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: (value: PlanScheduleInput) => void
}

type PlanScheduleFormState = {
  planName: string
  startDate: string
  planningDays: number
  targetAmount: number
  route: Xh2Route
}

const text = {
  title: '\u591a\u8d1f\u8377\u4f18\u5316',
  ok: '\u786e\u5b9a',
  cancel: '\u53d6\u6d88',
  planName: '\u65b9\u6848\u540d\u79f0',
  planNameRequired: '\u8bf7\u8f93\u5165\u65b9\u6848\u540d\u79f0',
  startDate: '\u8ba1\u5212\u5f00\u59cb\u65e5\u671f',
  startDateRequired: '\u8bf7\u9009\u62e9\u8ba1\u5212\u5f00\u59cb\u65e5\u671f',
  planningDays: '\u8ba1\u5212\u5468\u671f\uff08\u5929\uff09',
  planningDaysRequired: '\u8bf7\u8f93\u5165\u8ba1\u5212\u5468\u671f',
  targetAmount: '\u76ee\u6807\u4ea7\u91cf\uff08\u5428\uff09',
  targetAmountRequired: '\u8bf7\u8f93\u5165\u76ee\u6807\u4ea7\u91cf',
  route: 'XH2D\u8def\u7ebf',
  routeRequired: '\u8bf7\u9009\u62e9XH2D\u8def\u7ebf',
  tip: '\u5f53\u524d\u63a5\u5165\u591a\u8d1f\u8377\u4f18\u5316\u6a21\u578b\uff0c\u6309\u8ba1\u5212\u5f00\u59cb\u65e5\u671f\u751f\u6210\u6bcf\u65e5\u6295\u6599\u548c\u4ea7\u91cf\u7ed3\u679c\u3002'
}

const formatToday = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function PlanScheduleModal({ open, onCancel, onConfirm }: PlanScheduleModalProps) {
  const [form] = Form.useForm<PlanScheduleFormState>()

  const handleOk = async () => {
    const values = await form.validateFields()
    onConfirm(values)
  }

  return (
    <DraggableModal
      open={open}
      title={text.title}
      onCancel={onCancel}
      onOk={handleOk}
      okText={text.ok}
      cancelText={text.cancel}
      width={620}
      className="system-modal"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="plan-schedule-form"
        initialValues={{
          planName: `${formatToday()} 7\u5929\u591a\u8d1f\u8377\u4f18\u5316 MXX \u76ee\u6807700\u5428`,
          startDate: formatToday(),
          planningDays: 7,
          targetAmount: 700,
          route: 'MXX'
        }}
      >
        <Form.Item label={text.planName} name="planName" rules={[{ required: true, whitespace: true, message: text.planNameRequired }]}>
          <Input className="system-input" placeholder="例如：2026-06-07 7天计划 MXX 目标700吨" maxLength={128} />
        </Form.Item>

        <div className="plan-schedule-form__grid">
          <Form.Item label={text.startDate} name="startDate" rules={[{ required: true, message: text.startDateRequired }]}>
            <Input className="system-input" type="date" />
          </Form.Item>

          <Form.Item
            label={text.planningDays}
            name="planningDays"
            rules={[
              { required: true, message: text.planningDaysRequired },
              {
                type: 'number',
                min: 1,
                max: 30,
                message: '\u8ba1\u5212\u5468\u671f\u5fc5\u987b\u57281-30\u5929\u4e4b\u95f4'
              }
            ]}
          >
            <InputNumber className="system-number" min={1} max={30} precision={0} />
          </Form.Item>

          <Form.Item
            label={text.targetAmount}
            name="targetAmount"
            dependencies={['planningDays']}
            rules={[
              { required: true, message: text.targetAmountRequired },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value === undefined || value === null) {
                    return Promise.resolve()
                  }
                  const days = Number(getFieldValue('planningDays') || 0)
                  if (!days) {
                    return Promise.resolve()
                  }
                  const min = days * 80
                  const max = days * 110
                  if (Number(value) < min || Number(value) > max) {
                    return Promise.reject(new Error(`目标产量必须在${min}-${max}吨之间`))
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <InputNumber className="system-number" min={0} precision={2} />
          </Form.Item>

          <Form.Item label={text.route} name="route" rules={[{ required: true, message: text.routeRequired }]}>
            <Select
              className="system-number"
              options={[
                { value: 'MXX', label: 'MXX' },
                { value: 'LDX', label: 'L/DX' }
              ]}
            />
          </Form.Item>
        </div>

        <div className="plan-schedule-form__tip">{text.tip}</div>
      </Form>
    </DraggableModal>
  )
}
