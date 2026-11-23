import type { ReactNode } from 'react'
import type { SessionUser } from '#/schemas/session.schema'
import { TopNavbar } from './TopNavbar'

interface AppShellProps {
  user: SessionUser
  children: ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <TopNavbar user={user} />
      <main className="space-y-6">{children}</main>
    </div>
  )
}
