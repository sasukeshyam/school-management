import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { AdminDashboard }   from './AdminDashboard'
import { TeacherDashboard } from './TeacherDashboard'
import { StudentDashboard } from './StudentDashboard'
import { ParentDashboard }  from './ParentDashboard'
import { Spinner } from '@/components/ui/index.jsx'

export const DashboardPage = () => {
  const isAdmin   = useAuthStore((s) => s.isAdmin())
  const isTeacher = useAuthStore((s) => s.isTeacher())
  const isStudent = useAuthStore((s) => s.isStudent())
  const isParent  = useAuthStore((s) => s.isParent())

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => dashboardAPI.get().then((r) => r.data.data),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  if (isAdmin)   return <AdminDashboard data={data} />
  if (isTeacher) return <TeacherDashboard data={data} />
  if (isStudent) return <StudentDashboard data={data} />
  if (isParent)  return <ParentDashboard data={data} />
  return <AdminDashboard data={data} />
}
