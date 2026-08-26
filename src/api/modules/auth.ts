import { request } from '@/api/http'
import type { AuthResponse, LoginRequest, RefreshTokenRequest } from '@/api/types'

/** Admin authentication endpoints (AdminAuthController).
 *  POST /admin/v1/auth/login, /refresh */
export const authApi = {
  login(data: LoginRequest) {
    return request<AuthResponse>({ url: '/admin/v1/auth/login', method: 'POST', data })
  },

  refresh(data: RefreshTokenRequest) {
    return request<AuthResponse>({ url: '/admin/v1/auth/refresh', method: 'POST', data })
  },
}