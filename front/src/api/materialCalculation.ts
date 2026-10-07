import type {
  MaterialParameterConfiguration,
  MaterialParameterDraft,
  MaterialParameterTemplate,
  MaterialParameterTemplateInput,
  SolveMode
} from '../types'

const MATERIAL_API_BASE_URL =
  import.meta.env.VITE_MATERIAL_CALCULATION_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? ''

type ApiEnvelope<T> = {
  success?: boolean
  code?: string | number
  message?: string
  data?: T
}

const SUCCESS_CODES = new Set([0, 200, '0', '200', 'SUCCESS', 'OK'])

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const result = (await response.json().catch(() => ({}))) as ApiEnvelope<T>

  if (!response.ok && result.code === undefined && result.success === undefined) {
    throw new Error(`HTTP_${response.status}`)
  }
  if (result.success === false || (result.code !== undefined && !SUCCESS_CODES.has(result.code))) {
    throw new Error(result.message || '物料测算参数接口调用失败')
  }

  return (result.data ?? result) as T
}

const jsonRequest = (method: 'POST' | 'PUT', payload: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})

export function getCurrentMaterialParametersApi(mode: SolveMode) {
  return request<MaterialParameterConfiguration>(
    `${MATERIAL_API_BASE_URL}/api/material-calculation/parameters/current?mode=${encodeURIComponent(mode)}`
  )
}

export function saveCurrentMaterialParametersApi(payload: MaterialParameterDraft) {
  return request<MaterialParameterConfiguration>(
    `${MATERIAL_API_BASE_URL}/api/material-calculation/parameters/current`,
    jsonRequest('PUT', payload)
  )
}

export function listMaterialParameterTemplatesApi() {
  return request<MaterialParameterTemplate[]>(
    `${MATERIAL_API_BASE_URL}/api/material-calculation/templates`
  )
}

export function getMaterialParameterTemplateApi(templateId: number) {
  return request<MaterialParameterTemplate>(
    `${MATERIAL_API_BASE_URL}/api/material-calculation/templates/${templateId}`
  )
}

export function createMaterialParameterTemplateApi(payload: MaterialParameterTemplateInput) {
  return request<MaterialParameterTemplate>(
    `${MATERIAL_API_BASE_URL}/api/material-calculation/templates`,
    jsonRequest('POST', payload)
  )
}

export function updateMaterialParameterTemplateApi(
  templateId: number,
  payload: MaterialParameterTemplateInput
) {
  return request<MaterialParameterTemplate>(
    `${MATERIAL_API_BASE_URL}/api/material-calculation/templates/${templateId}`,
    jsonRequest('PUT', payload)
  )
}

export function copyMaterialParameterTemplateApi(
  templateId: number,
  payload: { name?: string; description?: string } = {}
) {
  return request<MaterialParameterTemplate>(
    `${MATERIAL_API_BASE_URL}/api/material-calculation/templates/${templateId}/copy`,
    jsonRequest('POST', payload)
  )
}

export function deleteMaterialParameterTemplateApi(templateId: number) {
  return request<unknown>(
    `${MATERIAL_API_BASE_URL}/api/material-calculation/templates/${templateId}`,
    { method: 'DELETE' }
  )
}
