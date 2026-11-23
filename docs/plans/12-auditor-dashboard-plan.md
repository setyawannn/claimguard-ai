# Plan 12 — Dashboard Pengawas Anti-Fraud Wilayah (`/`, UI 2.1)

> **Status:** `Selesai`  
> **Peran Target:** Role 2 — Pengawas Anti-Fraud Wilayah (`auditor_wilayah` · Ibu Anita · Divre Jatim)  
> **Referensi Desain:** `design/exports/14-ui-2-1-ibu-anita-dashboard.png` & `design/claimguard-ai-design.figcraft`  
> **Prasyarat:** Plan 01–11 (`D1 Quota Guard`, `Auth RBAC`, `Regional Escalation Trigger Loop`)

---

## 1. Tujuan & Ruang Lingkup

Membangun halaman utama (**Dashboard Wilayah Divre Jatim**, `UI 2.1`) ketika pengguna login sebagai **Ibu Anita** (`auditor_wilayah`), terhubung penuh ke tabel `fraud_clusters`, `hospitals`, dan `doctors` di Cloudflare D1 sehingga kluster yang otomatis tereskalasi dari Lini 1 (Mas Rian) langsung muncul secara real-time di Lini 2.

### Prinsip Arsitektur yang Dijaga
1. **D1-Backed Real Data:** Tidak menggunakan snapshot statis; seluruh KPI, daftar kluster prioritas utama, dan rekap eskalasi per Kantor Cabang dihitung dari Cloudflare D1 (`fraud_clusters` join `hospitals` & `doctors`) dengan `.limit()` ketat pada indeks `idx_clusters_branch_priority`.
2. **DRY Shared Primitives:** Memanfaatkan kembali komponen shared (`PageHeader`, `FilterBar`, `KpiCard`, `VolumeTrendChart`, `ProgressMetricBar`, `SectionCard`, `ClaimPriorityRow`, `FaskesAnomalyRow`, `EmptyState`).
3. **Strict RBAC & TypeScript:** `requireRoleMiddleware(['auditor_wilayah'])`, `.validator(...)`, top-level `import type`, tanpa `any`, simbol Unicode (`→`, `·`), dan UU PDP.

---

## 2. Rancangan Teknis

### A. Seed Data Wilayah (`src/db/seed-clusters.ts` → `drizzle/seed-clusters.sql`)
- Menambah RS mitra di `KC-SBY`, `KC-JBR`, dan `KC-KDR` (melengkapi `KC-MLG` dari Plan 08).
- Men-seed 14 kluster eskalasi (`JTM-01` s/d `JTM-14`) lintas 4 Kantor Cabang Jawa Timur (`KC Malang`, `KC Surabaya`, `KC Jember`, `KC Kediri`) yang idempotent via `ON CONFLICT DO UPDATE` dan diterapkan ke D1 lokal serta remote `claimguard-db`.

### B. Kontrak Zod, Query Keys & Backend D1
- **`src/schemas/clusters.schema.ts`:** `regionalDashboardFilterSchema` (`period`, `branchCode`, `search`), `RegionalClusterItem`, `BranchEscalationSummary`, `RegionalDashboardMetrics`, `RegionalDashboardResponse`.
- **`src/queries/keys.ts`:** `queryKeys.clusters.dashboard(filters: RegionalDashboardFilterInput)`.
- **`src/server/services/regional-dashboard.service.ts`:** `getRegionalDashboard(db, filters)` mengagregasi KPI wilayah (total berkas & potensi kerugian, kluster kritis, pola temuan kolusi/repeat billing vs BOR/upcoding, progres sidak & TGR), daftar kluster prioritas utama, dan rekap 4 Kantor Cabang.
- **`src/server/functions/regional-dashboard.fn.ts`:** `getRegionalDashboardFn` (`GET`, `requireRoleMiddleware(['auditor_wilayah'])`).
- **`src/queries/clusters.queries.ts`:** `regionalDashboardQueryOptions(filters)` (`staleTime: 20_000`).

### C. Komponen Domain (`src/components/domain/regional-dashboard/`) & Role Dispatch
- `regional-dashboard.utils.ts`: ekspor CSV rekap wilayah (`exportRegionalSummaryCsv`) dan konstanta metadata cabang Jatim.
- `RegionalFilterSection.tsx`: pill filter Periode, `Semua KC Jatim (4 Cabang)`, tombol `Unduh Rekap Wilayah`, dan input pencarian.
- `RegionalKpiSection.tsx`: 4 `KpiCard` presisi `UI 2.1` (termasuk 1 focal blue card `Prioritas Audit Wilayah`).
- `RegionalOverviewSection.tsx`: grid 2 kolom (`Kluster Faskes Prioritas Utama` + `Eskalasi per Kantor Cabang` klik-untuk-filter).
- `src/pages/regional/RegionalDashboardPage.tsx` & dispatch di `src/routes/index.tsx` (prefetch `regionalDashboardQueryOptions` saat `user.role === 'auditor_wilayah'`).

---

## 3. Verifikasi

1. Terapkan `drizzle/seed-clusters.sql` ke D1 lokal dan remote `claimguard-db`.
2. `bunx tsc --noEmit` — bebas error TypeScript strict.
3. `bunx eslint` pada seluruh file baru & yang diubah — 0 error.
4. `bun run build` — build client & Cloudflare Workers SSR sukses.
