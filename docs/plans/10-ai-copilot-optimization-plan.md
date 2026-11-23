# Plan 10 — Optimasi AI Copilot (Gemini API + Single-Call Cache-First D1)

Optimasi konsumsi token AI dan kualitas narasi bacaan pada detail klaim (`/antrean/$claimId`):
1. **Single-Call JSON (1× Panggilan = Narasi + Draf):** Menghasilkan `ringkasanKasus`, `analisisAnomali`, `fokusPemeriksaan`, dan `drafKlarifikasi` sekaligus dengan `maxOutputTokens: 650` dan `temperature: 0.2` via `gemini-2.5-flash-lite` (auto-fallback `gemini-2.5-flash` lalu fallback deterministik).
2. **Cache-First Permanen di D1 (`ai_narrative_cache` & `ai_draft_cache`):** Hanya berkas yang dibuka pertama kali tanpa cache yang memanggil Gemini (otomatis 1×, `0` token saat dibuka ulang, dan `0` token pada halaman daftar).
3. **Sanitizer Bebas Simbol:** `sanitizeAiText` membersihkan seluruh simbol Markdown (`**`, `__`, `#`, `` ` ``, bullet `*`, karakter kontrol) sebelum disimpan ke D1.
4. **Keamanan Env:** Memindahkan kredensial ke `.dev.vars` (gitignored) dan mengembalikan `.dev.vars.example` ke placeholder aman.
