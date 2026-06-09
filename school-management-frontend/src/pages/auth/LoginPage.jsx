import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { School, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Label, Card, CardContent } from '@/components/ui/index.jsx'
import { useLogin } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

const schema = z.object({
  school_id: z.string().min(1, 'School ID is required'),
  email:     z.string().email('Enter a valid email'),
  password:  z.string().min(6, 'Password must be at least 6 characters'),
})

export const LoginPage = () => {
  const [showPass, setShowPass] = useState(false)
  const { mutate: login, isPending } = useLogin()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-sidebar p-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <School className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">EduCore</span>
        </div>
        <div className="space-y-4">
          <h1 className="font-display text-4xl font-bold text-white leading-tight">
            Complete School<br />Management System
          </h1>
          <p className="text-sidebar-foreground/60 text-lg leading-relaxed">
            Manage students, staff, fees, exams, attendance and more — all in one place.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '50+', sub: 'Modules' },
            { label: '5',   sub: 'Role types' },
            { label: '∞',   sub: 'Students' },
            { label: '100%',sub: 'Secure' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-sidebar-border p-3.5">
              <p className="font-display text-2xl font-bold text-white">{s.label}</p>
              <p className="text-sm text-sidebar-foreground/50 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <School className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">EduCore</span>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl">Welcome back</h2>
            <p className="text-muted-foreground mt-1 text-sm">Sign in to your school account</p>
          </div>

          <form onSubmit={handleSubmit(login)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="school_id">School ID</Label>
              <Input
                id="school_id"
                placeholder="Enter your school ID"
                {...register('school_id')}
                className={cn(errors.school_id && 'border-destructive')}
              />
              {errors.school_id && <p className="text-xs text-destructive">{errors.school_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@school.com"
                {...register('email')}
                className={cn(errors.email && 'border-destructive')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={cn('pr-9', errors.password && 'border-destructive')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" loading={isPending} size="lg">
              Sign in
            </Button>
          </form>

          <div className="rounded-lg border border-dashed border-border p-3.5 text-sm space-y-1.5">
            <p className="font-medium text-foreground text-xs uppercase tracking-wider">Demo credentials</p>
            <div className="text-muted-foreground space-y-1 font-mono text-xs">
              <p>Email: superadmin@demoschool.com</p>
              <p>Pass: Admin@123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
