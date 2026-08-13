import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserCheck,
  UserRoundCog,
  UserX,
} from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import AdminLoading from '../../components/admin/AdminLoading'
import AdminNotice from '../../components/admin/AdminNotice'
import { useAuth } from '../../hooks/useAuth'
import {
  listUsersWithStats,
  updateManagedUser,
} from '../../services/admin/userService'

function roleLabel(role) {
  if (role === 'superadmin') return 'Superadmin'
  if (role === 'admin') return 'Administrador'
  return 'Estudiante'
}

function AdminUsersPage() {
  const {
    profile: currentProfile,
    isSuperAdmin,
  } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [drafts, setDrafts] = useState({})

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      const data = await listUsersWithStats()
      setUsers(data)

      setDrafts(
        Object.fromEntries(
          data.map((user) => [
            user.id,
            {
              fullName: user.full_name ?? '',
              role: user.role,
              isActive: user.is_active,
            },
          ]),
        ),
      )
    } catch (loadError) {
      console.error(loadError)
      setError(
        loadError?.message ||
          'No fue posible cargar los usuarios.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchesTerm =
        !term ||
        user.full_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)

      const matchesRole =
        roleFilter === 'all' ||
        user.role === roleFilter

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active)

      return matchesTerm && matchesRole && matchesStatus
    })
  }, [roleFilter, search, statusFilter, users])

  const stats = useMemo(() => ({
    total: users.length,
    students: users.filter((item) => item.role === 'student').length,
    admins: users.filter((item) => item.role !== 'student').length,
    inactive: users.filter((item) => !item.is_active).length,
  }), [users])

  function patchDraft(userId, patch) {
    setDrafts((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        ...patch,
      },
    }))
  }

  async function handleSave(user) {
    const draft = drafts[user.id]

    if (!draft) return

    setSavingId(user.id)
    setError('')
    setNotice('')

    try {
      await updateManagedUser({
        userId: user.id,
        fullName: draft.fullName,
        role: draft.role,
        isActive: draft.isActive,
      })

      setNotice(
        `Usuario ${user.email || user.id} actualizado correctamente.`,
      )

      await loadUsers()
    } catch (saveError) {
      console.error(saveError)
      setError(
        saveError?.message ||
          'No fue posible actualizar el usuario.',
      )
    } finally {
      setSavingId('')
    }
  }

  if (loading) {
    return (
      <AdminShell
        title="Usuarios"
        description="Gestiona estudiantes, administradores, estado de acceso y métricas básicas."
      >
        <AdminLoading />
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Usuarios"
      description="Administra perfiles sin exponer claves privilegiadas de Supabase en el navegador."
      actions={(
        <button
          className="button-secondary"
          onClick={() => void loadUsers()}
          type="button"
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      )}
    >
      {error && (
        <AdminNotice type="error">
          {error}
        </AdminNotice>
      )}

      {notice && (
        <AdminNotice type="success">
          {notice}
        </AdminNotice>
      )}

      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <strong>{stats.total}</strong>
          <span>Usuarios registrados</span>
        </article>

        <article className="admin-stat-card">
          <strong>{stats.students}</strong>
          <span>Estudiantes</span>
        </article>

        <article className="admin-stat-card">
          <strong>{stats.admins}</strong>
          <span>Administradores</span>
        </article>

        <article className="admin-stat-card">
          <strong>{stats.inactive}</strong>
          <span>Cuentas inactivas</span>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-filter-grid admin-user-filters">
          <label>
            <span>Buscar</span>
            <div className="input-with-icon">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre o correo..."
              />
            </div>
          </label>

          <label>
            <span>Rol</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="student">Estudiantes</option>
              <option value="admin">Administradores</option>
              <option value="superadmin">Superadmins</option>
            </select>
          </label>

          <label>
            <span>Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Perfiles</h2>
            <p>
              {filteredUsers.length} resultado(s).
              Solo un superadmin puede cambiar roles.
            </p>
          </div>
        </div>

        <div className="admin-users-list">
          {filteredUsers.map((user) => {
            const draft = drafts[user.id] ?? {
              fullName: user.full_name ?? '',
              role: user.role,
              isActive: user.is_active,
            }

            const isSelf = user.id === currentProfile?.id
            const canToggleActive =
              !isSelf &&
              (
                isSuperAdmin ||
                user.role === 'student'
              )

            return (
              <article className="admin-user-row" key={user.id}>
                <div className="admin-user-identity">
                  <div className="admin-user-avatar">
                    {user.avatar_url ? (
                      <img alt="" src={user.avatar_url} />
                    ) : (
                      (user.full_name || user.email || 'U')
                        .trim()
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>

                  <div>
                    <strong>{user.full_name || 'Sin nombre'}</strong>
                    <span>{user.email}</span>
                    <div className="admin-user-meta">
                      <span>{roleLabel(user.role)}</span>
                      <span>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <span>
                        {Number(user.completed_attempts || 0)} intentos
                      </span>
                      <span>
                        Promedio: {user.average_score ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="admin-user-editor">
                  <label>
                    <span>Nombre</span>
                    <input
                      value={draft.fullName}
                      onChange={(event) =>
                        patchDraft(user.id, {
                          fullName: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Rol</span>
                    <select
                      value={draft.role}
                      disabled={!isSuperAdmin}
                      onChange={(event) =>
                        patchDraft(user.id, {
                          role: event.target.value,
                        })
                      }
                    >
                      <option value="student">Estudiante</option>
                      <option value="admin">Administrador</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </label>

                  <label className="admin-check-row">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      disabled={!canToggleActive}
                      onChange={(event) =>
                        patchDraft(user.id, {
                          isActive: event.target.checked,
                        })
                      }
                    />

                    <span>
                      {draft.isActive ? (
                        <>
                          <UserCheck size={16} />
                          Cuenta activa
                        </>
                      ) : (
                        <>
                          <UserX size={16} />
                          Cuenta inactiva
                        </>
                      )}
                    </span>
                  </label>

                  <button
                    className="primary-button"
                    disabled={savingId === user.id}
                    onClick={() => void handleSave(user)}
                    type="button"
                  >
                    <Save size={17} />
                    {savingId === user.id
                      ? 'Guardando...'
                      : 'Guardar'}
                  </button>
                </div>
              </article>
            )
          })}

          {filteredUsers.length === 0 && (
            <div className="admin-empty-state">
              <UserRoundCog size={36} />
              <h3>Sin usuarios coincidentes</h3>
              <p>Ajusta los filtros de búsqueda.</p>
            </div>
          )}
        </div>
      </section>

      {!isSuperAdmin && (
        <section className="admin-card">
          <ShieldCheck size={26} />
          <h2>Permisos administrativos</h2>
          <p>
            Tu rol de administrador permite gestionar estudiantes,
            pero los cambios de rol están reservados al superadministrador.
          </p>
        </section>
      )}
    </AdminShell>
  )
}

export default AdminUsersPage
