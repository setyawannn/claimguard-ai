# Plan 09 — Detail Pemeriksaan & Keputusan Klaim (`/antrean/$claimId`) & Dynamic Status Triggers

Implementasi halaman detail pemeriksaan klaim untuk peran `verifikator` mengacu pada frame FigCraft **`UI 1.3`** & **`UI 1.3B`**, dilengkapi **4 Dynamic Status Trigger**, **Konfirmasi RS 2-state**, **On-Demand AI Copilot**, **ConfirmActionDialog**, tanda `*` merah, dan **Regional Escalation Trigger Loop** ke tabel `fraud_clusters`.

## 1. Skema, Backend & Escalation Trigger Loop
- `src/schemas/claims.schema.ts`: `recordHospitalResponseInputSchema`, `generateClaimAiInputSchema`, DTO `ClaimDetailResponse` & `SubmitClaimDecisionResult`.
- `src/server/services/claim-detail.service.ts`:
  - `getClaimDetail`: query klaim + RS + DPJP + 20 log audit terakhir + posisi `prevId`/`nextId` di antrean cabang.
  - `submitClaimDecision`: update status atomik + `audit_logs` + update `consecutiveRejections` DPJP + evaluasi `evaluateEscalationTriggers` (upsert `fraud_clusters` bila ambang 30 hari terlampaui atau eskalasi PK-JKN dicentang).
  - `recordHospitalResponse`: ubah status ke `balasan_rs` dan simpan ringkasan balasan RS.
  - `generateClaimAiCopilot`: on-demand narasi klinis / draf klarifikasi deterministik ter-cache di D1.
- `src/server/functions/claim-detail.fn.ts` & `src/queries/claim-detail.queries.ts`: terproteksi `requireRoleMiddleware(['verifikator'])` dengan Sonner toast terpusat.

## 2. Section Modular (`src/components/domain/claim-detail/`)
- `claim-detail.utils.ts`, `ClaimDetailHeaderSection.tsx`, `ClaimSummarySection.tsx`, `ClaimConfirmationStatusSection.tsx`, `ClaimVisualAuditSection.tsx`, `ClaimDecisionPanelSection.tsx`.
- Thin page orchestrator: `src/pages/verifikator/ClaimDetailPage.tsx`.
- Sibling routes tanpa konflik layout: `src/routes/antrean.index.tsx` & `src/routes/antrean.$claimId.tsx`.

## 3. Verifikasi
- `bun src/server/auth/auth.check.ts`, `bun src/lib/domain.check.ts`, `bun src/db/d1-guard.check.ts`
- `bun run build` & `bunx tsc --noEmit`
