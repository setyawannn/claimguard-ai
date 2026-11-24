# Plan 15 — Dashboard Eksekutif & Seed 12 FKRTL KC Malang (`/`, UI 3.1)

> **Status:** `Selesai`  
> **Peran Target:** Role 3 — Kepala Kantor Cabang (`kepala_cabang` · Pak Rudi · KC Malang)  
> **Referensi Desain:** `design/exports/18-ui-3-1-pak-rudi-dashboard-eksekutif.png` & `design/claimguard-ai-design.figcraft`  
> **Prasyarat:** Plan 01–14 (`hospitals`, `claims`, `fraud_clusters`, `pks_decisions`)

---

## 1. Tujuan & Ruang Lingkup

Melengkapi **Role 3 — Pak Rudi (Kepala Cabang KC Malang)** dengan halaman utama **Dashboard Eksekutif (`UI 3.1`)** yang terhubung penuh ke Cloudflare D1 (`hospitals`, `claims`, `fraud_clusters`), dilengkapi seed lengkap **12 FKRTL Mitra KC Malang** dan draf awal `pks_decisions`.

### Prinsip Arsitektur yang Dijaga
1. **Konsistensi Data Lintas Peran (Audit-003):** `RSUD Medika Malang` (`0195R008`, `#JTM-01`) menggunakan modus **Repeat Billing PCI / Kardiologi** (`dr. Hendra Wijaya, Sp.JP`) dengan TGR Rp 420 Jt; `RS Hermosa Malang` (`0195R011`, `#JTM-02`) Tipe C · 110 TT dengan TGR Rp 200 Jt (Total TGR KC Malang = Rp 620 Jt).
2. **D1-Backed Executive Metrics:** Seluruh KPI (`Dana JKN Diamankan`, `RS Perlu Evaluasi PKS`, `Sebaran 4 Tipologi Fraud`, `Kinerja SLA & Fast-Track`), peringkat RS mitra, dan evaluasi 4 tipologi dihitung dari D1 dengan `.limit()`.
3. **DRY Shared Primitives:** Memakai ulang `PageHeader`, `FilterBar`, `KpiCard`, `VolumeTrendChart`, `ProgressMetricBar`, `SectionCard`, `ClaimPriorityRow`, `FaskesAnomalyRow`, dan `EmptyState`.

---

## 2. Rancangan Teknis
- **Seed (`src/db/seed-executive.ts` → `drizzle/seed-executive.sql`):** Menyinkronkan 12 FKRTL KC Malang + 5 baris awal `pks_decisions`.
- **Skema & Query Keys (`src/schemas/hospitals.schema.ts`, `src/queries/keys.ts`):** `executiveDashboardFilterSchema`, `ExecutiveDashboardResponse`, `queryKeys.hospitals.executiveDashboard`.
- **Backend & Query (`executive-dashboard.service.ts`, `executive-dashboard.fn.ts`, `hospitals.queries.ts`):** Terproteksi `requireRoleMiddleware(['kepala_cabang'])` + `staleTime: 20_000`.
- **Komponen Domain (`src/components/domain/executive-dashboard/`) & Role Dispatch (`src/routes/index.tsx`):** `ExecutiveFilterSection`, `ExecutiveKpiSection`, `ExecutiveOverviewSection`, dan `ExecutiveDashboardPage`.
