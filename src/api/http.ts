import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/ui/toast'
import type { ApiResponse, AuthResponse, RefreshTokenRequest } from '@/api/types'

const ENV_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
/**
 * Resolve the API base URL.
 * - Dev: relative URL so requests hit the Vite proxy toward the backend.
 * - Prod: same-origin relative URL by default (the backend is served on the
 *   same origin via Caddy); override with VITE_API_BASE_URL when the API
 *   lives on a different origin.
 */
export const BASE_URL = ENV_BASE?.length ? ENV_BASE : ''

/** Bare client used ONLY for token refresh, so the interceptors never recurse. */
const refreshClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
})

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/** Normalized app error surfaced to pages and error handlers. */
export class ApiError<T = unknown> extends Error {
  code: number
  data: T | undefined
  constructor(code: number, message: string, data?: T) {
    super(message || `请求失败（${code}）`)
    this.name = 'ApiError'
    this.code = code
    this.data = data
  }
}

/* ------------------------------ request interceptor ------------------------------ */

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/* ------------------------------ token refresh flow ------------------------------ */

let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

function flushQueue(token: string) {
  pendingQueue.forEach((cb) => cb(token))
  pendingQueue = []
}

/** Requests a fresh token pair and updates the persisted store. */
async function refreshTokens(): Promise<string> {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState()
  if (!refreshToken) {
    throw new ApiError(401, '登录已过期，请重新登录')
  }
  const { data } = await refreshClient.post<ApiResponse<AuthResponse>, AxiosResponse<ApiResponse<AuthResponse>>, RefreshTokenRequest>(
    '/admin/v1/auth/refresh',
    { refreshToken }
  )
  const body = data
  if (!body || body.code !== 200 || !body.data) {
    clearAuth()
    throw new ApiError(body?.code || 401, body?.message || '刷新登录状态失败')
  }
  setTokens(body.data.accessToken, body.data.refreshToken)
  return body.data.accessToken
}

/** Clears credentials; guards react by redirecting to /login. */
function forceLogout() {
  useAuthStore.getState().clearAuth()
}

/** Extract a human-readable message from an axios error. */
function extractMessage(error: AxiosError<ApiResponse<unknown>>): string {
  const body = error.response?.data
  if (body && typeof body === 'object' && 'message' in body && body.message) {
    return body.message
  }
  return error.message || '请求失败'
}

/* ------------------------------ response interceptor ------------------------------ */

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status
    const config = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    const refreshRequesting =
      (config?.url ?? '').includes('/auth/refresh')

    if (status === 401) {
      // Never try to recover a login or refresh request with another refresh.
      const wasLogin = (config?.url ?? '').includes('/auth/login')
      const alreadyRetried = config?._retry
      if (wasLogin || refreshRequesting || alreadyRetried) {
        forceLogout()
        return Promise.reject(error)
      }

      const { refreshToken } = useAuthStore.getState()
      if (!refreshToken) {
        forceLogout()
        return Promise.reject(error)
      }

      try {
        const retryOriginal = async () => {
          const token = isRefreshing
            ? await new Promise<string>((resolve) => pendingQueue.push((t) => resolve(t)))
            : refreshTokens()
          if (config) {
            config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
            // prevent loops on this request
            config._retry = true
            return http.request(config)
          }
          return Promise.reject(error)
        }

        if (!isRefreshing) {
          isRefreshing = true
          try {
            const token = await refreshTokens()
            flushQueue(token)
            if (config) {
              config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
              config._retry = true
              return http.request(config)
            }
            return Promise.reject(error)
          } catch (refreshError) {
            pendingQueue = []
            forceLogout()
            return Promise.reject(refreshError)
          } finally {
            isRefreshing = false
          }
        }

        return retryOriginal()
      } catch (err) {
        forceLogout()
        return Promise.reject(err)
      }
    }

    if (refreshRequesting) {
      return Promise.reject(error)
    }

    // Unified, non-silent error feedback for the remaining cases.
    const message = extractMessage(error)
    if (error.code === 'ECONNABORTED') {
      toast('请求超时', { variant: 'warning', description: '网络较慢，请稍后重试' })
    } else if (error.message?.toLowerCase().includes('network') || error.code === 'ERR_NETWORK') {
      toast('网络连接失败', { variant: 'warning', description: '无法连接到服务器，请检查网络' })
    } else if (status && status >= 500) {
      toast('服务器异常', { variant: 'error', description: message })
    } else if (status) {
      toast('请求失败', { variant: 'error', description: message })
    }
    return Promise.reject(error)
  }
)

/* ------------------------------ typed request helper ------------------------------ */

/**
 * Perform a request and unwrap the backend `data` payload.
 * Rejects with {@link ApiError} for any non-200 business code.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiResponse<T>>(config)
  const payload = response.data
  if (!payload || typeof payload !== 'object' || !('code' in payload)) {
    return payload as unknown as T
  }
  if (payload.code === 200) {
    return payload.data
  }
  throw new ApiError<T>(payload.code, payload.message, payload.data)
}

export { http }
export type { InternalAxiosRequestConfig }