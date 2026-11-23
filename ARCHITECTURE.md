# ARCHITECTURE.md — ClaimGuard AI Application

Dokumen arsitektur teknis aplikasi fullstack **ClaimGuard AI** (*GovTech Fraud Intelligence & Auditor Copilot* untuk pengawasan klaim FKRTL BPJS Kesehatan).

---

## 1. Gambaran Besar Arsitektur Serverless

```text
[Browser Verifikator / Auditor / Pimpinan]
   │
   ├── (Upload Bukti) ──► Client-Side WebP Compressor (browser-image-compression, Web Worker)
   │                             │ (< 250 KB, EXIF stripped)
   │                             ▼
   ├──► https://claimguard.setyawannn.site (TanStack Start SSR on Cloudflare Workers)
   │       ├── File-based Routing (TanStack Router) + TanStack Query + TanStack Table v9
   │       ├── Server Functions (createServerFn + input validation)
   │       ├── Domain Engine (UU PDP Masking · 3-Layer Deterministic Scoring · Trigger Loop)
   │       ├── On-Demand LLM Copilot (0 token saat ingest; hanya dipanggil saat klik tombol)
   │       ├── D1 Quota Guard (95% Circuit Breaker via Proxy + Workers KV) ──► Cloudflare D1
   │       └── R2 Safe Upload Controller (<= 500 KB, WebP/AVIF, Class A 95%) ──► Private R2
   │
   └──► https://cdn.claimguard.setyawannn.site/<key> (Standalone CDN Gateway Worker)
           ├── 1. Cloudflare Edge Cache (caches.default) ──► HIT (0 D1 & 0 R2)
           ├── 2. Cek Class B 95% di D1 (< 9.5M/bln) ──► >= 95%: Fallback no-store
           └── 3. Fetch Private R2 ──► Buffered D1 update (25 read / 15s) ──► Edge Cache
```

---

## 2. Stack Teknologi

| Lapisan | Teknologi | Catatan Arsitektur |
|---|---|---|
| **Frontend & SSR** | TanStack Start, React 19, TanStack Router, TanStack Query, TanStack Table v9 | File-based routing di `src/routes/`, SSR pada Cloudflare Workers via `@cloudflare/vite-plugin` |
| **UI & Styling** | Tailwind CSS v4, `shadcn/ui` (`new-york`), `lucide-react` | Estetika *Minimalist Clinical-Precision GovTech* (`Inter` + `Cascadia Mono`, Top Navigation Layout tanpa sidebar kiri) |
| **Client Media** | `browser-image-compression` (Web Worker) | Wajib kompresi ke `.webp` di browser karena batas CPU Cloudflare Workers Free hanya 10 ms/request |
| **Database** | Cloudflare D1 (SQLite) + Drizzle ORM (`drizzle-orm/d1`) | Skema portabel di `src/db/schema.ts`, dilindungi `createGuardedD1` (95% batas harian) |
| **Object Storage & CDN** | Cloudflare R2 (Standard, 100% Private) + Workers KV + `cdn-gateway` Worker | Metadata file dicatat di tabel D1 `media_files` (dilarang `R2.list()`) |
| **Runtime** | Cloudflare Workers (`workerd`, `nodejs_compat`) | Tanpa addon native Node (`better-sqlite3` tidak digunakan di runtime Worker) |

---

## 3. Arsitektur Domain & Governance Loop

### A. Empat Batasan Keras Sistem (Strict Boundaries)
1. **Mutlak Human-in-the-Loop:** Sistem hanya menyajikan skor, triangulasi bukti, dan draf narasi. Tidak ada *auto-reject* atau eksekusi keputusan tanpa petugas manusia.
2. **No External Auto-Webhook:** Tombol di aplikasi bersifat internal (salin draf ke clipboard, ekspor PDF/CSV, simpan status di D1). Korespondensi resmi tetap lewat *e-Office* dan SP2D BPJS Kesehatan.
3. **Zero Blackbox ML:** Skor risiko 0–100 dihitung deterministik 100% transparan:
   $$\text{Skor} = \text{round}(0{,}40 \times S_{\text{medis}} + 0{,}35 \times S_{\text{statistik}} + 0{,}25 \times S_{\text{jaringan}})$$
4. **On-Demand LLM:** Pemindaian massal 100% klaim memakai 0 token LLM. Narasi klinis & draf klarifikasi hanya di-generate ketika verifikator menekan tombol aksi, lalu hasilnya di-cache di D1.

### B. Alur Data & Trigger Eskalasi Lintas 3 Peran
1. **Lini 1 — Mas Rian (Verifikator KC Malang):**
   - Menyetujui cepat (*Fast-Track*) klaim Zona Hijau (0–39) dan menelaah klaim Zona Kuning (40–69) / Merah (70–100).
   - Setiap keputusan menulis baris permanen di `audit_logs`.
2. **Trigger Loop Otomatis (Window 30 Hari):**
   - Penolakan klaim memicu evaluasi 3 ambang batas: **≥ 10 penolakan kluster/RS**, **≥ Rp 100 Jt eksposur finansial/RS**, atau **≥ 5 penolakan berturut-turut pada 1 DPJP**.
   - Jika terlampaui, sistem otomatis memunculkan/memperbarui baris di `fraud_clusters`.
3. **Lini 2 — Ibu Anita (Pengawas Wilayah Divre Jatim):**
   - Menganalisis peta jejaring kolusi 5-simpul (`RS Perujuk` → `DPJP Hub` → `RS Penagih` → `Kluster SEP` + kurva rujuk balik), mengunduh checklist sidak, dan mencatat hasil pemeriksaan fisik (CCTV, buku register, BAP).
   - Penetapan `Tagih TGR` & `Evaluasi PKS` otomatis memperbarui beban TGR dan status PKS pada tabel `hospitals`.
4. **Lini 3 — Pak Rudi (Kepala Cabang KC Malang):**
   - Memantau *Cost Avoidance*, pemulihan TGR, SLA Fast-Track, rapor 4 pilar PMK 16/2019 per FKRTL, serta mengunci keputusan kontrak PKS 2027 di `pks_decisions`.

---

## 4. Struktur Direktori Target

```text
repositories/claimguard-ai-app/
├── docs/plans/            # Plan implementasi per fase & indeks status (README.md)
├── drizzle/               # File migrasi SQL hasil drizzle-kit generate
├── public/assets/         # Aset statis termasuk placeholder.webp (fallback CDN)
├── src/
│   ├── db/                # Drizzle D1 schema, d1-guard.ts (95% Circuit Breaker), getDb()
│   ├── lib/               # Pure utilities (format, status-tokens, scoring, privacy, image-compressor)
│   ├── schemas/           # Kontrak validasi Zod & DTO terketik (dipakai FE & BE)
│   ├── server/
│   │   ├── guards/        # Trust-boundary RBAC & session cookie guard
│   │   ├── services/      # Pure business logic & query Drizzle terindeks
│   │   └── functions/     # Thin createServerFn RPC endpoints
│   ├── queries/           # TanStack QueryClient (ramah kuota D1), queryKeys, queryOptions & mutations
│   ├── components/
│   │   ├── ui/            # Primitif shadcn/ui
│   │   ├── layout/        # TopNavbar RBAC 3-menu (tanpa sidebar kiri)
│   │   ├── shared/        # Komponen DRY lintas peran (StatusBadge, RiskScoreBadge, DataTable, dll.)
│   │   └── domain/        # Komponen domain khusus (DecisionPanel, ConstellationGraphSvg, dll.)
│   ├── pages/             # Komposisi layar penuh (branch/, regional/, executive/)
│   └── routes/            # Thin TanStack Router file-based routes (validateSearch + loader + render Page)
├── AGENT.md               # Panduan kerja & batasan AI coding agent
├── AGENTS.md              # Ruleset Ponytail (lazy senior dev mode)
├── ARCHITECTURE.md        # Dokumen ini
├── BLUEPRINT.md           # Cetak biru infrastruktur Cloudflare 95% Circuit Breaker
├── README.md              # Panduan setup, migrasi D1, dan perintah dev
└── wrangler.jsonc         # Konfigurasi Cloudflare Workers & binding D1/R2/KV
```
