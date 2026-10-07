import { create } from 'zustand'
import {
  copyMaterialParameterTemplateApi,
  createMaterialParameterTemplateApi,
  deleteMaterialParameterTemplateApi,
  getCurrentMaterialParametersApi,
  listMaterialParameterTemplatesApi,
  saveCurrentMaterialParametersApi,
  updateMaterialParameterTemplateApi
} from '../api/materialCalculation'
import {
  createMaterialCalculationStoreState,
  type MaterialCalculationServices,
  type MaterialCalculationStore
} from './materialCalculationStoreCore'

const services: MaterialCalculationServices = {
  getCurrent: getCurrentMaterialParametersApi,
  saveCurrent: saveCurrentMaterialParametersApi,
  listTemplates: listMaterialParameterTemplatesApi,
  createTemplate: createMaterialParameterTemplateApi,
  updateTemplate: updateMaterialParameterTemplateApi,
  copyTemplate: copyMaterialParameterTemplateApi,
  deleteTemplate: deleteMaterialParameterTemplateApi
}

export const useMaterialCalculationStore = create<MaterialCalculationStore>()(
  createMaterialCalculationStoreState(services)
)

export type { MaterialCalculationServices, MaterialCalculationStore } from './materialCalculationStoreCore'
export { createMaterialCalculationStore } from './materialCalculationStoreCore'
