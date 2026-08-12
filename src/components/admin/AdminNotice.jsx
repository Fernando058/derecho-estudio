import { AlertCircle, CheckCircle2 } from 'lucide-react'

function AdminNotice({ type = 'success', children }) {
  const Icon = type === 'error' ? AlertCircle : CheckCircle2

  return (
    <div className={`admin-notice ${type === 'error' ? 'is-error' : 'is-success'}`}>
      <Icon size={19} />
      <span>{children}</span>
    </div>
  )
}

export default AdminNotice
