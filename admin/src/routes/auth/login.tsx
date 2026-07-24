import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/auth/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const rememberMeInputRef = useRef<HTMLInputElement>(null)
  const [setHighlightEmail, setSetHighlightEmail] = useState(false)

  function clearAuthStorage() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  function handleSubmit(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()

    const email = emailInputRef.current?.value
    const password = passwordInputRef.current?.value
    const rememberMe = rememberMeInputRef.current?.checked

    if (!email || !password) {
      // toast.error('Please enter both email and password.')
      toast.custom(() => (
        <div className="rounded-lg bg-red-500 p-4 text-white">
          Please enter both email and password.
        </div>
      ))
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      setSetHighlightEmail(true)
      // toast.error('Please enter a valid email address.')
      toast.custom(() => (
        <div className="rounded-lg bg-red-500 p-4 text-white">
          Please enter a valid email address.
        </div>
      ))
      return
    } else {
      setSetHighlightEmail(false)
    }

    fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Login failed. Please try again.')
        }

        return data
      })
      .then((data) => {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        localStorage.setItem('user', JSON.stringify(data.user))

        toast.custom(() => (
          <div className="rounded-lg bg-green-500 p-4 text-white">
            Login successful! Redirecting...
          </div>
        ))

        window.location.href = '/'
      })
      .catch((error) => {
        toast.custom(() => (
          <div className="rounded-lg bg-red-500 p-4 text-white">
            {error.message || 'Login failed. Please try again.'}
            {/* An error occurred. Please try again later. */}
          </div>
        ))
      })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 w-full max-w-md text-center sm:mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Admin Portal</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Please log in to access the admin panel.
        </p>
      </div>

      <form className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:gap-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium sm:text-base">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              className={`w-full ${setHighlightEmail ? 'border-red-500' : ''}`}
              ref={emailInputRef}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium sm:text-base"
            >
              Password
            </Label>
            <Input
              type="password"
              id="password"
              name="password"
              className="w-full"
              ref={passwordInputRef}
            />
          </div>

          <div className="flex items-center gap-2 my-2">
            <Input
              type="checkbox"
              id="remember"
              name="remember"
              className="h-4 w-4 rounded border border-input bg-background text-primary"
              ref={rememberMeInputRef}
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground">
              Remember me
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={(event) => handleSubmit(event)}
          >
            Log In
          </Button>
        </div>
      </form>
    </div>
  )
}
