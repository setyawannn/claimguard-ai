import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/antrean')({
  component: AntreanLayout,
})

function AntreanLayout() {
  return <Outlet />
}
