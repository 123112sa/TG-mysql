import type { AuthResult, AuthUser } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`
}

type RequestPayload = Record<string, unknown>

type BackendAuthResponse = {
  code?: string | number
  success?: boolean
  message?: string
  data?: {
    user?: AuthUser
    token?: string
  }
  user?: AuthUser
  token?: string
}

const SUCCESS_CODES = new Set([0, 200, '0', '200', 'SUCCESS', 'OK'])
const ACCOUNT_NOT_FOUND_CODES = new Set(['ACCOUNT_NOT_FOUND', 'USER_NOT_FOUND', 'USERNAME_NOT_FOUND'])
const PASSWORD_ERROR_CODES = new Set(['PASSWORD_ERROR', 'INVALID_PASSWORD', 'WRONG_PASSWORD'])
const ACCOUNT_EXISTS_CODES = new Set(['ACCOUNT_EXISTS', 'USER_ALREADY_EXISTS', 'USERNAME_EXISTS'])

async function postAuth<T extends BackendAuthResponse>(
  url: string,
  payload: RequestPayload
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = (await response.json().catch(() => ({}))) as T

  if (!response.ok && data.code === undefined && data.success === undefined) {
    throw new Error(`HTTP_${response.status}`)
  }

  return data
}

function extractUser(result: BackendAuthResponse, fallbackUsername: string): AuthUser {
  const user = result.data?.user ?? result.user ?? { username: fallbackUsername }
  const token = result.data?.token ?? result.token

  return {
    ...user,
    username: user.username || fallbackUsername,
    token: user.token ?? token
  }
}

function normalizeLoginResult(result: BackendAuthResponse, username: string): AuthResult {
  if (result.success === true || SUCCESS_CODES.has(result.code ?? '')) {
    return {
      status: 'success',
      message: result.message || '登录成功',
      user: extractUser(result, username),
      raw: result
    }
  }

  if (ACCOUNT_NOT_FOUND_CODES.has(String(result.code ?? ''))) {
    return {
      status: 'account_not_found',
      message: result.message || '账号不存在',
      raw: result
    }
  }

  if (PASSWORD_ERROR_CODES.has(String(result.code ?? ''))) {
    return {
      status: 'password_error',
      message: result.message || '密码错误',
      raw: result
    }
  }

  return {
    status: 'server_error',
    message: result.message || '登录失败，请稍后重试',
    raw: result
  }
}

function normalizeRegisterResult(result: BackendAuthResponse): AuthResult {
  if (result.success === true || SUCCESS_CODES.has(result.code ?? '')) {
    return {
      status: 'register_success',
      message: result.message || '注册成功',
      raw: result
    }
  }

  if (ACCOUNT_EXISTS_CODES.has(String(result.code ?? ''))) {
    return {
      status: 'account_exists',
      message: result.message || '账号已存在',
      raw: result
    }
  }

  return {
    status: 'server_error',
    message: result.message || '注册失败，请稍后重试',
    raw: result
  }
}

export async function loginApi(username: string, password: string): Promise<AuthResult> {
  try {
    const result = await postAuth<BackendAuthResponse>(AUTH_ENDPOINTS.login, {
      username,
      password
    })

    return normalizeLoginResult(result, username)
  } catch (error) {
    return {
      status: 'server_error',
      message: error instanceof Error ? `登录请求失败：${error.message}` : '登录请求失败',
      raw: error
    }
  }
}

export async function registerApi(username: string, password: string): Promise<AuthResult> {
  try {
    const result = await postAuth<BackendAuthResponse>(AUTH_ENDPOINTS.register, {
      username,
      password
    })

    return normalizeRegisterResult(result)
  } catch (error) {
    return {
      status: 'server_error',
      message: error instanceof Error ? `注册请求失败：${error.message}` : '注册请求失败',
      raw: error
    }
  }
}

export { AUTH_ENDPOINTS }
