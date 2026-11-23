import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { hashPassword } from '../server/auth/password'

interface SeedPersona {
  id: string
  email: string
  name: string
  role: 'verifikator' | 'auditor_wilayah' | 'kepala_cabang'
  unitName: string
  branchCode: string
  title: string
}

const DEFAULT_PERSONAS: readonly SeedPersona[] = [
  {
    id: 'usr-mas-rian',
    email: 'rian@claimguard.id',
    name: 'Mas Rian',
    role: 'verifikator',
    unitName: 'KC Malang',
    branchCode: 'KC-MLG',
    title: 'Verifikator Klaim Cabang',
  },
  {
    id: 'usr-ibu-anita',
    email: 'anita@claimguard.id',
    name: 'Ibu Anita',
    role: 'auditor_wilayah',
    unitName: 'Divre Jatim',
    branchCode: 'DIVRE-JTM',
    title: 'Pengawas Anti-Fraud Wilayah',
  },
  {
    id: 'usr-pak-rudi',
    email: 'rudi@claimguard.id',
    name: 'Pak Rudi',
    role: 'kepala_cabang',
    unitName: 'KC Malang',
    branchCode: 'KC-MLG',
    title: 'Kepala Kantor Cabang',
  },
]

function sqlQuote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

async function generateSeedSql() {
  const statements: string[] = []
  for (const persona of DEFAULT_PERSONAS) {
    const passwordHash = await hashPassword('ClaimGuard2026!')
    statements.push(
      `INSERT INTO users (id, email, password_hash, name, role, unit_name, branch_code, title) VALUES (${sqlQuote(persona.id)}, ${sqlQuote(persona.email)}, ${sqlQuote(passwordHash)}, ${sqlQuote(persona.name)}, ${sqlQuote(persona.role)}, ${sqlQuote(persona.unitName)}, ${sqlQuote(persona.branchCode)}, ${sqlQuote(persona.title)}) ON CONFLICT(id) DO UPDATE SET email=excluded.email, password_hash=excluded.password_hash, name=excluded.name, role=excluded.role, unit_name=excluded.unit_name, branch_code=excluded.branch_code, title=excluded.title;`,
    )
  }

  const outPath = resolve(process.cwd(), 'drizzle/seed-auth.sql')
  writeFileSync(outPath, `${statements.join('\n')}\n`, 'utf8')
  console.log(`Generated ${DEFAULT_PERSONAS.length} auth personas -> ${outPath}`)
}

await generateSeedSql()
