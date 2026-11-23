import { z } from 'zod'

const serverEnvSchema = z.object({
  UUPDP_HASH_SALT: z.string().min(8).default('claimguard-uupdp-v1'),
  GEMINI_API_KEY: z.string().optional(),
  VITE_CDN_BASE_URL: z
    .string()
    .url()
    .default('https://cdn.claimguard.setyawannn.site'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseServerEnv(rawEnv: Record<string, unknown>): ServerEnv {
  return serverEnvSchema.parse(rawEnv)
}
