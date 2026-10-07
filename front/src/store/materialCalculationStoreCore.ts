import type {
  MaterialParameterConfiguration,
  MaterialParameterDraft,
  MaterialParameterTemplate,
  MaterialParameterTemplateInput,
  SolveMode,
  Xh2Route
} from '../types'
import { createStore, type StoreApi } from 'zustand/vanilla'

const emptyInputs = () => ({
  jb: 0,
  mxx: 0,
  ldx: 0,
  ylsn: 0
})

const emptyTarget = () => ({
  productCode: 'TG',
  productName: '硬质糖果成品',
  amount: 0
})

export function createEmptyMaterialDraft(
  mode: SolveMode,
  route: Xh2Route = 'MXX'
): MaterialParameterDraft {
  return mode === 'input-to-output'
    ? { mode, route, inputs: emptyInputs() }
    : { mode, route, target: emptyTarget() }
}

export function cloneMaterialDraft(
  value: MaterialParameterDraft | MaterialParameterConfiguration | MaterialParameterTemplate
): MaterialParameterDraft {
  if (value.mode === 'input-to-output') {
    return {
      mode: value.mode,
      route: value.route,
      inputs: { ...(value.inputs ?? emptyInputs()) }
    }
  }

  return {
    mode: value.mode,
    route: value.route,
    target: { ...(value.target ?? emptyTarget()) }
  }
}

export function clearMaterialDraft(draft: MaterialParameterDraft): MaterialParameterDraft {
  return createEmptyMaterialDraft(draft.mode, draft.route)
}

export function restoreMaterialDraft(
  configuration: MaterialParameterConfiguration
): MaterialParameterDraft {
  return cloneMaterialDraft(configuration)
}

export function materialTemplateNeedsConfirmation(
  draft: MaterialParameterDraft,
  template: MaterialParameterTemplate
) {
  return draft.mode !== template.mode || draft.route !== template.route
}

export function applyTemplateToDraft(
  draft: MaterialParameterDraft,
  template: MaterialParameterTemplate,
  confirmed = false
): { draft: MaterialParameterDraft; requiresConfirmation: boolean } {
  if (materialTemplateNeedsConfirmation(draft, template) && !confirmed) {
    return {
      draft: cloneMaterialDraft(draft),
      requiresConfirmation: true
    }
  }

  return {
    draft: cloneMaterialDraft(template),
    requiresConfirmation: false
  }
}

export type MaterialCalculationServices = {
  getCurrent: (mode: SolveMode) => Promise<MaterialParameterConfiguration>
  saveCurrent: (draft: MaterialParameterDraft) => Promise<MaterialParameterConfiguration>
  listTemplates: () => Promise<MaterialParameterTemplate[]>
  createTemplate: (input: MaterialParameterTemplateInput) => Promise<MaterialParameterTemplate>
  updateTemplate: (
    templateId: number,
    input: MaterialParameterTemplateInput
  ) => Promise<MaterialParameterTemplate>
  copyTemplate: (
    templateId: number,
    input?: { name?: string; description?: string }
  ) => Promise<MaterialParameterTemplate>
  deleteTemplate: (templateId: number) => Promise<unknown>
}

type MaterialCalculationState = {
  mode: SolveMode
  route: Xh2Route
  draft: MaterialParameterDraft
  serverSnapshot: MaterialParameterConfiguration | null
  templates: MaterialParameterTemplate[]
  parametersLoading: boolean
  parametersSaving: boolean
  templatesLoading: boolean
  templateSaving: boolean
  running: boolean
  resultStatus: 'idle' | 'ready' | 'running' | 'success' | 'error'
}

export type MaterialCalculationStore = MaterialCalculationState & {
  setDraft: (draft: MaterialParameterDraft) => void
  setRoute: (route: Xh2Route) => void
  setInputs: (inputs: MaterialParameterDraft['inputs']) => void
  setTarget: (target: MaterialParameterDraft['target']) => void
  setRunning: (running: boolean) => void
  setResultStatus: (status: MaterialCalculationState['resultStatus']) => void
  loadCurrent: (mode?: SolveMode) => Promise<MaterialParameterConfiguration>
  saveCurrent: () => Promise<MaterialParameterConfiguration>
  clearDraft: () => void
  restoreSaved: () => void
  loadTemplates: () => Promise<MaterialParameterTemplate[]>
  createTemplate: (input: MaterialParameterTemplateInput) => Promise<MaterialParameterTemplate>
  updateTemplate: (templateId: number, input: MaterialParameterTemplateInput) => Promise<MaterialParameterTemplate>
  copyTemplate: (templateId: number, input?: { name?: string; description?: string }) => Promise<MaterialParameterTemplate>
  deleteTemplate: (templateId: number) => Promise<void>
  applyTemplate: (
    template: MaterialParameterTemplate,
    confirmed?: boolean
  ) => { requiresConfirmation: boolean }
  reset: () => void
}

const initialDraft = createEmptyMaterialDraft('input-to-output')

const initialState: MaterialCalculationState = {
  mode: 'input-to-output',
  route: 'MXX',
  draft: initialDraft,
  serverSnapshot: null,
  templates: [],
  parametersLoading: false,
  parametersSaving: false,
  templatesLoading: false,
  templateSaving: false,
  running: false,
  resultStatus: 'idle'
}

export const createMaterialCalculationStoreState =
  (services: MaterialCalculationServices) =>
  (
    set: StoreApi<MaterialCalculationStore>['setState'],
    get: StoreApi<MaterialCalculationStore>['getState']
  ): MaterialCalculationStore => ({
    ...initialState,
    setDraft: (draft) => set({ draft: cloneMaterialDraft(draft), mode: draft.mode, route: draft.route }),
    setRoute: (route) => set((state) => ({
      route,
      draft: { ...cloneMaterialDraft(state.draft), route }
    })),
    setInputs: (inputs) => set((state) => ({
      draft: {
        mode: 'input-to-output',
        route: state.route,
        inputs: { ...(inputs ?? emptyInputs()) }
      }
    })),
    setTarget: (target) => set((state) => ({
      draft: {
        mode: 'output-to-input',
        route: state.route,
        target: { ...(target ?? emptyTarget()) }
      }
    })),
    setRunning: (running) => set({ running, resultStatus: running ? 'running' : get().resultStatus }),
    setResultStatus: (resultStatus) => set({ resultStatus }),
    loadCurrent: async (requestedMode) => {
      const mode = requestedMode ?? get().mode
      set({ parametersLoading: true })
      try {
        const configuration = await services.getCurrent(mode)
        set({
          mode: configuration.mode,
          route: configuration.route,
          draft: restoreMaterialDraft(configuration),
          serverSnapshot: configuration,
          resultStatus: 'ready'
        })
        return configuration
      } finally {
        set({ parametersLoading: false })
      }
    },
    saveCurrent: async () => {
      set({ parametersSaving: true })
      try {
        const configuration = await services.saveCurrent(cloneMaterialDraft(get().draft))
        set({
          mode: configuration.mode,
          route: configuration.route,
          draft: restoreMaterialDraft(configuration),
          serverSnapshot: configuration,
          resultStatus: 'ready'
        })
        return configuration
      } finally {
        set({ parametersSaving: false })
      }
    },
    clearDraft: () => set((state) => ({ draft: clearMaterialDraft(state.draft) })),
    restoreSaved: () => {
      const snapshot = get().serverSnapshot
      if (snapshot) {
        set({
          mode: snapshot.mode,
          route: snapshot.route,
          draft: restoreMaterialDraft(snapshot)
        })
      }
    },
    loadTemplates: async () => {
      set({ templatesLoading: true })
      try {
        const templates = await services.listTemplates()
        set({ templates })
        return templates
      } finally {
        set({ templatesLoading: false })
      }
    },
    createTemplate: async (input) => {
      set({ templateSaving: true })
      try {
        const template = await services.createTemplate(input)
        set((state) => ({ templates: [template, ...state.templates] }))
        return template
      } finally {
        set({ templateSaving: false })
      }
    },
    updateTemplate: async (templateId, input) => {
      set({ templateSaving: true })
      try {
        const template = await services.updateTemplate(templateId, input)
        set((state) => ({
          templates: state.templates.map((item) => item.id === templateId ? template : item)
        }))
        return template
      } finally {
        set({ templateSaving: false })
      }
    },
    copyTemplate: async (templateId, input) => {
      set({ templateSaving: true })
      try {
        const template = await services.copyTemplate(templateId, input)
        set((state) => ({ templates: [template, ...state.templates] }))
        return template
      } finally {
        set({ templateSaving: false })
      }
    },
    deleteTemplate: async (templateId) => {
      await services.deleteTemplate(templateId)
      set((state) => ({ templates: state.templates.filter((item) => item.id !== templateId) }))
    },
    applyTemplate: (template, confirmed = false) => {
      const result = applyTemplateToDraft(get().draft, template, confirmed)
      if (!result.requiresConfirmation) {
        set({
          mode: result.draft.mode,
          route: result.draft.route,
          draft: result.draft
        })
      }
      return { requiresConfirmation: result.requiresConfirmation }
    },
    reset: () => set({ ...initialState, draft: createEmptyMaterialDraft('input-to-output') })
  })

export function createMaterialCalculationStore(services: MaterialCalculationServices) {
  return createStore<MaterialCalculationStore>()(createMaterialCalculationStoreState(services))
}
