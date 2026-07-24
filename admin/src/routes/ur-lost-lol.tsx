import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/ur-lost-lol')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-lg">
        <h1 className="text-3xl font-semibold">Admin access required</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          This area is reserved for admin staff only. If you were looking for
          the public app, visit{' '}
          <a
            href="https://jadohawodahi.com"
            className="font-semibold text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            jadohawodahi.com
          </a>
          .
        </p>
        <p className="mt-4 text-sm text-secondary">
          If you believe this is a mistake, please contact your administrator.
        </p>
      </div>
    </div>
  )
}
