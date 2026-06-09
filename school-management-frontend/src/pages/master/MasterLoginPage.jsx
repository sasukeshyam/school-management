import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/index.jsx'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import api from '@/api/axios'
import { useAuthStore } from '@/store/authStore'
import { ToastContainer } from '@/components/ui/Toast'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
})

// Master school_id stored in env or hardcoded for master admin
const MASTER_SCHOOL_ID = import.meta.env.VITE_MASTER_SCHOOL_ID || ''

export const MasterLoginPage = () => {
  const [showPass, setShowPass] = useState(false)
  const setAuth    = useAuthStore(s => s.setAuth)
  const navigate   = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: ({ email, password }) =>
      api.post('/auth/login', { email, password, school_id: MASTER_SCHOOL_ID }),
    onSuccess: ({ data }) => {
      // Verify this is actually a super admin
      if (!data.data.roles.includes('super_admin')) {
        toast.error('Access denied. Super Admin only.')
        return
      }
      setAuth(data.data)
      toast.success('Welcome, Master Admin!')
      navigate('/master/dashboard')
    },
    onError: e => toast.error(e.response?.data?.message || 'Login failed'),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <ToastContainer />
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-bold text-2xl">Master Admin</h1>
            <p className="text-sm text-muted-foreground mt-0.5">EduCore School Management Platform</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-base">Sign in to Master Panel</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage all schools from one place</p>
          </div>

          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="superadmin@educore.com"
                {...register('email')} className={cn(errors.email && 'border-destructive')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  {...register('password')} className={cn('pr-9', errors.password && 'border-destructive')} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" loading={mutation.isPending} size="lg">
              Sign in to Master Panel
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          This panel is for platform administrators only. <br />
          School admins should use the <a href="/login" className="text-primary hover:underline">regular login</a>.
        </p>
      </div>
    </div>
  )
}