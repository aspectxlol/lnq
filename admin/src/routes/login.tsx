import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <h1>Login</h1>
    <form>
      
    </form>
  </div>
}
