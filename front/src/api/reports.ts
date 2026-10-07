import type { ScheduleReportField } from '../types'

const REPORT_API_BASE_URL = import.meta.env.VITE_REPORT_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? ''

type BackendReportResponse<T> = {
  success?: boolean
  code?: string | number
  message?: string
  data?: T
}

export type HistoryReportFile = {
  reportName: string
  fileName: string
  updatedAt?: string
  size?: number
}

export async function listHistoryReportsApi() {
  const response = await fetch(`${REPORT_API_BASE_URL}/api/reports/list`)
  const result = (await response.json().catch(() => ({}))) as BackendReportResponse<HistoryReportFile[]>

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `HTTP_${response.status}`)
  }
  return result.data ?? []
}

export function getHistoryReportOpenUrl(fileName: string) {
  return `${REPORT_API_BASE_URL}/api/reports/files/${encodeURIComponent(fileName)}`
}

async function downloadBlobResponse(response: Response, fallbackFileName: string) {
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result.message || `HTTP_${response.status}`)
  }

  const blob = await response.blob()
  const fileName = getDownloadFileName(response.headers.get('Content-Disposition'), fallbackFileName)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function getDownloadFileName(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) {
    return fallback
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return plainMatch?.[1] || fallback
}

export async function downloadScheduleReportApi(planId: number | string) {
  const response = await fetch(`${REPORT_API_BASE_URL}/api/reports/schedule/${encodeURIComponent(String(planId))}`)
  return downloadBlobResponse(response, `schedule-report-${planId}.xlsx`)
}

export async function listScheduleReportFieldsApi() {
  const response = await fetch(`${REPORT_API_BASE_URL}/api/reports/schedule/fields`)
  const result = (await response.json().catch(() => ({}))) as BackendReportResponse<ScheduleReportField[]>

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `HTTP_${response.status}`)
  }
  return result.data ?? []
}

export async function downloadCustomScheduleReportApi(planId: number | string, fields: string[]) {
  const response = await fetch(
    `${REPORT_API_BASE_URL}/api/reports/schedule/${encodeURIComponent(String(planId))}/custom`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    }
  )
  return downloadBlobResponse(response, `schedule-report-${planId}-custom.xlsx`)
}
