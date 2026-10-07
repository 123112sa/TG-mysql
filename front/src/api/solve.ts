import type { InputToOutputResult, OutputToInputResult, Xh2Route } from '../types'

const SOLVE_API_BASE_URL = import.meta.env.VITE_SOLVE_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? ''

type BackendSolveResponse<T> = {
  success?: boolean
  code?: string | number
  message?: string
  data?: T
}

const SOLVE_SUCCESS_CODES = new Set([0, 200, '0', '200', 'SUCCESS', 'OK'])

async function postSolveRequest<TResponseData, TPayload>(
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

  const result = (await response.json().catch(() => ({}))) as BackendSolveResponse<TResponseData>

  if (!response.ok && result.code === undefined && result.success === undefined) {
    throw new Error(`HTTP_${response.status}`)
  }

  if (result.success === false || (result.code !== undefined && !SOLVE_SUCCESS_CODES.has(result.code))) {
    throw new Error(result.message || '运算求解接口调用失败')
  }

  return (result.data ?? result) as TResponseData
}

export async function inputToOutputApi(route: Xh2Route) {
  return postSolveRequest<InputToOutputResult, { route: Xh2Route }>(
    `${SOLVE_API_BASE_URL}/api/solve/input-output`,
    { route }
  )
}

export async function outputToInputApi(route: Xh2Route) {
  return postSolveRequest<OutputToInputResult, { route: Xh2Route }>(
    `${SOLVE_API_BASE_URL}/api/solve/output-input`,
    { route }
  )
}
