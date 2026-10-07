import type {
  PlanScheduleInput,
  ScheduleConstraintField,
  ScheduleConstraintPreviewInput,
  ScheduleConstraintPreviewResult,
  ScheduleOptimizeResult,
  SchedulePlan,
  ScheduleResultValidationResult
} from '../types'

const SCHEDULE_API_BASE_URL = import.meta.env.VITE_SCHEDULE_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? ''

type BackendScheduleResponse<T> = {
  success?: boolean
  code?: string | number
  message?: string
  data?: T
}

const SCHEDULE_SUCCESS_CODES = new Set([0, 200, '0', '200', 'SUCCESS', 'OK'])

async function postScheduleRequest<TResponseData, TPayload>(
  url: string,
  payload: TPayload
): Promise<TResponseData> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const result = (await response.json().catch(() => ({}))) as BackendScheduleResponse<TResponseData>

  if (!response.ok && result.code === undefined && result.success === undefined) {
    throw new Error(`HTTP_${response.status}`)
  }

  if (result.success === false || (result.code !== undefined && !SCHEDULE_SUCCESS_CODES.has(result.code))) {
    throw new Error(result.message || '多负荷优化接口调用失败')
  }

  return (result.data ?? result) as TResponseData
}

async function getScheduleRequest<TResponseData>(url: string): Promise<TResponseData> {
  const response = await fetch(url)
  const result = (await response.json().catch(() => ({}))) as BackendScheduleResponse<TResponseData>

  if (!response.ok && result.code === undefined && result.success === undefined) {
    throw new Error(`HTTP_${response.status}`)
  }

  if (result.success === false || (result.code !== undefined && !SCHEDULE_SUCCESS_CODES.has(result.code))) {
    throw new Error(result.message || '多负荷优化接口调用失败')
  }

  return (result.data ?? result) as TResponseData
}

async function deleteScheduleRequest<TResponseData>(url: string): Promise<TResponseData> {
  const response = await fetch(url, {
    method: 'DELETE'
  })
  const result = (await response.json().catch(() => ({}))) as BackendScheduleResponse<TResponseData>

  if (!response.ok && result.code === undefined && result.success === undefined) {
    throw new Error(`HTTP_${response.status}`)
  }

  if (result.success === false || (result.code !== undefined && !SCHEDULE_SUCCESS_CODES.has(result.code))) {
    throw new Error(result.message || '多负荷优化接口调用失败')
  }

  return (result.data ?? result) as TResponseData
}

export async function optimizeScheduleApi(payload: PlanScheduleInput) {
  return postScheduleRequest<ScheduleOptimizeResult, PlanScheduleInput>(
    `${SCHEDULE_API_BASE_URL}/api/schedule/optimize`,
    payload
  )
}

export async function listSchedulePlansApi() {
  return getScheduleRequest<SchedulePlan[]>(`${SCHEDULE_API_BASE_URL}/api/schedule/plans`)
}

export async function getSchedulePlanApi(planId: number | string) {
  return getScheduleRequest<ScheduleOptimizeResult>(
    `${SCHEDULE_API_BASE_URL}/api/schedule/plans/${encodeURIComponent(String(planId))}`
  )
}

export async function deleteSchedulePlanApi(planId: number | string) {
  return deleteScheduleRequest<{ id: number | string }>(
    `${SCHEDULE_API_BASE_URL}/api/schedule/plans/${encodeURIComponent(String(planId))}`
  )
}

export async function listScheduleConstraintFieldsApi() {
  return getScheduleRequest<ScheduleConstraintField[]>(`${SCHEDULE_API_BASE_URL}/api/schedule/constraint-fields`)
}

export async function previewScheduleConstraintsApi(payload: ScheduleConstraintPreviewInput) {
  return postScheduleRequest<ScheduleConstraintPreviewResult, ScheduleConstraintPreviewInput>(
    `${SCHEDULE_API_BASE_URL}/api/schedule/constraint-preview`,
    payload
  )
}

export async function validateScheduleResultApi(planId: number | string) {
  return postScheduleRequest<ScheduleResultValidationResult, Record<string, never>>(
    `${SCHEDULE_API_BASE_URL}/api/schedule/plans/${encodeURIComponent(String(planId))}/validation`,
    {}
  )
}
