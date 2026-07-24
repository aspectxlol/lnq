import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'

export const Route = createFileRoute('/auth/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const rememberMeInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const email = emailInputRef.current?.value
    const password = passwordInputRef.current?.value
    const rememberMe = rememberMeInputRef.current?.checked

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
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
            <Input type="email" id="email" name="email" className="w-full" />
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
            />
          </div>

          <div className="flex items-center gap-2 my-2">
            <Input
              type="checkbox"
              id="remember"
              name="remember"
              className="h-4 w-4 rounded border border-input bg-background text-primary"
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground">
              Remember me
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Log In
          </Button>
        </div>
      </form>
    </div>
  )
}
