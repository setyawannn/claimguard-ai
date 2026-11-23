# Plan 03 — Standarisasi Folder Architecture, Data Layer (TanStack Query), & Aturan DRY / Strict TypeScript

**Status:** Menunggu Diskusi & Persetujuan  
**Target Repo:** `repositories/claimguard-ai-app/`  
**Stack:** TanStack Start + TanStack Router + TanStack Query + TanStack Table v9 + React 19 + Tailwind CSS v4 + shadcn/ui + Zod + Drizzle ORM (Cloudflare D1)

---

## 1. Filosofi Arsitektur

Arsitektur ini dirancang dengan keseimbangan antara **separation of concerns yang tegas** (skala tim profesional) dan **zero over-engineering** (prinsip Ponytail — tanpa abstraksi/layer kosong yang tidak memberi nilai):

1. **Unidirectional Data & Dependency Flow:** Tidak ada *circular import* dan tidak ada komponen UI yang memanggil database langsung.
2. **End-to-End Type Safety (Single Source of Truth):**
   - Tipe tabel berasal langsung dari Drizzle (`InferSelectModel` / `InferInsertModel` di `src/db/schema.ts`).
   - Kontrak input/output RPC berasal dari Zod (`src/schemas/*.schema.ts`) yang dipakai bersama oleh `.inputValidator()` di `createServerFn`, `src/queries/`, dan form di `src/pages/`.
3. **Cache-Aware untuk Kuota Cloudflare D1:** Konfigurasi TanStack Query diselaraskan langsung dengan strategi **Zero-Cost Protection (`BLUEPRINT.md`)** agar perpindahan tab (*e-Office* ↔ ClaimGuard AI) tidak memboroskan `rows_read` D1.
4. **DRY & Composable UI:** Halaman (`src/pages/`) hanya merangkai komponen reusable + hooks; logika bisnis berada di `src/server/services/` dan `src/lib/`.

---

## 2. Struktur Folder Target (`src/`)

```text
src/
├── db/                          # [DONE - Plan 01] Lapisan akses database & storage Cloudflare
│   ├── schema.ts                # 9 tabel Drizzle SQLite/D1 + index
│   ├── d1-guard.ts              # Proxy 95% Circuit Breaker (D1 + KV)
│   ├── index.ts                 # Factory getDb(env) & tipe AppDatabase
│   ├── r2-storage.ts            # [Upcoming] uploadToR2Safe (<= 500 KB, Class A 95%)
│   └── seed.ts                  # [Upcoming] Seed data sintetis konsisten Audit 003
│
├── lib/                         # [DONE - Plan 02] Pure utilities lintas client & server (zero framework coupling)
│   ├── utils.ts                 # cn()
│   ├── format.ts                # formatIdr, formatIdrCompact, formatDateId, formatSlaRemaining, copyToClipboard
│   ├── status-tokens.ts         # Enum D1 -> label Indonesia + warna badge FigCraft
│   ├── scoring.ts               # Mesin skor 3-lapis deterministik + evaluator 3 trigger eskalasi
│   ├── privacy.ts               # Masking NIK & SHA-256 hash UU PDP
│   └── image-compressor.ts      # Kompresi client-side WebP (Web Worker)
│
├── schemas/                     # Kontrak validasi Zod & shared DTO types (dipakai FE & BE)
│   ├── claims.schema.ts         # Filter antrean, payload keputusan 4 state, bulk fast-track
│   ├── clusters.schema.ts       # Filter kluster wilayah, catat hasil sidak & TGR
│   ├── hospitals.schema.ts      # Filter rapor RS, evaluasi PKS, lock keputusan PKS
│   └── session.schema.ts        # Persona/role aktif (Mas Rian / Ibu Anita / Pak Rudi)
│
├── server/                      # Backend TanStack Start (HANYA berjalan di Cloudflare Workers)
│   ├── services/                # Pure business logic & query Drizzle (mudah di-unit-test)
│   │   ├── claims.service.ts    # Query antrean ber-index, keputusan HITL + audit_log + trigger loop
│   │   ├── clusters.service.ts  # Agregasi kluster wilayah, payload graf 5-simpul, finalisasi TGR
│   │   ├── hospitals.service.ts # Rapor 4 pilar PMK 16/2019, BOR, evaluasi & penguncian PKS
│   │   ├── copilot.service.ts   # On-Demand LLM narrative & draf e-Office (+ cache di D1)
│   │   └── session.service.ts   # Cookie session / role switcher 3 persona
│   └── functions/               # Thin RPC boundary (createServerFn + Zod inputValidator + role check)
│       ├── claims.fn.ts
│       ├── clusters.fn.ts
│       ├── hospitals.fn.ts
│       ├── copilot.fn.ts
│       └── session.fn.ts
│
├── queries/                     # Lapisan konsumsi backend & manajemen cache TanStack Query
│   ├── query-client.ts          # Factory QueryClient (staleTime, gcTime, no-retry quota guard)
│   ├── keys.ts                  # Hierarchical queryKeys factory (zero magic string)
│   ├── claims.queries.ts        # queryOptions + useMutation (invalidation lintas domain)
│   ├── clusters.queries.ts
│   ├── hospitals.queries.ts
│   └── session.queries.ts
│
├── components/                  # Komponen UI reusable (ketat DRY, dipisah berdasarkan abstraksi)
│   ├── ui/                      # Primitif shadcn/ui (button, card, badge, input, select, tabs, checkbox, dialog, skeleton, textarea)
│   ├── layout/                  # Shell aplikasi (TopNavbar 3-menu RBAC, PageHeader, AppShell)
│   ├── shared/                  # Komponen reusable ClaimGuard lintas peran (dari FigCraft UI/*)
│   │   ├── StatusBadge.tsx      # 7 status klaim, kluster, PKS, grade (dot 6px + pill)
│   │   ├── RiskScoreBadge.tsx   # Skor 0-100 + warna zona otomatis
│   │   ├── KpiCard.tsx          # Kartu KPI standar & FocalKpiCard (.focal-card)
│   │   ├── DataTable.tsx        # Wrapper generik TanStack Table v9 + paginasi + row selection
│   │   ├── FilterBar.tsx        # Bilah saring terbuka terpadu (select chips + debounced search)
│   │   ├── EmptyState.tsx       # State kosong & LoadingState (Row 13 FigCraft)
│   │   ├── QuotaErrorBanner.tsx # Penanganan ramah error D1_QUOTA_GUARD / R2_QUOTA_GUARD
│   │   ├── ExternalProcessBox.tsx # Kotak garis putus-putus (.external-boundary) untuk e-Office/SP2D/Sidak
│   │   └── CopyDraftButton.tsx  # Tombol salin clipboard + feedback "Tersalin"
│   └── domain/                  # Komponen domain khusus yang kompleks
│       ├── ClaimDecisionPanel.tsx     # Panel keputusan 4 state adaptif (UI 1.3 & 1.3B)
│       ├── MedicalTimeline.tsx        # Garis waktu rekam medis 30 hari (UI 1.3)
│       ├── TariffComparisonBar.tsx    # Grafik perbandingan tarif INA-CBG vs peer (UI 1.3)
│       ├── ConstellationGraphSvg.tsx  # Peta jejaring kolusi 5-simpul interaktif (UI 2.2)
│       ├── NodeInspectorPanel.tsx     # Panel inspektur dinamis 3 simpul (UI 2.2 & 2.2B)
│       └── FourPillarBreakdown.tsx    # Bedah 4 pilar kepatuhan PMK 16/2019 & BOR (UI 3.3)
│
├── pages/                       # Komposisi layar penuh (hanya merangkai components + queries)
│   ├── branch/                  # Role 1: Mas Rian (KC Malang)
│   │   ├── BranchDashboardPage.tsx    # UI 1.1
│   │   ├── AuditQueuePage.tsx         # UI 1.2
│   │   ├── ClaimDetailPage.tsx        # UI 1.3 & 1.3B
│   │   └── VerificationHistoryPage.tsx # UI 1.4
│   ├── regional/                # Role 2: Ibu Anita (Divre Jatim)
│   │   ├── RegionalDashboardPage.tsx  # UI 2.1
│   │   ├── InvestigationGraphPage.tsx # UI 2.2 & 2.2B
│   │   └── FollowUpRecapPage.tsx      # UI 2.3
│   └── executive/               # Role 3: Pak Rudi (Kepala Cabang)
│       ├── ExecutiveDashboardPage.tsx # UI 3.1
│       ├── HospitalScorecardPage.tsx  # UI 3.2
│       ├── HospitalDetailPksPage.tsx  # UI 3.3
│       └── PksPolicyRecapPage.tsx     # UI 3.4
│
└── routes/                      # Thin TanStack Router file-based routes (loader prefetch + render Page)
    ├── __root.tsx               # Shell global + TopNavbar + QueryClient context
    ├── index.tsx                # Dashboard kontekstual sesuai peran aktif (UI 1.1 / 2.1 / 3.1)
    ├── antrean.index.tsx        # /antrean (UI 1.2 + validateSearch Zod)
    ├── antrean.$claimId.tsx     # /antrean/:claimId (UI 1.3)
    ├── riwayat.tsx              # /riwayat (UI 1.4)
    ├── investigasi.tsx          # /investigasi (UI 2.2)
    ├── tindak-lanjut.tsx        # /tindak-lanjut (UI 2.3)
    ├── rapor-rs.index.tsx       # /rapor-rs (UI 3.2)
    ├── rapor-rs.$hospitalId.tsx # /rapor-rs/:hospitalId (UI 3.3)
    └── kebijakan.tsx            # /kebijakan (UI 3.4)
```

---

## 3. Alur Data & Batas Import (Dependency Rules)

```text
routes/ ──► pages/ ──► components/
   │           │
   │           └──► queries/ (TanStack Query hooks & queryOptions)
   │                   │
   └───────────────────┴──► server/functions/ (createServerFn RPC)
                                   │
                                   ▼
                            server/services/ (Business logic)
                                   │
                                   ▼
                                  db/ (Drizzle D1 + 95% Guard)
```

**Aturan Import Keras:**
1. `components/`, `pages/`, dan `queries/` **DILARANG** mengimpor dari `src/db/` atau `src/server/services/`. Satu-satunya gerbang ke server adalah `src/server/functions/*.fn.ts` (`createServerFn`).
2. `components/ui/` dan `components/shared/` **DILARANG** memanggil `queries/` atau `useMutation` secara langsung — terima data & callback via props agar 100% *pure* dan reusable di semua halaman.
3. `routes/*.tsx` dijaga **tipis (maksimal ~40 baris)**: hanya mendefinisikan `validateSearch` (Zod), `loader` (`context.queryClient.ensureQueryData(...)`), dan merender 1 komponen dari `src/pages/`.

---

## 4. Strategi State Management & Caching (TanStack Query + Router)

Kita membagi state menjadi **3 kategori tegas** (tanpa Redux/Zustand):

| Jenis State | Solusi | Contoh & Konfigurasi |
|---|---|---|
| **Server State** *(~95% aplikasi)* | **TanStack Query v5** (`src/queries/`) | `queryOptions` dipakai bersama di Route `loader` (`ensureQueryData`) dan komponen (`useSuspenseQuery`). |
| **URL / Filter State** | **TanStack Router `validateSearch`** | Filter RS, Status, Tipologi, pencarian, tab aktif, dan halaman paginasi di `/antrean` & `/rapor-rs` tersimpan di URL (bisa di-bookmark & tombol Back browser bekerja alami). |
| **Ephemeral UI State** | **React `useState`** | Checkbox baris terpilih, tab panel keputusan aktif di `UI 1.3`, simpul graf yang diklik di `UI 2.2`, draf teks catatan sebelum klik simpan. |

### Konfigurasi `QueryClient` Ramah Kuota D1 (`src/queries/query-client.ts`)
- `staleTime`: **`30_000` ms (30 detik)** default; **`60_000` ms** untuk KPI dashboard & daftar RS; **`Infinity`** untuk narasi On-Demand AI yang sudah di-cache di D1.
- `gcTime`: **`5 * 60_000` ms (5 menit)**.
- `refetchOnWindowFocus`: **`false`** — mencegah query ulang ke D1 setiap kali auditor berpindah tab ke *e-Office* lalu kembali ke ClaimGuard AI.
- `retry`: maksimal `1`, dan **langsung berhenti (`false`)** jika pesan error mengandung `D1_QUOTA_GUARD` atau `R2_QUOTA_GUARD`.

### Cross-Domain Cache Invalidation (Closed-Loop Trigger)
- Saat Mas Rian menekan **Tolak Klaim** (`useUpdateClaimDecision`): otomatis meng-invalidate `queryKeys.claims.all`, `queryKeys.clusters.all` (jika trigger wilayah menyala), dan `queryKeys.hospitals.all`.
- Saat Ibu Anita menyimpan **Hasil Sidak / TGR** (`useFinalizeCluster`): otomatis meng-invalidate `queryKeys.clusters.all` dan `queryKeys.hospitals.all` (agar TGR & status PKS di layar Pak Rudi langsung mutakhir).
- Saat Pak Rudi mengunci **Keputusan PKS** (`useLockPksDecision`): otomatis meng-invalidate `queryKeys.hospitals.all` dan `queryKeys.pks.all`.

---

## 5. Standar Strict TypeScript & DRY

1. **Zero `any`:** Gunakan `unknown` + validasi Zod pada batas data eksternal (`JSON.parse` kolom `*_json` wajib diparse lewat helper Zod terketik).
2. **`verbatimModuleSyntax`:** Selalu gunakan `import type { ... }` untuk impor tipe.
3. **Satu `DataTable<TData>` Generik:** Dibangun sekali di `src/components/shared/DataTable.tsx` memakai API resmi `@tanstack/react-table` v9 dan dipakai ulang di 5 halaman tabel (`UI 1.2`, `UI 1.4`, `UI 2.3`, `UI 3.2`, `UI 3.4`).
4. **Satu `StatusBadge` & `RiskScoreBadge`:** Membaca langsung dari `src/lib/status-tokens.ts` sehingga perubahan warna/label cukup di satu tempat.
5. **Pembersihan Starter Boilerplate:** Menghapus `src/routes/demo/*` (termasuk `demo/table.tsx` yang saat ini memblokir `bun run build`), `src/routes/about.tsx`, `src/data/demo-table-data.ts`, `src/components/ThemeToggle.tsx`, serta mengganti starter `Header.tsx`/`Footer.tsx` dengan `components/layout/TopNavbar.tsx`.

---

## 6. Langkah Eksekusi Plan 03 (Setelah Disetujui)

1. Bersihkan file demo starter (`src/routes/demo/*`, `src/data/demo-table-data.ts`, `src/components/ThemeToggle.tsx`).
2. Buat struktur folder & fondasi awal:
   - `src/queries/query-client.ts` & `src/queries/keys.ts` (sambungkan ke `src/integrations/tanstack-query/root-provider.tsx`).
   - `src/schemas/` (kontrak Zod dasar untuk `session`, `claims`, `clusters`, `hospitals`).
   - Placeholder/barrel bersih untuk `src/server/services/`, `src/server/functions/`, `src/components/layout/`, `src/components/shared/`.
3. Perbarui `ARCHITECTURE.md` & `AGENT.md` agar mengunci aturan import & folder ini sebagai standar resmi proyek.
4. Verifikasi `bunx tsc --noEmit` dan `bun run build` **lulus 100% (0 error)** untuk pertama kalinya setelah demo starter dibersihkan.
