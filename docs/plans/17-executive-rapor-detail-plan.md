# Plan 17 — Detail Rapor Kepatuhan & Kontrak PKS (`/rapor-rs/$hospitalId`, UI 3.3)

> **Status:** `Selesai`  
> **Peran Target:** Role 3 — Kepala Kantor Cabang (`kepala_cabang` · Pak Rudi · KC Malang)  
> **Referensi Desain:** `design/exports/20-ui-3-3-pak-rudi-detail-rapor-pks.png` & `design/claimguard-ai-design.figcraft`  
> **Prasyarat:** Plan 15–16 (`hospitals`, `fraud_clusters`, `pks_decisions`, `/rapor-rs`)

---

## 1. Tujuan & Ruang Lingkup

Membangun halaman **Detail Rapor Kepatuhan & Kontrak PKS (`/rapor-rs/$hospitalId`, UI 3.3)** bagi **Pak Rudi (Kepala Cabang KC Malang)** untuk membedah 4 pilar kepatuhan Permenkes 16/2019 per FKRTL, meninjau eskalasi hasil sidak wilayah, membandingkan okupansi BOR terhadap standar Aplicares, menyalin draf surat e-Office, mencetak Rapor & BAP monokrom resmi, dan menetapkan rekomendasi kebijakan PKS 2027 ke D1.

---

## 2. Rancangan Teknis
- **Skema (`src/schemas/hospitals.schema.ts`):** `HospitalDetailClusterInfo`, `HospitalDetailPksInfo`, `HospitalDetailNavigation`, `HospitalDetailItem`, `HospitalDetailResponse`, `SavePksRecommendationResult`.
- **Backend & Query (`hospitals.service.ts`, `hospitals.fn.ts`, `hospitals.queries.ts`):** `getHospitalDetail` (memuat RS, kluster wilayah terkait, draf `pks_decisions`, dan navigasi `prevId`/`nextId`) serta `savePksRecommendation` (upsert `pks_decisions`, update `hospitals.pksStatus`, insert `audit_logs` atomik via `db.batch([...])`).
- **Komponen Domain (`src/components/domain/rapor-rs-detail/`):** `rapor-rs-detail.utils.ts`, `RaporDetailHeaderStrip.tsx`, `RaporDetailPilarSection.tsx`, `RaporDetailPolicyPanel.tsx`.
- **Page & Route:** `src/pages/executive/RaporRsDetailPage.tsx`, `src/routes/rapor-rs.$hospitalId.tsx`, plus wiring tautan dari `RaporRsPage` & `ExecutiveOverviewSection`.

---

## 3. Verifikasi
- `bun run build` (`routeTree.gen.ts` `/rapor-rs/$hospitalId` + SSR Worker).
- `bunx tsc --noEmit` & `bunx eslint` pada seluruh file baru/diubah.
