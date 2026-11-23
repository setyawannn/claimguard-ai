# Plan 14 — Tindak Lanjut & Rekap Wilayah (`/tindak-lanjut`, UI 2.3)

> **Status:** `Selesai`  
> **Peran Target:** Role 2 — Pengawas Anti-Fraud Wilayah (`auditor_wilayah` · Ibu Anita · Divre Jatim)  
> **Referensi Desain:** `design/exports/17-ui-2-3-ibu-anita-tindak-lanjut.png` & `design/claimguard-ai-design.figcraft`  
> **Prasyarat:** Plan 12–13 (`fraud_clusters`, `hospitals`, `audit_logs`, `print-html.ts`)

---

## 1. Tujuan & Ruang Lingkup

Melengkapi alur kerja Lini 2 (**Ibu Anita · Pengawas Wilayah Divre Jatim**) dengan halaman **Tindak Lanjut & Rekap Wilayah (`/tindak-lanjut`, UI 2.3)** untuk memantau hasil pemeriksaan lapangan (CCTV, buku register, BAP), menetapkan status akhir audit (`Tagih TGR`, `Evaluasi PKS`, `Limpahkan APH`, `Arsip Wajar`), mengekspor log rekap `.csv`, dan mencetak **Berita Acara PK-JKN** monokrom resmi.

### Prinsip Arsitektur yang Dijaga
1. **Governance Loop Lintas Peran (Lini 2 → Lini 3):** Penetapan `Tagih TGR` atau `Evaluasi PKS` (`kirim_pak_rudi`) secara atomik memperbarui `fraud_clusters`, mencatat baris permanen di `audit_logs`, dan menghitung ulang beban TGR (`hospitals.tgrBurdenIdr`) serta status PKS (`hospitals.pksStatus = 'evaluasi_pks'`) untuk Role 3 (Pak Rudi).
2. **DRY & Input Formatting:** Helper `formatThousandsId` diekstrak ke `src/lib/format.ts` agar dipakai bersama untuk input tarif/TGR ber-prefix `Rp` (`00.000.000`). Dokumen cetak PK-JKN memanfaatkan `printHtmlDocument` (`src/lib/print-html.ts`) dengan format HTML monokrom tanpa background warna pada tabel.
3. **D1 Quota Protection:** Query `fraud_clusters` memakai `.limit(100)` dan instruksi sidak dari `audit_logs` diambil secara *batch* (`inArray`) hanya untuk baris pada halaman aktif.

---

## 2. Rancangan Teknis per Lapisan

### A. Utilitas, Kontrak Zod & Query Keys
- **`src/lib/format.ts`:** Ekspor `formatThousandsId(raw)` (dipakai bersama `RiwayatFinalizationPanel` dan `TindakLanjutPanel`).
- **`src/schemas/clusters.schema.ts`:** `followupTabSchema`, `clusterFollowupFilterSchema`, `ClusterFieldChecklist`, `ClusterFollowupItem`, `ClusterFollowupSummary`, `ClusterFollowupResponse`, dan `FinalizeClusterResult`.
- **`src/queries/keys.ts`:** Tambah `queryKeys.clusters.followup(filters)`.

### B. Backend Service, Server Functions & TanStack Query
- **`src/server/services/cluster-followup.service.ts`:** `listClusterFollowups(db, filters)` dan `finalizeClusterAudit(db, actor, input)` (termasuk sinkronisasi `hospitals.tgrBurdenIdr` & `hospitals.pksStatus`).
- **`src/server/functions/cluster-followup.fn.ts`:** `getClusterFollowupFn` (`GET`) dan `finalizeClusterAuditFn` (`POST`) dengan `requireRoleMiddleware(['auditor_wilayah'])`.
- **`src/queries/clusters.queries.ts`:** `clusterFollowupQueryOptions` dan `useFinalizeClusterMutation` (invalidasi `clusters`, `hospitals`, dan `pks`).

### C. Komponen Domain (`src/components/domain/tindak-lanjut/`), Page & Route
- `tindak-lanjut.utils.ts`, `TindakLanjutKpiSection.tsx`, `TindakLanjutFilterSection.tsx`, `tindak-lanjut-columns.tsx`, `TindakLanjutTableSection.tsx`, `TindakLanjutPanel.tsx`.
- `src/pages/regional/TindakLanjutPage.tsx` & `src/routes/tindak-lanjut.tsx` (plus wiring tombol `Tindak Lanjut →` di `RegionalOverviewSection.tsx`).

---

## 3. Verifikasi
- `bun run build` (generate `routeTree.gen.ts` `/tindak-lanjut` + SSR Worker bundle).
- `bunx tsc --noEmit` & `bunx eslint` pada seluruh file baru/diubah.
