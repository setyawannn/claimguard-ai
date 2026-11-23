import { z } from 'zod'

export const userRoleSchema = z.enum([
  'verifikator',
  'auditor_wilayah',
  'kepala_cabang',
])
export type UserRole = z.infer<typeof userRoleSchema>

export const sessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: userRoleSchema,
  unitName: z.string().min(1),
  branchCode: z.string().min(1),
  title: z.string().min(1),
})
export type SessionUser = z.infer<typeof sessionUserSchema>

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
})
export type LoginInput = z.infer<typeof loginInputSchema>
