import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useLoginMutation } from '#/queries/session.queries'
import { loginInputSchema } from '#/schemas/session.schema'

interface LoginFormProps {
  redirectTo?: string
}

interface FieldErrors {
  email?: string
  password?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const loginMutation = useLoginMutation(redirectTo)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldErrors({})

    const parsed = loginInputSchema.safeParse({ email, password })
    if (!parsed.success) {
      const nextErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'email' && !nextErrors.email) nextErrors.email = issue.message
        if (key === 'password' && !nextErrors.password) {
          nextErrors.password = issue.message
        }
      }
      setFieldErrors(nextErrors)
      return
    }

    loginMutation.mutate(parsed.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Masuk ke akun Anda
        </h1>
        <p className="text-sm text-balance text-[var(--color-text-secondary)]">
          Masukkan email dan kata sandi untuk mengakses pengawasan klaim
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label
            htmlFor="email"
            className="text-[13px] font-medium text-[var(--color-text-primary)]"
          >
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@claimguard.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            disabled={loginMutation.isPending}
            className="h-10 border-[var(--color-border-default)] bg-white"
          />
          {fieldErrors.email && (
            <p className="text-xs text-[var(--color-risk-high)]">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label
            htmlFor="password"
            className="text-[13px] font-medium text-[var(--color-text-primary)]"
          >
            Kata Sandi
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              disabled={loginMutation.isPending}
              className="h-10 border-[var(--color-border-default)] bg-white pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'
              }
              className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-[var(--color-risk-high)]">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-1 h-10 w-full bg-[var(--color-action-primary)] font-semibold text-white hover:bg-[var(--color-action-primary-hover)]"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Memverifikasi...</span>
            </>
          ) : (
            'Masuk'
          )}
        </Button>
      </div>
    </form>
  )
}
