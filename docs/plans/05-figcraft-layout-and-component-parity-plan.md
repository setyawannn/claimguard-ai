# Plan 05 — Paritas Visual Komponen Layout, Avatar, Card, & Font Sesuai FigCraft Terbaru

**Status:** Belum Dikerjakan  
**Acuan Langsung:** `design/claimguard-ai-design.figcraft` (`UI/TopNavbar`, `High-Fidelity UI Components Row 1–13`) & `design/exports/07-components-hifi-ui.png`, `09-ui-1-1-mas-rian-dashboard.png`

---

## 1. Hasil Audit Gap (Implementasi Saat Ini vs Desain FigCraft Terbaru)

| Elemen | Implementasi Saat Ini (Belum Sesuai) | Desain FigCraft Terbaru (Target Eksak) |
|---|---|---|
| **Navbar Container** | Sticky bar full-width menempel di atas (`border-b`) | **Floating white card** di dalam kanvas `#F8FAFC` (`rounded-[20px]`, `border #E2E8F0`, `bg-white`, `px-5 py-3`, `max-w-[1440px]`) |
| **Brand & Unit Badge** | `ClaimGuard AI` + badge abu-abu | `LogoMark` `34×34px` `rounded-[10px]` `#2563EB` + **`ClaimGuard`** (`Inter Bold 16px`) + `BranchBadge` pill biru (`#EFF6FF`, border `#BFDBFE`, teks `#2563EB`, `px-2.5 py-1`) |
| **Center Nav Pills** | 3 link terpisah, aktif pakai latar biru muda | **Segmented pill container** (`rounded-full bg-[#F8FAFC] border #E2E8F0 p-1`); tab aktif **solid biru `#2563EB` teks putih**; counter tab tidak aktif (`780`, `14`, `3`) **pill merah lembut (`#FEF2F2` / `#DC2626`)**, saat aktif translucent putih |
| **Right Profile & Avatar** | Dropdown `<Select>` panjang | **Tombol lonceng notifikasi** (`36×36px rounded-full border #E2E8F0`) + **Avatar lingkaran inisial** (`MR`/`IA`/`PR`, `36×36px rounded-full bg-[#EFF6FF] border #BFDBFE text-[#2563EB]`) + 2 baris teks (`Mas Rian` / `Verifikator Cabang`) yang membuka **DropdownMenu Role Switcher** saat diklik |
| **Radius Card & Row** | `rounded-[12px]` (`--radius-card`) tanpa elevasi halus | Card utama (`KpiCard`, `FocalKpiCard`, Panel Daftar) memakai **`rounded-[20px]` (`--radius-card-lg`)** + `shadow-[0_1px_3px_rgba(15,23,42,0.04)]`; baris dalam panel (`ClaimPriorityRow`, `FaskesAnomalyRow`) memakai **`rounded-[14px]`** |
| **Button & Filter Chips** | Varian default shadcn | 4 varian persis FigCraft Row 1 (`Primary` solid `#2563EB` pill, `WhiteFocal` putih teks `#2563EB` di dalam focal card, `SubtleAction` `#EFF6FF` border `#BFDBFE` `rounded-[10px]`, `OutlinePill` putih border `#E2E8F0` pill) + `FilterChip` & `SearchInput` berbentuk **pill (`rounded-full`)** |
| **Font Loading** | Hanya Google Fonts link (rentan fallback sistem saat offline/lambat) | Self-host **`@fontsource-variable/inter`** & **`@fontsource/cascadia-mono`** diimpor di `src/styles.css` agar 100% identik dengan FigCraft di semua perangkat & tanpa FOUT |

---

## 2. Tambahan Paket & Primitif `shadcn/ui` yang Dibutuhkan

1. **Font Self-Hosted (Bun):**
   - `bun add @fontsource-variable/inter @fontsource/cascadia-mono`
2. **Primitif `shadcn/ui` Tambahan (2 saja):**
   - `bunx --bun shadcn@latest add --yes avatar dropdown-menu`
   - `avatar` → Avatar inisial `MR`, `IA`, `PR` di `TopNavbar`.
   - `dropdown-menu` → Menu klik pada blok Avatar + Nama (pindah peran Mas Rian / Ibu Anita / Pak Rudi) dan popover ringkas tombol lonceng notifikasi.

---

## 3. Komponen Layout & UI yang Dibangun / Disempurnakan

1. **Font & Token Typography (`src/styles.css` & `src/routes/__root.tsx`):**
   - Impor `@fontsource-variable/inter` dan `@fontsource/cascadia-mono/400.css` + `600.css` + `700.css` langsung di `src/styles.css`, hapus link Google Fonts duplikat di `__root.tsx`.
   - Set `--font-sans: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif` dan `--font-mono: 'Cascadia Mono', ui-monospace, SFMono-Regular, monospace`.
   - Tambah helper elevasi halus `.card-surface` (`rounded-[20px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] shadow-[0_1px_3px_rgba(15,23,42,0.04)]`).
2. **Layout Shell (`src/components/layout/`):**
   - **`TopNavbar.tsx` (Refactor Total Sesuai FigCraft Row 4):** Floating `rounded-[20px]` card, `LogoMark` `34×34px` `rounded-[10px]` + `ClaimGuard` + `BranchBadge` biru, segmented center pill bar dengan counter merah/putih, tombol `Bell` lingkaran, `UserAvatar` (`MR`/`IA`/`PR`) + nama/jabatan dengan `DropdownMenu` Role Switcher.
   - **`PageHeader.tsx` (Baru):** Baris sapaan/judul halaman (`Selamat Pagi, Mas Rian` + sub-judul deskriptif + slot tombol aksi kanan).
   - **`AppShell.tsx` (Baru):** Wrapper kanvas `#F8FAFC` (`max-w-[1440px] mx-auto px-6 py-5 space-y-6`) yang membungkus `TopNavbar` + konten halaman di `__root.tsx`.
3. **Komponen Reusable FigCraft (`src/components/shared/`):**
   - **`ActionButton.tsx` atau ekstensi varian di `ui/button.tsx`:** Tambah varian `whiteFocal`, `subtleAction`, dan `outlinePill` agar 4 tombol FigCraft Row 1 tersedia satu pintu.
   - **`KpiCard.tsx` (Refactor):** Update ke `rounded-[20px]`, padding `24px`, support slot visual bawah (sparkline / 2 progress bar risiko / 2 status bar klarifikasi) dan tombol `WhiteFocal` pada `FocalKpiCard`.
   - **`SectionCard.tsx` (Baru):** Kartu panel `rounded-[20px]` dengan header judul + sub-judul + tombol kanan (`Lihat Semua Antrean (780)`), dipakai di semua dashboard & detail.
   - **`ClaimPriorityRow.tsx` & `FaskesAnomalyRow.tsx` (Baru — FigCraft Row 3):** Baris ringkas `rounded-[14px]` untuk daftar kasus prioritas dan daftar anomali/rapor per rumah sakit.
   - **`FilterBar.tsx` (Refactor):** Ubah chip filter & kotak pencarian menjadi bentuk **pill (`rounded-full`)** bersih sesuai FigCraft Row 2 (`UI 1.1` & `UI 1.2`).
   - **`ProgressMetricBar.tsx` (Baru):** Bar progres horizontal tipis (`h-1.5 rounded-full`) untuk breakdown Risiko Tinggi vs Perhatian dan Progres Klarifikasi RS pada kartu KPI.

---

## 4. Verifikasi Eksekusi Plan 05

- Visual check komponen & layout di browser (`bun run dev`) atau preview terhadap `09-ui-1-1-mas-rian-dashboard.png` dan `07-components-hifi-ui.png`:
  - `TopNavbar` floating `rounded-[20px]`, segmented center pill, avatar inisial `MR`/`IA`/`PR` + lonceng notifikasi.
  - Font `Inter Variable` & `Cascadia Mono` aktif tanpa fallback sistem.
  - Kartu KPI (`rounded-[20px]`), `ClaimPriorityRow`, `FaskesAnomalyRow`, dan `FilterBar` pill identik dengan FigCraft.
- `bunx tsc --noEmit` & `bun run build` lulus 0 error.
- Perbarui status Plan 05 di `docs/plans/README.md` menjadi **Selesai** dan simpan ke UTEKE Memory.
