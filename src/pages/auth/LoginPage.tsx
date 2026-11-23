import { ShieldCheck } from 'lucide-react'
import { LoginForm } from '#/components/domain/auth/LoginForm'

interface LoginPageProps {
  redirectTo?: string
}

export function LoginPage({ redirectTo }: LoginPageProps) {
  return (
    <div className="grid min-h-svh bg-[var(--color-bg-surface)] lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2.5 text-[var(--color-text-primary)]">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-[var(--color-action-primary)] text-white">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <span className="text-[16px] font-bold tracking-tight">
              ClaimGuard
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>

      <div className="relative hidden bg-[var(--color-bg-muted)] lg:block">
        <img
          src="/assets/login-cover.png"
          alt="Ilustrasi Platform ClaimGuard AI"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  )
}
