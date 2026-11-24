# Plan 18 — Kebijakan & Evaluasi Kontrak PKS (`/kebijakan`, UI 3.4)

> **Status:** `Selesai`  
> **Fase:** Role 3 · Fase 4 dari 4 (Final)  
> **Referensi UI:** `design/exports/21-ui-3-4-pak-rudi-kebijakan-pks.png`

---

## Ringkasan Tujuan

Membangun halaman **Kebijakan & Evaluasi Kontrak PKS** (`/kebijakan`) bagi **Pak Rudi (`kepala_cabang` · KC Malang)** untuk merekapitulasi rekomendasi kebijakan seluruh 12 FKRTL mitra, memverifikasi kelengkapan dokumen rapat & nomor surat e-Office BPJS, menetapkan keputusan akhir Kontrak PKS 2027, mengekspor Audit Trail (`.csv`), mencetak Bundel Rapat PKS format HTML formal monokrom, serta mengunci log keputusan secara atomik ke Cloudflare D1.

## Ruang Lingkup Implementasi

1. **Schema & Kontrak Data (`src/schemas/hospitals.schema.ts`)**
   - Menambahkan `pksDecisionsFilterSchema`, `PksDecisionsFilterInput`, `PksMeetingChecklist`, `PksDecisionRowItem`, `PksDecisionsSummary`, `PksDecisionsResponse`, dan `LockPksDecisionResult`.
2. **Backend Service & Server Functions (`src/server/services/pks.service.ts`, `src/server/functions/pks.fn.ts`)**
   - `listPksDecisions(db, branchCode, filters)`: menggabungkan data `hospitals` cabang terkait dengan `pksDecisions` serta menyediakan fallback virtual terstruktur untuk FKRTL yang belum memiliki baris `pks_decisions`, menghitung KPI ringkasan secara dinamis, dan menyaring menurut tab/jalur/pencarian.
   - `lockPksDecision(db, actor, input)`: memvalidasi kelengkapan 3 checklist verifikasi rapat, menyelaraskan status ke `hospitals`, menyimpan/mengunci baris `pks_decisions` (`isLocked: true`, `decidedBy`, `decidedAt`), dan mencatat rekam jejak `LOCK_PKS_DECISION` ke `audit_logs` dalam satu `db.batch([...])` atomik.
   - `getPksDecisionsFn` dan `lockPksDecisionFn` diproteksi `requireRoleMiddleware(['kepala_cabang'])`.
3. **Query Keys & Hooks (`src/queries/keys.ts`, `src/queries/hospitals.queries.ts`)**
   - Memperbarui `queryKeys.pks.list(filters)` serta menambahkan `pksDecisionsQueryOptions` dan `useLockPksDecisionMutation`.
4. **Komponen Domain, Halaman & Route**
   - `src/components/domain/kebijakan/kebijakan.utils.ts` — Opsi 2×2 keputusan akhir, ekspor CSV audit trail UTF-8 BOM, dan cetak Bundel Rapat PKS monokrom (`printHtmlDocument`).
   - `src/components/domain/kebijakan/KebijakanKpiRow.tsx` — 4 kartu KPI eksekutif kebijakan PKS.
   - `src/components/domain/kebijakan/KebijakanTableSection.tsx` — 3 tab status rapat + daftar rekap 12 FKRTL interaktif dengan pilihan baris aktif.
   - `src/components/domain/kebijakan/KebijakanDecisionPanel.tsx` — Panel kanan pencatatan hasil rapat, checklist 3 dokumen e-Office, 4 pilihan keputusan akhir, input no. surat & catatan wajib `*`, serta `ConfirmActionDialog`.
   - `src/pages/executive/KebijakanPksPage.tsx` & `src/routes/kebijakan.tsx` — Integrasi lengkap + proteksi route `kepala_cabang`.

## Verifikasi Target

- `bun run build` exit `0`
- `bunx tsc --noEmit` exit `0`
- `bunx eslint` pada seluruh file baru dan file yang diubah exit `0` (0 error, 0 warning)
