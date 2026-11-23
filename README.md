# ClaimGuard AI App

Aplikasi web fullstack **ClaimGuard AI** (*GovTech Fraud Intelligence & Auditor Copilot*) untuk pengawasan klaim FKRTL BPJS Kesehatan berbasis *Pre-Payment Smart Triage* dan *Human-in-the-Loop*, dibangun dengan **TanStack Start**, **Drizzle ORM**, dan **Cloudflare Workers / D1 / R2 / KV**.

> **Catatan Data:** Seluruh data klaim, peserta, dokter, dan rumah sakit pada aplikasi ini adalah **data sintetis/simulasi akademik** (bukan data JKN asli) dengan penyamaran identitas sesuai prinsip **UU PDP No. 27/2022**.

---

## Dokumentasi Utama

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arsitektur sistem, domain governance loop, dan struktur direktori.
- [BLUEPRINT.md](./BLUEPRINT.md) — Cetak biru infrastruktur Cloudflare Serverless & Zero-Cost Protection (Circuit Breaker 95%).
- [AGENT.md](./AGENT.md) — Aturan kerja, batasan ketat, dan konvensi memori lokal untuk AI coding agent.
- [docs/plans/README.md](./docs/plans/README.md) — Indeks status seluruh plan implementasi (sudah dikerjakan vs belum).
- [docs/plans/01-database-d1-plan.md](./docs/plans/01-database-d1-plan.md) — Rencana database Cloudflare D1, ERD, strategi index, dan migrasi.

---

## Prasyarat

- **Bun 1.3+** (package manager & runtime lokal utama)
- **Wrangler CLI** (sudah terpasang lokal sebagai devDependency)
- **Docker** (opsional untuk menjalankan **UTEKE Memory** lokal di `http://127.0.0.1:8767`)

---

## Instalasi & Pengembangan Lokal

```bash
bun install
```

### 1. Database Cloudflare D1 & Migrasi Drizzle

Generate file migrasi SQL dari `src/db/schema.ts`:

```bash
bun run db:generate
```

Terapkan migrasi ke **D1 Lokal** (simulasi Wrangler untuk development):

```bash
bun run db:migrate:local
```

Terapkan migrasi ke **D1 Remote** Cloudflare (butuh `bunx wrangler login`):

```bash
bun run db:migrate:remote
```

Cek daftar tabel pada D1 Lokal:

```bash
bunx wrangler d1 execute claimguard-db --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### 2. Menjalankan Server Development

```bash
bun run dev
```

Aplikasi berjalan di `http://localhost:3000`.

### 3. Build, Lint & Deploy

```bash
bun run build      # Build TanStack Start + Cloudflare Workers SSR bundle
bun run lint       # Jalankan ESLint
bun run format     # Format Prettier + autofix ESLint
bun run deploy     # Build + deploy ke Cloudflare Workers
```

---

## Konfigurasi Cloudflare (`wrangler.jsonc`)

- **Database D1 (`DB`):** `claimguard-db` dengan direktori migrasi `drizzle/`.
- **Workers KV (`USAGE_KV`):** Opsional saat dev lokal; wajib diaktifkan saat produksi untuk sinkronisasi **D1 Quota Guard 95%**.
- **Private R2 (`R2_BUCKET`):** `claimguard-private-media` (kelas Standard, tanpa akses publik `r2.dev`).
