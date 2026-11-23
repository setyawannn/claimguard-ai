import type { ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { useSuspenseQuery, type QueryClient } from '@tanstack/react-query'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { AppShell } from '#/components/layout/AppShell'
import {
  RootErrorFallback,
  RootNotFound,
} from '#/components/layout/RouteFallbacks'
import { Toaster } from '#/components/ui/sonner'
import { sessionQueryOptions } from '#/queries/session.queries'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(sessionQueryOptions())
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ClaimGuard AI — Pengawasan Klaim FKRTL BPJS Kesehatan' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: RootNotFound,
  errorComponent: RootErrorFallback,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-[var(--color-bg-canvas)] font-sans text-[var(--color-text-primary)] antialiased [overflow-wrap:anywhere]">
        {children}
        <Toaster position="top-right" richColors />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const { data: user } = useSuspenseQuery(sessionQueryOptions())
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  if (pathname === '/login' || !user) {
    return <Outlet />
  }

  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  )
}
