# Plan 06 — Interaktivitas Filter, Audit Tipografi Eksak FigCraft, Chart Interaktif & Full-Width Responsive

**Status:** Selesai  
**Acuan Eksak:** FigCraft MCP `UI 1.1` (`id: 8589938881`) & `design/exports/09-ui-1-1-mas-rian-dashboard.png`

---

## 1. Perbaikan Utama

1. **Filter Tanggal & Filter RS Interaktif (`Select` Pill + Live Filtering + CSV Export):**
   - Mengganti tombol statis periode dan RS menjadi `<Select>` pill interaktif yang menyaring KPI, chart volume, dan daftar kasus prioritas secara langsung, ditambah ekspor CSV harian nyata.
2. **Audit Tipografi Eksak FigCraft (`UI 1.1`):**
   - `GreetingTitle`: `26px Bold`; `GreetingSub`: `13px Regular`.
   - Judul KPI standar: `14px SemiBold` `#0F172A`; Nilai Card 1: `24px Bold` + sub `11px Regular`.
   - Focal Card: `20px Bold` `#FFFFFF` + desc `12px Regular` + footer `11px SemiBold`.
   - Card 3 & Card 4: angka `26px Bold` dan teks pendamping (`Rp 9,8 Miliar tertahan` / `SLA < 24 jam`) sejajar **satu baseline** dengan `11px Medium`.
   - `SectionCard`: judul `16px Bold`, subjudul `12px Regular`; `ClaimPriorityRow`: judul `13px SemiBold`, meta `12px Regular`, nominal `13px SemiBold`; `FaskesAnomalyRow`: nama `13px SemiBold`, meta `11px Regular`.
3. **Chart Interaktif `src/components/shared/VolumeTrendChart.tsx`:**
   - Kurva halus cubic Bezier `#2563EB` dengan gradasi area biru lembut, sumbu X (`10px Medium` `#94A3B8` + `Hari Ini` `10px SemiBold` `#2563EB`), serta tooltip + garis panduan saat hover/fokus.
4. **Container Full-Width Responsive (`AppShell.tsx`):**
   - Menghapus `max-w-[1440px]` agar tidak menyisakan ruang kosong berlebih di layar lebar (`w-full px-4 py-5 sm:px-6 lg:px-8 xl:px-10`).
