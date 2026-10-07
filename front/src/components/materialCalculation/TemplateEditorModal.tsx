import { Form, Input, Modal, Segmented, Select } from 'antd'
import { useEffect } from 'react'
import type {
  MaterialParameterDraft,
  MaterialParameterTemplate,
  MaterialParameterTemplateInput,
  SolveMode
} from '../../types'
import ProductionInputForm from './ProductionInputForm'
import TargetOutputForm from './TargetOutputForm'

type TemplateEditorModalProps = {
  open: boolean
  draft: MaterialParameterDraft
  template?: MaterialParameterTemplate | null
  saving?: boolean
  zIndex?: number
  onCancel: () => void
  onSubmit: (input: MaterialParameterTemplateInput) => Promise<void> | void
}

type EditorValues = MaterialParameterTemplateInput

const modeOptions = [
  { value: 'input-to-output', label: '产量预测' },
  { value: 'output-to-input', label: '投料反算' }
]

export default function TemplateEditorModal({
  open,
  draft,
  template,
  saving = false,
  zIndex,
  onCancel,
  onSubmit
}: TemplateEditorModalProps) {
  const [form] = Form.useForm<EditorValues>()
  const mode = Form.useWatch('mode', form) as SolveMode | undefined

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      ...draft,
      ...template,
      name: template?.name ?? '',
      description: template?.description ?? '',
      version: template?.version
    })
  }, [draft, form, open, template])

  const handleOk = async () => {
    const values = await form.validateFields()
    const input: MaterialParameterTemplateInput = {
      ...values,
      description: values.description?.trim() ?? '',
      name: values.name.trim(),
      target: values.mode === 'output-to-input'
        ? {
            productCode: values.target?.productCode ?? 'TG',
            productName: '硬质糖果成品',
            amount: values.target?.amount ?? 0
          }
        : undefined,
      inputs: values.mode === 'input-to-output' ? values.inputs : undefined
    }
    await onSubmit(input)
  }

  return (
    <Modal
      title={template ? '编辑参数模板' : '另存为参数模板'}
      open={open}
      width={700}
      zIndex={zIndex}
      okText={template ? '保存修改' : '保存模板'}
      cancelText="取消"
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={handleOk}
      destroyOnClose
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          label="模板名称"
          name="name"
          rules={[
            { required: true, message: '请输入模板名称' },
            { max: 128, message: '模板名称不能超过 128 个字符' }
          ]}
        >
          <Input placeholder="请输入便于识别的模板名称" showCount maxLength={128} />
        </Form.Item>
        <Form.Item
          label="模板说明"
          name="description"
          rules={[{ max: 500, message: '模板说明不能超过 500 个字符' }]}
        >
          <Input.TextArea rows={2} showCount maxLength={500} placeholder="可填写适用场景或备注" />
        </Form.Item>
        <div className="material-template-editor-context">
          <Form.Item label="测算模式" name="mode" rules={[{ required: true }]}>
            <Segmented block options={modeOptions} />
          </Form.Item>
          <Form.Item label="生产路线" name="route" rules={[{ required: true }]}>
            <Select options={[
              { value: 'MXX', label: 'MXX' },
              { value: 'LDX', label: 'L/DX' }
            ]} />
          </Form.Item>
        </div>
        {mode === 'output-to-input' ? <TargetOutputForm /> : <ProductionInputForm />}
      </Form>
    </Modal>
  )
}
