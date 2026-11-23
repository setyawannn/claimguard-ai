# Plan 02 — Standarisasi Theme Tokens (FigCraft) & Arsitektur `src/lib/` Utils

**Sumber Kebenaran Desain:** `../../../design/claimguard-ai-design.figcraft` (diekstrak langsung via FigCraft MCP: **82 Variables**, **2 Collections**, **7 Text Styles**, **13 Baris Komponen High-Fidelity `UI/*`**)  
**Target Kode:** `src/styles.css`, `src/routes/__root.tsx`, dan modul utilitas di `src/lib/`

---

## 1. Audit & Hasil Ekstraksi Langsung dari FigCraft

### A. Temuan Penting dari FigCraft vs Starter Template
1. **Starter `src/styles.css` Harus Diganti Total:** Saat ini masih memuat tema bawaan TanStack (`Fraunces` / `Manrope`, warna hijau lagoon, radial gradient dekoratif, `.island-shell`, dan dark mode otomatis). FigCraft hanya memiliki **1 mode resmi (`Semantic · Light`)** dengan estetika **Minimalist Clinical-Precision GovTech** (*Energy 1 / Rhythm 2 / Motion 1*).
2. **Kontras Netral FigCraft (`slate-500` = `#475569`):** Di FigCraft, variabel `slate-500` bernilai `#475569` (bukan `#64748B` default Tailwind) untuk memastikan rasio kontras WCAG AA > 7:1 bagi teks sekunder. Kita wajib menjaga nilai hex eksak ini melalui token semantik `--color-text-secondary: #475569`.
3. **4 Palet Status Semantik (Termasuk Violet untuk Klarifikasi):** Selain `risk-high` (Merah), `risk-medium` (Amber), dan `risk-low` (Emerald), FigCraft mendefinisikan palet ke-4 yaitu **`status-clarify` (Violet `#7C3AED` / `#F5F3FF` / `#DDD6FE` / `#5B21B6`)** yang dipakai bersama state klarifikasi/balasan RS.
4. **Pemetaan 1:1 Badge Status FigCraft ↔ Enum Database D1:** 7 varian `ClaimStatusBadge` di FigCraft (`BelumDicek`, `Klarifikasi`, `BalasanRS`, `PendingRS`, `Disetujui`, `FalsePositive`, `Ditolak`) cocok 100% dengan enum `claims.status` di `src/db/schema.ts`.

---

## 2. Spesifikasi Theme Tokens (`src/styles.css` — Tailwind CSS v4)

### A. Primitives & Semantic Color Palette (Eksak dari FigCraft `variable.export`)

| Kelompok | Token Semantik (`@theme`) | Primitive FigCraft | Nilai Hex | Penggunaan |
|---|---|---|---|---|
| **Surface** | `--color-bg-canvas` | `slate-50` | `#F8FAFC` | Latar kanvas utama halaman & kotak proses eksternal |
| **Surface** | `--color-bg-surface` | `white` | `#FFFFFF` | Kartu KPI, tabel, panel inspektur, navbar |
| **Surface** | `--color-bg-muted` | `slate-100` | `#F1F5F9` | Header tabel, chip netral, badge `Belum Dicek` |
| **Text** | `--color-text-primary` | `slate-900` | `#0F172A` | Judul, angka KPI, teks utama |
| **Text** | `--color-text-secondary` | `slate-500` (FigCraft) | `#475569` | Sub-judul, label metadata, teks pendukung |
| **Text** | `--color-text-on-primary` | `white` | `#FFFFFF` | Teks pada tombol primer & kartu fokus biru |
| **Border** | `--color-border-default` | `slate-200` | `#E2E8F0` | Garis tepi `1px solid` kartu, tabel, input |
| **Border** | `--color-border-dashed` | `slate-300` | `#CBD5E1` | Garis tepi putus-putus proses luar aplikasi (*e-Office*, SP2D, Sidak) |
| **Border** | `--color-border-strong` | `slate-900` | `#0F172A` | Penekanan kontras tinggi |
| **Border** | `--color-line-connector` | `slate-400` | `#94A3B8` | Garis konektor graf jejaring & garis waktu medis |
| **Action** | `--color-action-primary` | `blue-600` | `#2563EB` | Tombol utama, menu aktif, link aksi |
| **Action** | `--color-action-primary-hover` | `blue-700` | `#1D4ED8` | Hover tombol utama & awal gradasi kartu fokus |
| **Action** | `--color-action-primary-accent` | `blue-500` | `#3B82F6` | Akhir gradasi kartu fokus (`135deg, #1D4ED8 → #3B82F6`) |
| **Action** | `--color-action-primary-bg` | `blue-50` | `#EFF6FF` | Latar pill aktif & kartu info konfirmasi RS |
| **Action** | `--color-action-primary-border` | `blue-200` | `#BFDBFE` | Garis tepi pill aktif & kartu info biru |
| **Risk High** | `--color-risk-high` / `-bg` / `-border` / `-text` | `red-600/50/200/800` | `#DC2626` / `#FEF2F2` / `#FECACA` / `#991B1B` | Skor 70–100 (Merah), status `Ditolak`, BOR over-capacity |
| **Risk Medium** | `--color-risk-medium` / `-bg` / `-border` / `-text` | `amber-600/50/200/800` | `#D97706` / `#FFFBEB` / `#FDE68A` / `#92400E` | Skor 40–69 (Kuning), `Klarifikasi`, `Pending RS`, `Teguran SP-1` |
| **Risk Low** | `--color-risk-low` / `-bg` / `-border` / `-text` | `emerald-500/50/200/800` | `#10B981` / `#ECFDF5` / `#A7F3D0` / `#065F46` | Skor 0–39 (Hijau), `Disetujui`, Fast-Track, Grade A |
| **Clarify** | `--color-status-clarify` / `-bg` / `-border` / `-text` | `violet-600/50/200/800` | `#7C3AED` / `#F5F3FF` / `#DDD6FE` / `#5B21B6` | `Balasan RS` / simpul DPJP Hub khusus |

### B. Skala Tipografi (7 Text Styles FigCraft)

| Style FigCraft | Font Family | Size / Line-Height | Weight | Class / Utility Target |
|---|---|---|---|---|
| `Heading/H1` | `Inter` | `32px / 40px` | `700` (Bold) | `.text-h1` |
| `Heading/H2` | `Inter` | `24px / 32px` | `600` (SemiBold) | `.text-h2` |
| `Heading/H3` | `Inter` | `16px / 22px` | `600` (SemiBold) | `.text-h3` |
| `Body/Regular` | `Inter` | `14px / 20px` | `400` (Regular) | Default `body` |
| `Caption/Label` | `Inter` | `12px / 16px` | `600` (SemiBold) | `.text-caption-label` |
| `Caption/Tag` | `Inter` | `11px / 16px` | `600` (SemiBold) | `.text-caption-tag` (badge & header kolom) |
| `Mono/Code` | `Cascadia Mono` | `11px / 16px` | `600` (SemiBold) | `.font-mono-code` (`tabular-nums`, khusus No. SEP, INA-CBG, ICD, angka tabel) |

### C. Spacing, Radius & Pemetaan `shadcn/ui`
- **Radius FigCraft:** `--radius-sm: 6px`, `--radius-node: 8px`, `--radius-card: 12px`, `--radius-card-lg: 20px`, `--radius-shell: 28px`, `--radius-pill: 999px`.
- **Spacing FigCraft:** `4px` (`gap-xs`), `8px` (`gap-sm`), `12px`, `16px` (`gap-md` / `pad-node`), `24px` (`gap-lg` / `pad-card`), `32px`.
- **Integrasi `shadcn/ui`:** Variabel `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--destructive`, `--border`, `--input`, `--ring`, dan `--radius` (`0.5rem` = `8px`) langsung mengarah ke token FigCraft agar komponen `shadcn/ui` (`Button`, `Badge`, `Card`, `Input`, `Select`, `Tabs`, `Checkbox`, `Dialog`, `Table`) otomatis presisi tanpa override manual per komponen.
- **Utilitas CSS Khusus (3 saja, tanpa bloat):**
  1. `.focal-card` — `background: linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)` (maksimal 1 kartu per dashboard).
  2. `.external-boundary` — `background: var(--color-bg-canvas); border: 1px dashed var(--color-border-dashed)` (penanda sistem luar: *e-Office*, SP2D, Sidak Fisik).
  3. `.badge-pill` — anatomi eksak FigCraft: `rounded-full px-2.5 py-1 gap-1.5 text-[11px] font-semibold leading-4 border` dengan titik indikator `6px` (`size-1.5 rounded-full`).

---

## 3. Standarisasi Modul `src/lib/` (Modular, Ringkas, Zero Bloat)

Seluruh utilitas lintas frontend & server ditempatkan terpusat di `src/lib/` dengan tanggung jawab tunggal:

| File | Ekspor Utama | Peran & Layar Pengguna |
|---|---|---|
| `src/lib/utils.ts` *(ada)* | `cn(...inputs)` | Penggabungan class Tailwind + `clsx` + `tailwind-merge` untuk semua komponen UI & `shadcn/ui`. |
| `src/lib/format.ts` | `formatIdr`, `formatIdrCompact`, `formatDateId`, `formatPercent`, `formatSlaRemaining`, `copyToClipboard` | Format rupiah (`Rp 18.700.000` / `Rp 48,2 Miliar` / `Rp 420 Jt`), tanggal Indonesia (`12 Sep 2026`), sisa SLA, dan salin draf *e-Office* / No. SEP. |
| `src/lib/status-tokens.ts` | `getRiskZone`, `RISK_ZONE_META`, `CLAIM_STATUS_META`, `FRAUD_TYPOLOGY_META`, `CLUSTER_STAGE_META`, `PKS_STATUS_META`, `COMPLIANCE_GRADE_META` | Single source of truth enum D1 → label operasional Indonesia + kombinasi class warna FigCraft (`bg`, `border`, `text`, `dot`) untuk badge & panel keputusan. |
| `src/lib/scoring.ts` | `calculateCompositeRiskScore`, `scoreRepeatBilling`, `scoreTariffZScore`, `scoreBorAnomaly`, `scoreCircularReferral`, `evaluateEscalationTriggers` | Mesin penilaian deterministik 3 lapis (`0.40 * medis + 0.35 * statistik + 0.25 * jaringan`) dan evaluator 3 ambang eskalasi wilayah (`>= 10` tolakan, `>= Rp 100 Jt`, `>= 5` tolakan berturut-turut DPJP). |
| `src/lib/privacy.ts` | `maskNik`, `hashPatientCard`, `formatPatientLabel` | Penyamaran data pribadi sesuai **UU PDP No. 27/2022** berbasis Web Crypto API native (`crypto.subtle`, jalan di browser & Cloudflare `workerd`). |
| `src/lib/image-compressor.ts` | `compressImageBeforeUpload(file, preset)` | Kompresi client-side WebP via `browser-image-compression` (`document` ≤ 250 KB / 1600px, `photo` ≤ 150 KB / 1280px, `avatar` ≤ 50 KB / 400px) sesuai `BLUEPRINT.md` §3. |
| `src/lib/domain.check.ts` | Assert-based self-check (`bun src/lib/domain.check.ts`) | Verifikasi otomatis kalkulasi skor kasus `Pasien #B-9021` (= 88 / Merah), 3 ambang eskalasi, masking NIK/SHA-256, dan format rupiah/SLA. |

---

## 4. Rencana Eksekusi & Urutan Kerja (Saat Disetujui)

1. **Dependensi:** Pasang `browser-image-compression` dan `zod` lewat `bun add browser-image-compression zod`.
2. **Theme & Font (`src/styles.css` & `src/routes/__root.tsx`):**
   - Ganti total `src/styles.css` dengan token FigCraft (Primitives + Semantic Light + mapping `shadcn/ui` + 7 style tipografi + 3 utilitas khusus).
   - Perbarui `src/routes/__root.tsx`: `<html lang="id">`, load Google Fonts `Inter` & `Cascadia Mono`, hapus script/toggle dark mode starter dan tema hijau lagoon.
3. **Implementasi `src/lib/`:** Buat `format.ts`, `status-tokens.ts`, `scoring.ts`, `privacy.ts`, `image-compressor.ts`, dan `domain.check.ts`.
4. **Verifikasi:**
   - Jalankan `bun src/lib/domain.check.ts` (semua assertion lulus).
   - Jalankan `bunx tsc --noEmit` (0 error di seluruh `src/lib/`, `src/db/`, `src/styles.css`).
   - Simpan ringkasan token & path utilitas ke UTEKE Memory.

---

## 5. Catatan Risiko & Hal yang Sengaja Ditunda

- **Dark Mode:** FigCraft hanya mendefinisikan 1 mode (`Semantic · Light`), sehingga dark mode tidak dibangun agar konsisten dengan standar klinis audit dan menghindari duplikasi token yang tidak diminta.
- **Komponen `shadcn/ui` & `TopNavbar`:** Diinstal pada fase berikutnya (Fase 2B: UI Primitives & Layout Shell) setelah fondasi `styles.css` dan `src/lib/` ini disetujui dan diterapkan.
