import { Inbox } from 'lucide-react'

function AdminEmptyState({ title, description }) {
  return (
    <div className="admin-empty-state">
      <Inbox size={34} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export default AdminEmptyState
