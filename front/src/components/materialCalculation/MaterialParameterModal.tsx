import {
  ClearOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Form,
  message,
  Modal,
  Segmented,
  Select,
  Space,
  Spin
} from 'antd'
import { useEffect, useState } from 'react'
import { useMaterialCalculationStore } from '../../store/materialCalculationStore'
import type {
  MaterialParameterConfiguration,
  MaterialParameterDraft,
  MaterialParameterTemplate,
  MaterialParameterTemplateInput,
  SolveMode
} from '../../types'
import ProductionInputForm from './ProductionInputForm'
import TargetOutputForm from './TargetOutputForm'
import TemplateEditorModal from './TemplateEditorModal'
import TemplateManagerDrawer from './TemplateManagerDrawer'
import TemplateToolbar from './TemplateToolbar'

type MaterialParameterModalProps = {
  open: boolean
  mode: SolveMode
  onModeChange: (mode: SolveMode) => void
  onCancel: () => void
  onSaved?: (configuration: MaterialParameterConfiguration) => void
}

const modeOptions = [
  { value: 'input-to-output', label: '产量预测' },
  { value: 'output-to-input', label: '投料反算' }
]

const PARAMETER_MODAL_Z_INDEX = 1000
const TEMPLATE_MANAGER_DRAWER_Z_INDEX = 1300
const TEMPLATE_EDITOR_MODAL_Z_INDEX = 1400

function normalizeDraft(values: MaterialParameterDraft): MaterialParameterDraft {
  if (values.mode === 'input-to-output') {
    return {
      mode: values.mode,
      route: values.route,
      inputs: {
        jb: values.inputs?.jb ?? 0,
        mxx: values.inputs?.mxx ?? 0,
        ldx: values.inputs?.ldx ?? 0,
        ylsn: values.inputs?.ylsn ?? 0
      }
    }
  }

  return {
    mode: values.mode,
    route: values.route,
    target: {
      productCode: values.target?.productCode ?? 'TG',
      productName: '硬质糖果成品',
      amount: values.target?.amount ?? 0
    }
  }
}

export default function MaterialParameterModal({
  open,
  mode,
  onModeChange,
  onCancel,
  onSaved
}: MaterialParameterModalProps) {
  const [form] = Form.useForm<MaterialParameterDraft>()
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>()
  const [managerOpen, setManagerOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MaterialParameterTemplate | null>(null)

  const draft = useMaterialCalculationStore((state) => state.draft)
  const templates = useMaterialCalculationStore((state) => state.templates)
  const parametersLoading = useMaterialCalculationStore((state) => state.parametersLoading)
  const parametersSaving = useMaterialCalculationStore((state) => state.parametersSaving)
  const templatesLoading = useMaterialCalculationStore((state) => state.templatesLoading)
  const templateSaving = useMaterialCalculationStore((state) => state.templateSaving)
  const setDraft = useMaterialCalculationStore((state) => state.setDraft)
  const loadCurrent = useMaterialCalculationStore((state) => state.loadCurrent)
  const saveCurrent = useMaterialCalculationStore((state) => state.saveCurrent)
  const clearDraft = useMaterialCalculationStore((state) => state.clearDraft)
  const restoreSaved = useMaterialCalculationStore((state) => state.restoreSaved)
  const loadTemplates = useMaterialCalculationStore((state) => state.loadTemplates)
  const createTemplate = useMaterialCalculationStore((state) => state.createTemplate)
  const updateTemplate = useMaterialCalculationStore((state) => state.updateTemplate)
  const copyTemplate = useMaterialCalculationStore((state) => state.copyTemplate)
  const deleteTemplate = useMaterialCalculationStore((state) => state.deleteTemplate)
  const applyTemplate = useMaterialCalculationStore((state) => state.applyTemplate)

  const syncForm = (nextDraft: MaterialParameterDraft) => {
    form.setFieldsValue(nextDraft)
    setDraft(nextDraft)
  }

  const loadConfiguration = async (requestedMode: SolveMode) => {
    try {
      const configuration = await loadCurrent(requestedMode)
      form.setFieldsValue(configuration)
      return configuration
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载物料测算参数失败')
      return null
    }
  }

  useEffect(() => {
    if (!open) {
      setManagerOpen(false)
      setEditorOpen(false)
      setEditingTemplate(null)
      return
    }
    setSelectedTemplateId(undefined)
    void loadConfiguration(mode)
    void loadTemplates().catch((error) => {
      message.error(error instanceof Error ? error.message : '加载参数模板失败')
    })
  }, [open])

  const handleModeChange = async (nextMode: SolveMode) => {
    const configuration = await loadConfiguration(nextMode)
    if (configuration) onModeChange(nextMode)
  }

  const handleValuesChange = () => {
    const values = form.getFieldsValue(true) as MaterialParameterDraft
    if (values.mode && values.route) setDraft(normalizeDraft(values))
  }

  const handleClear = () => {
    clearDraft()
    const cleared = useMaterialCalculationStore.getState().draft
    form.setFieldsValue(cleared)
  }

  const handleRestore = async () => {
    const configuration = await loadConfiguration(
      (form.getFieldValue('mode') as SolveMode | undefined) ?? mode
    )
    if (configuration) message.success('已恢复服务器最近保存的参数')
  }

  const handleCancel = () => {
    restoreSaved()
    form.resetFields()
    onCancel()
  }

  const handleSave = async () => {
    try {
      const values = normalizeDraft(await form.validateFields())
      setDraft(values)
      const configuration = await saveCurrent()
      onModeChange(configuration.mode)
      onSaved?.(configuration)
      message.success('物料测算参数已保存')
      onCancel()
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      message.error(error instanceof Error ? error.message : '保存物料测算参数失败')
    }
  }

  const handleLoadTemplate = () => {
    const template = templates.find((item) => item.id === selectedTemplateId)
    if (!template) return

    const result = applyTemplate(template)
    if (!result.requiresConfirmation) {
      syncForm(useMaterialCalculationStore.getState().draft)
      message.success(`已加载模板“${template.name}”`)
      return
    }

    Modal.confirm({
      title: '切换测算上下文',
      content: `模板“${template.name}”的测算模式或生产路线与当前设置不同。加载后将同步切换，但不会覆盖服务器已保存参数。`,
      okText: '确认加载',
      cancelText: '取消',
      onOk: () => {
        applyTemplate(template, true)
        const nextDraft = useMaterialCalculationStore.getState().draft
        form.setFieldsValue(nextDraft)
        onModeChange(nextDraft.mode)
        message.success(`已加载模板“${template.name}”`)
      }
    })
  }

  const openCreateTemplate = async () => {
    try {
      const values = normalizeDraft(await form.validateFields())
      setDraft(values)
      setEditingTemplate(null)
      setEditorOpen(true)
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      message.error('校验当前参数失败')
    }
  }

  const handleTemplateSubmit = async (input: MaterialParameterTemplateInput) => {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          ...input,
          version: editingTemplate.version
        })
        message.success('参数模板已更新')
      } else {
        await createTemplate(input)
        message.success('参数模板已创建')
      }
      setEditorOpen(false)
      setEditingTemplate(null)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存参数模板失败')
    }
  }

  const handleCopyTemplate = async (template: MaterialParameterTemplate) => {
    try {
      await copyTemplate(template.id)
      message.success(`已复制模板“${template.name}”`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '复制参数模板失败')
    }
  }

  const handleDeleteTemplate = async (template: MaterialParameterTemplate) => {
    try {
      await deleteTemplate(template.id)
      if (selectedTemplateId === template.id) setSelectedTemplateId(undefined)
      message.success('参数模板已删除')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除参数模板失败')
    }
  }

  return (
    <>
      <Modal
        title="物料测算与预测参数设置"
        open={open}
        width={820}
        zIndex={PARAMETER_MODAL_Z_INDEX}
        className="material-parameter-modal"
        okText="保存参数"
        cancelText="取消"
        confirmLoading={parametersSaving}
        onOk={handleSave}
        onCancel={handleCancel}
        footer={(_, { OkBtn, CancelBtn }) => (
          <div className="material-parameter-footer">
            <Space wrap>
              <Button icon={<ClearOutlined />} onClick={handleClear}>清空</Button>
              <Button icon={<ReloadOutlined />} onClick={handleRestore}>恢复上次保存</Button>
            </Space>
            <Space>
              <CancelBtn />
              <OkBtn />
            </Space>
          </div>
        )}
        destroyOnClose
      >
        <Spin spinning={parametersLoading}>
          <Form
            form={form}
            layout="vertical"
            requiredMark="optional"
            initialValues={draft}
            onValuesChange={handleValuesChange}
          >
            <Alert
              type="info"
              showIcon
              message={mode === 'input-to-output'
                ? '设置生产投入参数，保存后用于产量预测。'
                : '设置目标产品与目标产量，保存后用于投料反算。'}
            />

            <Form.Item name="mode" hidden />
            <div className="material-parameter-context">
              <div className="material-parameter-context__field material-parameter-context__field--mode">
                <span>测算模式</span>
                <Segmented
                  block
                  value={mode}
                  options={modeOptions}
                  onChange={(value) => void handleModeChange(value as SolveMode)}
                />
              </div>
              <div className="material-parameter-context__field">
                <span>生产路线</span>
                <Form.Item name="route" noStyle>
                  <Select
                    options={[
                      { value: 'MXX', label: 'MXX' },
                      { value: 'LDX', label: 'L/DX' }
                    ]}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </div>
            </div>

            <TemplateToolbar
              templates={templates}
              loading={templatesLoading}
              selectedTemplateId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
              onLoad={handleLoadTemplate}
              onSaveAs={() => void openCreateTemplate()}
              onManage={() => setManagerOpen(true)}
            />

            <div className="material-parameter-form-section">
              <div className="material-parameter-form-section__title">
                {mode === 'input-to-output' ? '生产投入数据' : '目标产量设置'}
              </div>
              {mode === 'input-to-output' ? <ProductionInputForm /> : <TargetOutputForm />}
            </div>
          </Form>
        </Spin>
      </Modal>

      <TemplateManagerDrawer
        open={managerOpen}
        zIndex={TEMPLATE_MANAGER_DRAWER_Z_INDEX}
        templates={templates}
        loading={templatesLoading}
        onClose={() => setManagerOpen(false)}
        onRefresh={() => void loadTemplates()}
        onEdit={(template) => {
          setEditingTemplate(template)
          setEditorOpen(true)
        }}
        onCopy={(template) => void handleCopyTemplate(template)}
        onDelete={(template) => void handleDeleteTemplate(template)}
      />

      <TemplateEditorModal
        open={editorOpen}
        zIndex={TEMPLATE_EDITOR_MODAL_Z_INDEX}
        draft={draft}
        template={editingTemplate}
        saving={templateSaving}
        onCancel={() => {
          setEditorOpen(false)
          setEditingTemplate(null)
        }}
        onSubmit={handleTemplateSubmit}
      />
    </>
  )
}
