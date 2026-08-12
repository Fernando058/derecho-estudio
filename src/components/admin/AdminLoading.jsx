import { LoaderCircle } from 'lucide-react'

function AdminLoading({ label = 'Cargando...' }) {
  return (
    <div className="admin-loading">
      <LoaderCircle className="spin" size={28} />
      <span>{label}</span>
    </div>
  )
}

export default AdminLoading
