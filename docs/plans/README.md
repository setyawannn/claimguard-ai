# Daftar Plan Implementasi (`docs/plans/`)

Ringkasan status seluruh rencana teknis aplikasi **ClaimGuard AI** (`claimguard-ai-app`).

| No | Plan | Status | Ringkasan & Artefak Utama |
|---|---|---|---|
| 01 | [01-database-d1-plan.md](./01-database-d1-plan.md) | **Selesai** | Pembuatan Cloudflare D1 `claimguard-db` (APAC), `wrangler.jsonc`, skema 9 tabel `src/db/schema.ts`, `d1-guard.ts` (95% circuit breaker), migrasi `drizzle/0000_burly_talos.sql` (terapkan lokal & remote), dan verifikasi `d1-guard.check.ts`. |
| 02 | [02-design-tokens-and-utils-plan.md](./02-design-tokens-and-utils-plan.md) | **Selesai** | Token FigCraft (82 variable, 7 text style) diterapkan ke `src/styles.css` & `src/routes/__root.tsx`; seluruh utilitas `src/lib/` (`format`, `status-tokens`, `scoring`, `privacy`, `image-compressor`, `domain.check.ts`) lolos self-check & typecheck. |
| 03 | [03-folder-architecture-and-standards-plan.md](./03-folder-architecture-and-standards-plan.md) | **Selesai** | Starter demo dibersihkan; kontrak Zod `src/schemas/`, `createAppQueryClient()` ramah kuota D1 + `queryKeys`, RBAC `auth.guard.ts` + `session.fn.ts`, `TopNavbar` 3-peran, komponen shared (`StatusBadge`, `RiskScoreBadge`, `QuotaErrorBanner`, `EmptyState`), dan `bunx tsc --noEmit` + `bun run build` lulus 100%. |

---

## Konvensi Penamaan & Pembaruan

1. Setiap dokumen rencana fase baru wajib diletakkan di `docs/plans/<NN>-<nama-plan>.md`.
2. Status di tabel atas (`Belum Dikerjakan` → `Sedang Dikerjakan` → `Selesai`) wajib diperbarui setiap kali sebuah fase selesai dieksekusi dan diverifikasi.
