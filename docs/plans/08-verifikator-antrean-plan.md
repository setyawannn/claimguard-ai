# Plan 08 — Modul Antrean Verifikasi Klaim (`/antrean`) & Dialog Konfirmasi

Implementasi modul **Antrean Verifikasi Klaim** untuk peran `verifikator` (Mas Rian · KC Malang) mengacu pada frame FigCraft **`UI 1.2 - Mas Rian: Antrean Verifikasi Klaim (/antrean)`**, terhubung penuh ke Cloudflare D1, RBAC middleware, Sonner toast, dan dialog konfirmasi aksi krusial (`ConfirmActionDialog`).

## 1. Primitif & Komponen Shared
- Install `alert-dialog` shadcn/ui (`src/components/ui/alert-dialog.tsx`).
- Buat `src/components/shared/ConfirmActionDialog.tsx` (`role="alertdialog"`, ringkasan singkat, daftar dampak tindakan, opsional catatan audit tervalidasi via Sonner toast tanpa inline alert banner).

## 2. Seed Data Realistis D1 (`hospitals`, `doctors`, `claims`)
- Buat `src/db/seed-claims.ts` → menghasilkan `drizzle/seed-claims.sql` (idempotent `ON CONFLICT DO UPDATE`) berisi:
  - 4 FKRTL mitra KC Malang (`RSUD Medika Malang`, `RS Hermosa Malang`, `RSIA Melati Malang`, `RSUD Dr. Saiful Anwar`)
  - 5 Dokter DPJP
  - 24 berkas klaim realistis berbasis skor deterministik 3 lapis & pseudonim UU PDP (termasuk 6 klaim Zona Hijau untuk uji **Setujui Klaim Wajar / Fast-Track**).
- Terapkan ke D1 lokal & D1 remote `claimguard-db`.

## 3. Backend Claims Queue & Mutasi Atomik
- `src/schemas/claims.schema.ts`: tambah `approveFastTrackInputSchema`, default pagination `limit = 10`.
- `src/server/services/claims.service.ts`:
  - `listClaimsQueue(db, branchCode, filters)` dengan `.limit()` ketat & indeks, mengembalikan `items`, `pagination`, `summary` (jumlah per tab + Fast-Track + nilai total), dan opsi `hospitals`.
  - `bulkUpdateClaims(db, actor, input)` & `approveFastTrackClaims(db, actor, note)` memakai `db.batch([...])` untuk mutasi status + pencatatan permanen `audit_logs`.
- `src/server/functions/claims.fn.ts`: `getClaimsQueueFn`, `bulkUpdateClaimsFn`, `approveFastTrackClaimsFn` (dilindungi `requireRoleMiddleware(['verifikator'])` + `.validator(...)`).
- `src/queries/claims.queries.ts`: `claimsQueueQueryOptions`, `useBulkClaimActionMutation`, `useApproveFastTrackMutation` dengan toast Sonner terpusat.

## 4. Halaman `/antrean` (`UI 1.2`)
- `src/routes/antrean.tsx`: `validateSearch`, `beforeLoad` (`requireRouteRole(['verifikator'])`), `loaderDeps`, dan `loader` prefetch.
- `src/pages/verifikator/AntreanPage.tsx`: header + tombol `Ekspor Antrean` & `Setujui Klaim Wajar`, toolbar 4 filter pill + pencarian, card tabel 4 tab ber-counter + bulk action, tabel 8 kolom (`DataTable` / TanStack Table v9), pagination pill, serta konfirmasi dialog untuk setiap aksi krusial.
- `src/routes/index.tsx`: arahkan tombol `Lihat Semua Antrean` ke `/antrean`.

## 5. Verifikasi
- `bun src/server/auth/auth.check.ts`, `bun src/lib/domain.check.ts`, `bun src/db/d1-guard.check.ts`
- `bun run build` & `bunx tsc --noEmit`
