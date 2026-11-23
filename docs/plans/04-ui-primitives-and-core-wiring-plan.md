# Plan 04 — Pemasangan `shadcn/ui`, Shared Components DRY, & Core Wiring

**Status:** Belum Dikerjakan  
**Target Repo:** `repositories/claimguard-ai-app/`  
**Prinsip:** Pasang hanya komponen & paket yang benar-benar dipakai di 11 layar FigCraft + `BLUEPRINT.md` (tanpa dependensi bloat).

---

## 1. Audit Status Paket Saat Ini

| Kategori | Sudah Terpasang | Belum Terpasang / Belum Terhubung |
|---|---|---|
| Validasi & Schema | `zod@4.6.7`, `src/schemas/*` | Validasi env server (`src/lib/env.ts`) |
| Kompresi Media | `browser-image-compression@2.0.2`, `src/lib/image-compressor.ts` | Komponen `ImageUploadField.tsx` & aset `public/assets/placeholder.webp` |
| Styling & Icons | `tailwindcss@4`, `cva`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react` | Primitif `shadcn/ui` di `src/components/ui/` + `<Toaster />` (`sonner`) |
| Tabel & Data | `@tanstack/react-table@9.3.1`, `@tanstack/react-query`, `@tanstack/match-sorter-utils` | Wrapper generik `src/components/shared/DataTable.tsx` (API v9) |
| Grafik & Form | — | **Sengaja tidak install** `recharts`/`react-flow`/`react-hook-form` (bar komparasi & graf 5-simpul lebih ringan pakai SVG/Tailwind murni; form keputusan cukup Zod + React state) |

---

## 2. Daftar Primitif `shadcn/ui` yang Dipasang (`src/components/ui/`)

Dipasang lewat `bunx --bun shadcn@latest add`:
1. `button` — Aksi primer/sekunder/danger di semua layar.
2. `card` — KPI card, ringkasan klaim, panel inspektur.
3. `badge` — Basis badge tambahan di luar `StatusBadge`.
4. `input` & `textarea` — Pencarian antrean, catatan keputusan wajib, draf surat *e-Office*.
5. `label` — Aksesibilitas form.
6. `select` — Filter RS, Status, Tipologi, Target Koreksi Koding, dan upgrade `TopNavbar` switcher.
7. `checkbox` — Seleksi massal antrean, daftar bukti klarifikasi, checklist sidak & BA rapat PKS.
8. `tabs` — Sub-tab status antrean (`UI 1.2`) dan rapor RS (`UI 3.2`).
9. `table` — Primitif tabel semantik untuk `DataTable.tsx`.
10. `dialog` — Konfirmasi aksi krusial (*Fast-Track* massal, kunci keputusan PKS).
11. `skeleton` & `separator` — Loading state & pembatas panel.
12. `sonner` — Notifikasi toast (*Salin Draf*, *Keputusan Tersimpan*, peringatan kuota).

---

## 3. Komponen Shared DRY & Core Wiring yang Dibuat

1. **Global Toast (`src/routes/__root.tsx`):** Pasang `<Toaster position="bottom-right" richColors />` dari `src/components/ui/sonner.tsx`.
2. **Server Env Schema (`src/lib/env.ts`):** Parser Zod untuk `UUPDP_HASH_SALT`, `GEMINI_API_KEY` (opsional), dan `VITE_CDN_BASE_URL` agar konfigurasi tervalidasi di batas runtime.
3. **Shared Components (`src/components/shared/`):**
   - `DataTable.tsx` — Wrapper generik `@tanstack/react-table` v9 (sorting, row selection, paginasi konsisten, `EmptyState` bawaan).
   - `KpiCard.tsx` — `KpiCard` standar + `FocalKpiCard` (`.focal-card`, maks 1 per dashboard).
   - `FilterBar.tsx` — Bilah filter terbuka terpadu + input pencarian *debounced*.
   - `CopyDraftButton.tsx` — Tombol salin clipboard (`copyToClipboard`) + feedback toast `sonner`.
   - `ExternalProcessBox.tsx` — Kotak `.external-boundary` (garis putus-putus untuk *e-Office*, SP2D, Sidak).
   - `ImageUploadField.tsx` — Input unggah bukti yang otomatis menjalankan `compressImageBeforeUpload(file, preset)` dan menolak file non-gambar/di atas 500 KB sebelum dikirim ke server.
4. **Aset Fallback CDN:** Buat `public/assets/placeholder.webp` (< 5 KB) untuk fallback `cdn-gateway` sesuai `BLUEPRINT.md` §9.
5. **Sinkronisasi `TopNavbar.tsx`:** Rapikan kontrol tombol/select memakai primitif `shadcn/ui`.

---

## 4. Verifikasi Eksekusi Plan 04

- `bunx tsc --noEmit` → 0 error.
- `bun run build` → client & SSR Cloudflare Workers bundle lulus.
- `bun src/lib/domain.check.ts` & `bun src/db/d1-guard.check.ts` → lulus.
- Perbarui status Plan 04 di `docs/plans/README.md` menjadi **Selesai** dan simpan ke UTEKE Memory.
