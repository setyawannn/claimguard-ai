# Plan 13 — Investigasi & Peta Jejaring Kolusi (`/investigasi`, UI 2.2 + UI 2.2B)

> **Status:** `Selesai`  
> **Peran Target:** Role 2 — Pengawas Anti-Fraud Wilayah (`auditor_wilayah` · Ibu Anita · Divre Jatim)  
> **Referensi Desain:** `design/exports/15-ui-2-2-ibu-anita-investigasi-graf.png` & `16-ui-2-2b-ibu-anita-dynamic-node-states.png`  
> **Prasyarat:** Plan 12 (`fraud_clusters`, `hospitals`, `doctors`, `claims`, `audit_logs`)

---

## 1. Tujuan & Ruang Lingkup

Membangun halaman **Investigasi & Peta Jejaring Kolusi (`/investigasi`)** untuk Role 2 (`auditor_wilayah`) yang memvisualisasikan alur rujukan-penagihan 5 simpul secara interaktif, menampilkan 3 kartu narasi Hulu–Tengah–Hilir, menyinkronkan panel inspektor dinamis di sisi kanan (`UI 2.2B`), dan memungkinkan penetapan tahap tindak lanjut wilayah secara atomik ke Cloudflare D1.

### Prinsip Arsitektur yang Dijaga
1. **D1-Backed Constellation & Governance Loop:** Data graf konstelasi dan sampel SEP UU PDP diambil dari D1 (`fraud_clusters`, `hospitals`, `doctors`, `claims`) dengan `.limit()` ketat. Penetapan tahap tindak lanjut menulis baris permanen di `audit_logs` dan menyinkronkan status PKS/TGR rumah sakit terkait untuk Role 3 (Pak Rudi).
2. **Interactive SVG + Dynamic Inspector (`UI 2.2` + `UI 2.2B`):** Klik simpul mana pun pada peta (`Faskes Perujuk`, `Praktik Sore DPJP`, `DPJP Hub`, `Faskes Penagih Utama`, `Kluster Pasien & SEP`) langsung mengubah header, alur Masuk/Keluar, temuan spesifik, dan daftar dokumen/draf audit pada panel kanan.
3. **No External Webhook & Client-Side Monochrome Print:** Tombol `Salin` memakai `CopyDraftButton`; tombol `Unduh` menyusun dokumen HTML monokrom resmi siap cetak/PDF via *hidden iframe* atau ekspor `.csv` UTF-8 BOM.

---

## 2. Rancangan Teknis per Lapisan

### A. Kontrak Zod & Query Keys
- **`src/schemas/clusters.schema.ts`:**
  - `graphNodeKeySchema`, `investigationSearchSchema` (`clusterId`, `branchCode`), `updateClusterStageInputSchema`.
  - DTO `ConstellationNodeInfo`, `ClusterStoryCard`, `InvestigationClaimSample`, `ClusterInvestigationDetail`, `ClusterInvestigationResponse`, `UpdateClusterStageResult`.
- **`src/queries/keys.ts`:**
  - `queryKeys.clusters.investigation(params)` agar query tercache dan terinvalidasi otomatis oleh `queryKeys.clusters.all`.

### B. Backend Service, Server Functions & TanStack Query
- **`src/server/services/cluster-investigation.service.ts`:**
  - `getClusterInvestigation(db, params)`: query kluster wilayah (`.limit(100)`), sampel klaim UU PDP RS terkait (`.limit(14)`), pembangun deterministik 5 simpul konstelasi & 3 kartu narasi.
  - `updateClusterStage(db, actor, input)`: `db.batch([...])` update `fraud_clusters`, insert `audit_logs`, dan sinkronisasi `hospitals.pksStatus` / `tgrBurdenIdr` bila diperlukan.
- **`src/server/functions/cluster-investigation.fn.ts`:** `getClusterInvestigationFn` (`GET`) & `updateClusterStageFn` (`POST`) dengan `requireRoleMiddleware(['auditor_wilayah'])`.
- **`src/queries/clusters.queries.ts`:** `clusterInvestigationQueryOptions` & `useUpdateClusterStageMutation`.

### C. Komponen Domain (`src/components/domain/investigasi/`) & Route
- `investigasi.utils.ts`: builder draf teks siap salin, generator HTML monokrom siap cetak/PDF, dan ekspor kronologi CSV.
- `ConstellationGraphSvg.tsx`: kanvas peta jejaring 5 simpul + 4 kurva relasi berlabel + kontrol zoom (`-`, `100%`, `+`, `Fit`) + tab kedua `Sebaran Wilayah Jatim (4 KC)`.
- `ClusterStoryCards.tsx`: 3 kartu ringkasan Hulu–Tengah–Hilir.
- `ClusterInspectorPanel.tsx`: panel kanan dinamis (`UI 2.2` + `UI 2.2B`) + 5 tombol tahap tindak lanjut + `ConfirmActionDialog`.
- `src/pages/regional/InvestigasiPage.tsx` & `src/routes/investigasi.tsx`, plus wiring tautan dari `RegionalKpiSection` & `RegionalOverviewSection`.

---

## 3. Verifikasi
- `bun run build` (route generation `/investigasi` + SSR Worker bundle).
- `bunx tsc --noEmit` & `bunx eslint` pada seluruh file baru/diubah.
