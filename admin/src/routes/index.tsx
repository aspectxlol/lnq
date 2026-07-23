import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="">
      <h1 className="">Welcome to TanStack Start</h1>
      <p className="">
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
    </div>
  )
}
