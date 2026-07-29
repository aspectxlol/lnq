import { createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { createAuthGuard } from '#/lib/auth'
import { toast } from 'sonner'

const adminGuard = createAuthGuard({
  allowedRoles: ['STAFF', 'ADMIN', 'OWNER'],
  loginPath: '/auth/login',
  blockedPath: '/ur-lost-lol',
})

export const Route = createFileRoute('/')({
  component: Home,
  beforeLoad: adminGuard,
})

function Home() {
  async function handleLogout() {
    const refreshToken = localStorage.getItem('refreshToken')

    try {
      await fetch('http://localhost:3001/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })
    } catch {
      // ignore and still clear local state
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('rememberMe')
      toast.success('You have been logged out.')
      window.location.href = '/auth/login'
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Welcome to the admin dashboard</h1>
      <p className="text-sm text-muted-foreground">
        You are signed in as{' '}
        {localStorage.getItem('user') &&
          JSON.parse(localStorage.getItem('user')!).firstName}{' '}
        and can now log out from here.
      </p>
      <Button onClick={handleLogout}>Log Out</Button>
    </div>
  )
}

// Proactive refresh of access token every 5 minutes
// on 401 check if refresh is available and refresh access token
