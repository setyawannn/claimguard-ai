# AGENT.md — Panduan Kerja AI Fullstack Agent (`claimguard-ai-app`)

Dokumen ini menjadi kontrak kerja bagi AI coding agent saat mengembangkan aplikasi fullstack di dalam `repositories/claimguard-ai-app/`.

---

## 1. Sumber Kebenaran & Skill Aktif

Sebelum menulis atau mengubah kode, selalu rujuk dokumen dan skill berikut:
- **Arsitektur & Infra:** [ARCHITECTURE.md](./ARCHITECTURE.md), [BLUEPRINT.md](./BLUEPRINT.md), dan indeks rencana fase di [docs/plans/README.md](./docs/plans/README.md).
- **Desain & Alur Bisnis (Root Repo):** `../../design/exports/LAPORAN-LENGKAP-CLAIMGUARD-AI.md`, `../../docs/03`–`05`, dan `../../anti-slop/audit-003-full-system-ui-ux-2026-11-23.md`.
- **Workspace Skills (`.agents/skills/`):**
  - `ponytail` (+ `AGENTS.md`): solusi paling ringkas yang tuntas, tanpa over-engineering, setiap logika non-trivial wajib punya test/self-check.
  - `claimguard-backend`: Drizzle D1, Quota Guard 95%, Private R2, UU PDP, skor deterministik 3-lapis, trigger loop.
  - `claimguard-frontend`: TanStack Start/Router/Query/Table, Tailwind v4, shadcn/ui, kompresi WebP client-side, design tokens GovTech.
  - `antislop` + `antislop-ui` + `antislop-human`: kualitas visual, kontras WCAG AA, aksesibilitas, zero AI-slop.

---

## 2. Integrasi Memori Lokal (UTEKE Memory di Docker)

Proyek ini menggunakan **UTEKE Memory** lokal yang berjalan di Docker (`codecoradev/uteke` pada `http://127.0.0.1:8767`, API v2) dengan namespace **`claimguard-ai`**.

- **Sebelum memulai fase besar:** Recall konteks keputusan & konvensi sebelumnya:
  ```bash
  curl -s -X POST http://127.0.0.1:8767/api/v2/recall \
    -H "Content-Type: application/json" \
    -d '{"query":"<topik tugas>","namespace":"claimguard-ai","limit":8}'
  ```
- **Setelah menyelesaikan keputusan arsitektur, migrasi DB, atau perbaikan bug penting:** Simpan ringkasan padat ke memori:
  ```bash
  curl -s -X POST http://127.0.0.1:8767/api/v2/remember \
    -H "Content-Type: application/json" \
    -d '{"content":"<ringkasan keputusan & file terkait>","namespace":"claimguard-ai","tags":["<tag1>","<tag2>"],"memory_type":"decision"}'
  ```
- **Jangan pernah menyimpan secret, token API, atau kredensial ke UTEKE Memory.**

---

## 3. Batasan Ketat (Non-Negotiable)

1. **Cloudflare Workers Runtime (`workerd`):**
   - Dilarang memakai `better-sqlite3` atau native Node addon di kode runtime SSR/ServerFn. Selalu gunakan `drizzle-orm/d1` melalui `getDb(env)`.
   - Dilarang memproses/mengompresi gambar di Worker (batas CPU 10 ms). Kompresi wajib dilakukan di browser (`image-compressor.ts`) dan divalidasi ulang di server (`<= 500 KB`, `image/webp` / `image/avif`).
   - Setiap query daftar di D1 wajib menggunakan `.limit()` dan filter kolom terindeks.
2. **Governance & Regulasi:**
   - **UU PDP No. 27/2022:** Dilarang menyimpan atau menampilkan nama lengkap asli, NIK mentah, nomor HP, atau alamat pasien.
   - **Human-in-the-Loop:** Dilarang membuat fitur *auto-reject* atau *auto-webhook* eksternal ke perbankan / *e-Office*.
   - **Zero Blackbox ML & On-Demand LLM:** Skor 0–100 wajib murni deterministik (0 token LLM saat ingest).
3. **Konsistensi Data Audit 003:**
   - `RSUD Medika Malang` (`#JTM-01`) = Kardiologi/PCI (`37.22`) oleh `dr. Hendra Wijaya, Sp.JP`, BOR Total 98% / Kardiologi 118%, TGR **Rp 420 Jt**.
   - `RS Hermosa Malang` (`#JTM-02`) = Tipe C · 110 TT, Phantom Ranap & Unbundling Obat, TGR **Rp 200 Jt**. Total TGR KC Malang = **Rp 620 Jt**.

---

## 4. Checklist Verifikasi Sebelum Menyelesaikan Tugas

- Package manager lokal wajib menggunakan **Bun** (`bun install`, `bun run`, `bunx`) — jangan gunakan `npm` atau membuat `package-lock.json`.
- Validasi skema & migrasi: `bun run db:generate` dan `bun run db:migrate:local`.
- Validasi tipe & bundle Workers: `bunx tsc --noEmit` dan `bun run build`.
- Validasi logika non-trivial: jalankan unit test / self-check (`bun src/db/d1-guard.check.ts`, scoring engine, trigger eskalasi).
- Catat milestone penting ke `docs/plans/README.md` (perbarui status plan) dan UTEKE Memory (`namespace: claimguard-ai`).
