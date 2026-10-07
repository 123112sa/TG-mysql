import type { NpimsComponentRenamePatch, NpimsProjectFile } from '../utils/npimsProject'

const PROJECT_API_BASE_URL = import.meta.env.VITE_PROJECT_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? ''

type BackendProjectResponse<T> = {
  success?: boolean
  code?: string | number
  message?: string
  data?: T
}

const PROJECT_SUCCESS_CODES = new Set([0, 200, '0', '200', 'SUCCESS', 'OK'])

export type ProjectLibraryFile = {
  projectName: string
  embeddedProjectName?: string
  fileName: string
  savedAt?: string
  updatedAt?: string
  size?: number
}

export type SaveProjectPayload = {
  project: NpimsProjectFile
}

export type OpenProjectPayload = {
  projectName: string
}

export type DeleteProjectPayload = {
  projectName: string
}

export type RenameProjectPayload = {
  project: NpimsProjectFile
  patches: NpimsComponentRenamePatch[]
}

async function postProjectRequest<TResponseData, TPayload>(
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

  const result = (await response.json().catch(() => ({}))) as BackendProjectResponse<TResponseData>

  if (!response.ok && result.code === undefined && result.success === undefined) {
    throw new Error(`HTTP_${response.status}`)
  }

  if (result.success === false || (result.code !== undefined && !PROJECT_SUCCESS_CODES.has(result.code))) {
    throw new Error(result.message || '工程接口调用失败')
  }

  return (result.data ?? result) as TResponseData
}

export async function saveProjectApi(payload: SaveProjectPayload) {
  return postProjectRequest<ProjectLibraryFile, SaveProjectPayload>(`${PROJECT_API_BASE_URL}/api/projects/save`, payload)
}

export async function listProjectFilesApi() {
  return postProjectRequest<ProjectLibraryFile[], Record<string, never>>(
    `${PROJECT_API_BASE_URL}/api/projects/list`,
    {}
  )
}

export async function openProjectApi(payload: OpenProjectPayload) {
  return postProjectRequest<NpimsProjectFile, OpenProjectPayload>(
    `${PROJECT_API_BASE_URL}/api/projects/open`,
    payload
  )
}

export async function deleteProjectApi(payload: DeleteProjectPayload) {
  return postProjectRequest<unknown, DeleteProjectPayload>(
    `${PROJECT_API_BASE_URL}/api/projects/delete`,
    payload
  )
}

export async function renameProjectComponentsApi(payload: RenameProjectPayload) {
  return postProjectRequest<NpimsProjectFile, RenameProjectPayload>(
    `${PROJECT_API_BASE_URL}/api/projects/rename-components`,
    payload
  )
}
