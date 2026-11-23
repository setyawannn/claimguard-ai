# Plan 11 — Modul Riwayat Verifikasi Klaim & Rekonsiliasi (`/riwayat`, UI 1.4)

> **Status:** `Selesai`  
> **Peran Target:** Role 1 — Verifikator KC Malang (`verifikator` · Mas Rian)  
> **Referensi Desain:** `design/exports/13-ui-1-4-mas-rian-riwayat.png` & `design/claimguard-ai-design.figcraft`  
> **Prasyarat:** Plan 01–10 (`D1 Quota Guard`, `Auth RBAC`, `Antrean`, `Detail Klaim`, `Regional Escalation Trigger Loop`)

---

## 1. Tujuan & Ruang Lingkup

Melengkapi alur kerja operasional Lini 1 (**Verifikator KC Malang**) melalui halaman **Riwayat Verifikasi Klaim (`/riwayat`, UI 1.4)** sebagai pusat audit, finalisasi berkas berstatus `Klarifikasi` / `Balasan RS`, perubahan status putusan (*reconciliation*), serta ekspor **Log Riwayat (`.csv`)** dan **Berita Acara Hasil Verifikasi / BAHV (HTML Monokrom Siap Cetak/PDF)** secara lokal tanpa webhook eksternal.

### Prinsip Arsitektur yang Dijaga
1. **DRY Mutation & Trigger Loop:** Panel kanan (`Edit Status Akhir Klarifikasi`) **wajib** memakai kembali `submitClaimDecisionFn` dan `useSubmitClaimDecisionMutation` dari modul `claim-detail` (Plan 09) sehingga pencatatan permanen `audit_logs`, reset/increment `consecutiveRejections` DPJP, dan *Regional Escalation Trigger Loop* ke `fraud_clusters` tetap tunggal.
2. **D1 Quota Protection (95% Circuit Breaker):** Seluruh query di `claims-history.service.ts` wajib menyaring berdasarkan `hospitals.branchCode`, membatasi baris dengan `.limit()`, dan mengambil riwayat `audit_logs` awal secara *batch* hanya untuk `entityId` pada halaman aktif (`inArray`).
3. **Client-Side Monochrome BAHV (0 ms CPU Worker, Tanpa Dependensi Eksternal):** Pembuatan dokumen BAHV memakai template HTML monokrom resmi (`Times New Roman`, tabel border hitam polos tanpa warna latar) yang dicetak/disimpan ke PDF melalui *hidden iframe* di browser.
4. **UU PDP & Human-in-the-Loop:** Hanya pseudonim pasien (`Pasien #B-9021`) yang ditampilkan dan dicetak ke BAHV/CSV; setiap simpan perubahan status akhir melewati `ConfirmActionDialog`.

---

## 2. Rancangan Teknis per Lapisan

### A. Kontrak Zod & Query Keys
- **`src/schemas/claims.schema.ts`:**
  - `historyTabSchema`: `'semua' | 'perlu_final' | 'sudah_final'`
  - `historyStatusFilterSchema`: `'klarifikasi' | 'balasan_rs' | 'disetujui' | 'false_positive' | 'pending_rs' | 'ditolak'`
  - `claimsHistoryFilterSchema`: `tab`, `period` (`YYYY-MM`), `hospitalId`, `status`, `onlyNeedFinal`, `search`, `page`, `limit` (`max 50`).
  - DTO: `ClaimHistoryItem`, `ClaimsHistorySummary` (angka 4 KPI + nominal Rupiah + jumlah 3 tab), dan `ClaimsHistoryResponse`.
- **`src/queries/keys.ts`:**
  - Memperbarui `queryKeys.claims.history(filters: ClaimsHistoryFilterInput)` agar cache key spesifik terhadap parameter filter dan otomatis ter-invalidasi oleh `queryKeys.claims.all`.

### B. Backend Service & Server Function
- **`src/server/services/claims-history.service.ts`:**
  - `listClaimsHistory(db, branchCode, filters)`: mengagregasi KPI cabang untuk seluruh berkas di luar `belum_dicek`, menyusun daftar periode & RS tersedia, memfilter berdasarkan `tab` (`perlu_final` = `klarifikasi` / `balasan_rs`, `sudah_final` = `disetujui` / `false_positive` / `pending_rs` / `ditolak`), memetakan transisi status (`fromStatusLabel → status`), serta melampirkan catatan permintaan klarifikasi awal dari `audit_logs`.
- **`src/server/functions/claims-history.fn.ts`:**
  - `getClaimsHistoryFn` (`GET`, dilindungi `requireRoleMiddleware(['verifikator'])` dan `.validator(...)`).
- **`src/server/services/claim-detail.service.ts`:**
  - Memastikan `submitClaimDecision` menyimpan `hospitalRespondedAt` (jika `input.hospitalResponded` dikirim dari panel rekonsiliasi) dan mencatatnya di `audit_logs.metadataJson`.

### C. TanStack Query & Utilitas Ekspor BAHV/CSV
- **`src/queries/claims-history.queries.ts`:**
  - `claimsHistoryQueryOptions(filters)` dengan `staleTime: 20_000`.
- **`src/components/domain/riwayat/riwayat.utils.ts`:**
  - `exportRiwayatCsv(...)`: ekspor CSV ber-UTF-8 BOM untuk data riwayat tampilan aktif.
  - `buildBeritaAcaraHtml(...)` & `printBeritaAcaraHtml(...)`: menyusun surat BAHV monokrom resmi BPJS Kesehatan (judul tengah kapital, nomor surat, pihak pertama/kedua, tabel ber-border normal tanpa warna latar, penutup, dan blok tanda tangan dua pihak) siap cetak/PDF via *hidden iframe*.

### D. Komponen Domain Split-Layout (`src/components/domain/riwayat/`)
1. `RiwayatKpiSection.tsx` — 4 `KpiCard` ringkasan (`Perlu Status Akhir (Klarifikasi)`, `Total Klaim Disetujui`, `False Positive & Pending RS`, `Klaim Ditolak`).
2. `RiwayatFilterSection.tsx` — Pill filter Periode, Semua RS, Status Akhir, quick-toggle `Perlu Edit Klarifikasi (N)`, dan kotak pencarian.
3. `riwayat-columns.tsx` — 5 kolom `@tanstack/react-table` v9 (`NO. SEP & WAKTU`, `PASIEN & RS`, `TRANSISI STATUS`, `CATATAN KEPUTUSAN`, `AKSI` `Edit Akhir →` / `Ubah →`).
4. `RiwayatTableSection.tsx` — Panel kiri berisi 3 tab ter-segmentasi, tabel dengan highlight baris aktif, `EmptyState`, dan paginasi.
5. `RiwayatFinalizationPanel.tsx` — Panel kanan (`Edit Status Akhir Klarifikasi`) dengan badge sejajar header, kotak permintaan klarifikasi awal, toggle respon RS (`Konfirmasi RS Diterima` / `SLA Habis Tanpa Respon`), grid 2×2 status akhir (`Disetujui`, `False Positive`, `Pending RS`, `Ditolak`), input `Estimasi Tarif Setelah Revisi` ber-prefix `Rp` dan auto-format ribuan IDR (`00.000.000`), eskalasi PK-JKN, textarea `CATATAN & ALASAN PUTUSAN` `*` merah, konfirmasi `ConfirmActionDialog`, dan tautan `Buka Detail Pemeriksaan Lengkap →`.

### E. Page & Route
- **`src/pages/verifikator/RiwayatPage.tsx`:** Orkestrasi penuh `UI 1.4` (`PageHeader` + 4 KPI + Filter Bar + Split-Layout 2 kolom).
- **`src/routes/riwayat.tsx`:** Thin route (`validateSearch`, `requireRouteRole(['verifikator'])`, `loaderDeps`, `loader`).

---

## 3. Rencana Verifikasi

1. `bunx tsc --noEmit` — bebas error TypeScript strict.
2. `bun run build` — `routeTree.gen.ts` ter-generate, build Vite & bundle Cloudflare Workers SSR lulus tanpa error modul PDF/Node.
3. `bun run lint` — bebas pelanggaran ESLint.
4. Uji UI & alur kerja:
   - Navigasi ke `/riwayat` sebagai Mas Rian (`verifikator`).
   - Filter berdasarkan periode, RS, status, quick-toggle `Perlu Edit Klarifikasi`, dan pencarian.
   - Pilih baris di tabel → panel kanan sinkron → ubah status akhir → konfirmasi `ConfirmActionDialog` → KPI, tabel, dan `audit_logs` D1 terbarui.
   - Klik `Ekspor Log (.CSV)` dan `Unduh Berita Acara` → file `.csv` dan `.pdf` BAHV terunduh rapi.
