import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/useToast'

export const useLogin = () => {
  const setAuth  = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: ({ data }) => {
      setAuth(data.data)
      const roles = data.data.roles || []
      toast.success('Welcome back!')

      // Navigate based on role from API response directly (store may not be updated yet)
      if (roles.includes('super_admin')) {
        navigate('/master/dashboard', { replace: true })
      } else if (roles.includes('student') || roles.includes('parent')) {
        navigate('/student', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed')
    },
  })
}

export const useLogout = () => {
  const logout   = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authAPI.logout,
    onSettled: () => {
      logout()
      navigate('/login', { replace: true })
    },
  })
}

export const useMe = () => {
  const token = useAuthStore(s => s.accessToken)
  return useQuery({
    queryKey: ['me'],
    queryFn:  () => authAPI.me().then(r => r.data.data.user),
    enabled:  !!token,
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess:  () => toast.success('Password changed successfully'),
    onError:    (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  })