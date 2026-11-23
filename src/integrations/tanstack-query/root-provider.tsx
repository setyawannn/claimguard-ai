import { createAppQueryClient } from '#/queries/query-client'

export function getContext() {
  const queryClient = createAppQueryClient()

  return {
    queryClient,
  }
}

export default function TanstackQueryProvider() {}
