import { z } from 'zod'

export const userRoleSchema = z.enum([
  'verifikator',
  'auditor_wilayah',
  'kepala_cabang',
])
export type UserRole = z.infer<typeof userRoleSchema>

export const sessionUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: userRoleSchema,
  unitName: z.string().min(1),
  branchCode: z.string().min(1),
  title: z.string().min(1),
})
export type SessionUser = z.infer<typeof sessionUserSchema>

export const switchRoleInputSchema = z.object({
  role: userRoleSchema,
})

export const PERSONA_BY_ROLE: Record<UserRole, SessionUser> = {
  verifikator: {
    id: 'usr-mas-rian',
    name: 'Mas Rian',
    role: 'verifikator',
    unitName: 'KC Malang',
    branchCode: 'KC-MLG',
    title: 'Verifikator Klaim Cabang',
  },
  auditor_wilayah: {
    id: 'usr-ibu-anita',
    name: 'Ibu Anita',
    role: 'auditor_wilayah',
    unitName: 'Divre Jatim',
    branchCode: 'DIVRE-JTM',
    title: 'Pengawas Anti-Fraud Wilayah',
  },
  kepala_cabang: {
    id: 'usr-pak-rudi',
    name: 'Pak Rudi',
    role: 'kepala_cabang',
    unitName: 'KC Malang',
    branchCode: 'KC-MLG',
    title: 'Kepala Kantor Cabang',
  },
}
