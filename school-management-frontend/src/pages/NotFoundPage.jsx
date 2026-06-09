import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Home } from 'lucide-react'
export const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
    <p className="font-display text-8xl font-bold text-muted-foreground/20">404</p>
    <h1 className="font-display text-2xl font-bold">Page not found</h1>
    <p className="text-muted-foreground">The page you are looking for does not exist.</p>
    <Link to="/dashboard"><Button><Home className="h-4 w-4" /> Back to Dashboard</Button></Link>
  </div>
)
