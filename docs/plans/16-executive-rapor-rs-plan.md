# Plan 16 — Rapor Kepatuhan RS Mitra (`/rapor-rs`, UI 3.2)

> **Status:** `Selesai`  
> **Peran Target:** Role 3 — Kepala Kantor Cabang (`kepala_cabang` · Pak Rudi · KC Malang)  
> **Referensi Desain:** `design/exports/19-ui-3-2-pak-rudi-rapor-rs.png` & `design/claimguard-ai-design.figcraft`  
> **Prasyarat:** Plan 15 (12 FKRTL KC Malang di `hospitals`, `executive-dashboard`)

---

## 1. Tujuan & Ruang Lingkup

Membangun halaman **Rapor Kepatuhan RS Mitra (`/rapor-rs`, UI 3.2)** bagi **Pak Rudi (Kepala Cabang KC Malang)** untuk mengevaluasi seluruh 12 FKRTL mitra melalui 4 tab kepatuhan, 4 filter pill + pencarian, seleksi massal (*bulk action* `Kirim Surat Pembinaan` & `Perpanjang PKS Terpilih`) via `ConfirmActionDialog`, ekspor matriks `.csv`, serta pencetakan **Bundel Rapat PKS** HTML monokrom resmi.

---

## 2. Rancangan Teknis
- **Skema (`src/schemas/hospitals.schema.ts`):** `hospitalsFilterSchema`, `bulkHospitalPolicyInputSchema`, DTO `HospitalScorecardItem`, `HospitalsScorecardResponse`, `BulkHospitalPolicyResult`.
- **Backend & Query (`hospitals.service.ts`, `hospitals.fn.ts`, `hospitals.queries.ts`):** `listHospitalsScorecard` (`.limit(50)`) dan `bulkUpdateHospitalPolicy` atomik `db.batch([...])` + `audit_logs`, dilindungi `requireRoleMiddleware(['kepala_cabang'])`.
- **Komponen Domain (`src/components/domain/rapor-rs/`):** `rapor-rs.utils.ts`, `RaporRsFilterSection.tsx`, `rapor-rs-columns.tsx`, `RaporRsTableSection.tsx`.
- **Page & Routes:** `src/pages/executive/RaporRsPage.tsx`, `src/routes/rapor-rs.tsx`, `src/routes/rapor-rs.index.tsx`, serta wiring tombol dari `ExecutiveKpiSection` & `ExecutiveOverviewSection`.

---

## 3. Verifikasi
- `bun run build` (`routeTree.gen.ts` `/rapor-rs` + SSR Worker).
- `bunx tsc --noEmit` & `bunx eslint` pada seluruh file baru/diubah.
