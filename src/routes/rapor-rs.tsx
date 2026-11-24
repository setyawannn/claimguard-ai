import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rapor-rs')({
  component: RaporRsLayout,
})

function RaporRsLayout() {
  return <Outlet />
}
