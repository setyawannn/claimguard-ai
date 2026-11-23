import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { TopNavbar } from '#/components/layout/TopNavbar'
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
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Cascadia+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { data: user } = useSuspenseQuery(sessionQueryOptions())

  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-[var(--color-bg-canvas)] font-sans text-[var(--color-text-primary)] antialiased [overflow-wrap:anywhere]">
        <TopNavbar user={user} />
        <main className="mx-auto max-w-[1440px] px-6 py-6">{children}</main>
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
