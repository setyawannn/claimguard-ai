# Plan 07 — Fullstack Authentication, RBAC Middleware & Split-Screen Login UI

Rencana implementasi autentikasi penuh berbasis Cloudflare D1 + session cookie `HttpOnly` + middleware RBAC TanStack Start dan antarmuka Login split-screen (`login-02`).

## 1. Database & Seed (`Cloudflare D1`)
- **`src/db/schema.ts`**
  - Kolom `email` (`unique`, `notNull`) & `password_hash` (`notNull`) + `idx_users_email` pada tabel `users`.
  - Tabel `sessions` (`id` = SHA-256 hash token, `user_id` FK `users.id` cascade, `expires_at`, `created_at`) dengan index `idx_sessions_user` & `idx_sessions_expires`.
- **Migrasi & Seed 3 Persona**
  - Generate migrasi Drizzle (`0001_*.sql`), terapkan ke D1 lokal & remote (`claimguard-db` + `d1_migrations`).
  - `src/db/seed-auth.ts` menghasilkan `drizzle/seed-auth.sql` untuk akun default:
    - `rian@claimguard.id` (`verifikator` · KC Malang)
    - `anita@claimguard.id` (`auditor_wilayah` · Divre Jatim)
    - `rudi@claimguard.id` (`kepala_cabang` · KC Malang)

## 2. Backend Auth, Cookie & RBAC Middleware
- **`src/server/auth/password.ts`**: Web Crypto API `PBKDF2-SHA256` (`100_000` iterasi, salt acak 16-byte, constant-time verify), `generateSessionToken()`, `hashSessionToken()`.
- **`src/server/services/auth.service.ts`**: `authenticateUser`, `createUserSession` (TTL 7 hari), `resolveSessionUser`, `revokeSession`.
- **`src/server/guards/auth.guard.ts`**: Helper cookie `cg_session` (`HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` di production) & `getWorkerDb()`.
- **`src/server/middleware/auth.middleware.ts`**: `authMiddleware` (validasi session D1 → `context.user`, `context.db`) & `requireRoleMiddleware(allowedRoles)`.
- **`src/schemas/session.schema.ts` & `src/server/functions/session.fn.ts`**: `getSessionFn` (`SessionUser | null`), `loginFn` (`.validator(loginInputSchema)`), `logoutFn` (`.middleware([authMiddleware])`).
- **`src/server/auth/auth.check.ts`**: Self-check assert kriptografi password & session token.

## 3. Frontend Login UI, Route Guards, Toast & Fallbacks
- **Aset**: `public/assets/login-cover.png` pada panel kanan split-screen.
- **`src/lib/route-guards.ts`**: `sanitizeRedirectPath` (anti open-redirect), `requireRouteAuth`, `requireRouteRole`, dan `parseAppError`.
- **`src/queries/session.queries.ts`**: `sessionQueryOptions()`, `useLoginMutation()` (Sonner toast + navigate), `useLogoutMutation()` (`queryClient.clear()` + toast + `/login`).
- **`src/pages/auth/LoginPage.tsx` & `src/routes/login.tsx`**: Split-screen 2 kolom (`#2563EB` primary button, Email + Password only, tanpa Sign up / Forgot password / OAuth), `beforeLoad` redirect jika sudah login.
- **`src/routes/__root.tsx`**: Layout tanpa `AppShell`/`TopNavbar` di `/login` atau saat `user === null`, `<Toaster />` global, serta `notFoundComponent` (404) & `errorComponent` (403/401/Quota/Unexpected).
- **`src/components/layout/TopNavbar.tsx`**: Dropdown avatar menampilkan info akun + tombol **Keluar**.
- **`src/routes/index.tsx`**: Proteksi `beforeLoad` dengan `requireRouteAuth` dan konteks dashboard sesuai peran pengguna.

## 4. Verifikasi
- `bun src/server/auth/auth.check.ts`, `bun src/lib/domain.check.ts`, `bun src/db/d1-guard.check.ts`
- `bunx tsc --noEmit` & `bun run build`
