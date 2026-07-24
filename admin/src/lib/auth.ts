import { redirect } from '@tanstack/react-router'

export interface AuthGuardOptions {
  publicPaths?: string[]
  allowedRoles?: string[]
  loginPath?: string
  blockedPath?: string
  refreshUrl?: string
}

const defaultPublicPaths = ['/auth/login', '/auth/invite', '/ur-lost-lol']
const defaultAllowedRoles = ['STAFF', 'ADMIN', 'OWNER']
const defaultLoginPath = '/auth/login'
const defaultBlockedPath = '/ur-lost-lol'
const defaultRefreshUrl = 'http://localhost:3001/auth/refresh'

export function clearAuthStorage() {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  localStorage.removeItem('rememberMe')
}

function isTokenExpired(token: string | null) {
  if (!token) {
    return true
  }

  try {
    const parts = token.split('.')
    if (parts.length < 2) {
      return true
    }

    const [, payload] = parts
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decodedPayload = JSON.parse(atob(normalizedPayload)) as {
      exp?: number
    }

    if (typeof decodedPayload.exp !== 'number') {
      return false
    }

    return Date.now() >= decodedPayload.exp * 1000
  } catch {
    return false
  }
}

export function createAuthGuard(options: AuthGuardOptions = {}) {
  const publicPaths = options.publicPaths ?? defaultPublicPaths
  const allowedRoles = options.allowedRoles ?? defaultAllowedRoles
  const loginPath = options.loginPath ?? defaultLoginPath
  const blockedPath = options.blockedPath ?? defaultBlockedPath
  const refreshUrl = options.refreshUrl ?? defaultRefreshUrl

  return async ({ location }: { location: { pathname: string } }) => {
    if (typeof window === 'undefined') {
      return
    }

    const isPublicRoute = publicPaths.some(
      (path) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`),
    )

    if (isPublicRoute) {
      return
    }

    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const rememberMe = localStorage.getItem('rememberMe') === 'true'
    const storedUser = localStorage.getItem('user')
    const userRole = storedUser ? JSON.parse(storedUser).role : null
    const isAuthorizedRole = allowedRoles.includes(userRole)

    const redirectUnauthorized = () => {
      clearAuthStorage()
      throw redirect({ to: blockedPath })
    }

    if (accessToken && !isTokenExpired(accessToken)) {
      if (!isAuthorizedRole) {
        redirectUnauthorized()
      }
      return
    }

    if (!refreshToken || !rememberMe) {
      clearAuthStorage()
      throw redirect({ to: loginPath })
    }

    try {
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()

      if (!response.ok || !data?.accessToken) {
        throw new Error(data?.message || 'Unable to refresh session.')
      }

      localStorage.setItem('accessToken', data.accessToken)
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      const refreshedRole = data.user?.role
      const refreshedIsAuthorizedRole = allowedRoles.includes(refreshedRole)

      if (!refreshedIsAuthorizedRole) {
        redirectUnauthorized()
      }
    } catch {
      clearAuthStorage()
      throw redirect({ to: loginPath })
    }
  }
}
