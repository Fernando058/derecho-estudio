import { useEffect, useState } from 'react'
import { Edit3, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import AdminNotice from '../../components/admin/AdminNotice'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoading from '../../components/admin/AdminLoading'
import {
  createSemester,
  deleteSemester,
  listSemesters,
  updateSemester,
} from '../../services/admin/academicService'
import { slugify } from '../../utils/slugify'

const emptyForm = {
  name: '',
  slug: '',
  level_number: 1,
  description: '',
  is_published: false,
  sort_order: 0,
}

function AdminSemestersPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  async function loadData() {
    setLoading(true)
    try {
      setItems(await listSemesters())
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleNameChange(value) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.slug === slugify(current.name) || !current.slug
        ? slugify(value)
        : current.slug,
    }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      slug: item.slug,
      level_number: item.level_number,
      description: item.description || '',
      is_published: item.is_published,
      sort_order: item.sort_order,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      level_number: Number(form.level_number),
      description: form.description.trim() || null,
      is_published: Boolean(form.is_published),
      sort_order: Number(form.sort_order) || 0,
    }

    try {
      if (editingId) {
        await updateSemester(editingId, payload)
        setNotice({ type: 'success', text: 'Semestre actualizado correctamente.' })
      } else {
        await createSemester(payload)
        setNotice({ type: 'success', text: 'Semestre creado correctamente.' })
      }

      resetForm()
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `¿Eliminar "${item.name}"?\n\nEsta acción también eliminará en cascada sus materias, unidades, temas y datos dependientes.`,
    )

    if (!confirmed) return

    setNotice(null)
    try {
      await deleteSemester(item.id)
      if (editingId === item.id) resetForm()
      setNotice({ type: 'success', text: 'Semestre eliminado.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  return (
    <AdminShell
      title="Semestres"
      description="Crea y organiza los niveles académicos disponibles en la plataforma."
    >
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>{editingId ? 'Editar semestre' : 'Nuevo semestre'}</h2>
            <p>El slug se utiliza internamente para construir rutas estables.</p>
          </div>
          {editingId && (
            <button className="button-secondary" onClick={resetForm} type="button">
              <RotateCcw size={17} /> Cancelar edición
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid two-columns">
            <label>
              Nombre
              <input
                onChange={(event) => handleNameChange(event.target.value)}
                required
                value={form.name}
              />
            </label>

            <label>
              Slug
              <input
                onChange={(event) => updateField('slug', event.target.value)}
                required
                value={form.slug}
              />
            </label>

            <label>
              Nivel
              <input
                min="1"
                onChange={(event) => updateField('level_number', event.target.value)}
                required
                type="number"
                value={form.level_number}
              />
            </label>

            <label>
              Orden
              <input
                min="0"
                onChange={(event) => updateField('sort_order', event.target.value)}
                type="number"
                value={form.sort_order}
              />
            </label>
          </div>

          <label>
            Descripción
            <textarea
              onChange={(event) => updateField('description', event.target.value)}
              rows="3"
              value={form.description}
            />
          </label>

          <label className="admin-checkbox">
            <input
              checked={form.is_published}
              onChange={(event) => updateField('is_published', event.target.checked)}
              type="checkbox"
            />
            Publicado y visible para estudiantes
          </label>

          <div className="admin-form-actions">
            <button className="primary-button" disabled={saving} type="submit">
              {editingId ? <Save size={17} /> : <Plus size={17} />}
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear semestre'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Semestres registrados</h2>
            <p>{items.length} registro(s)</p>
          </div>
        </div>

        {loading ? (
          <AdminLoading label="Cargando semestres..." />
        ) : items.length === 0 ? (
          <AdminEmptyState
            title="No hay semestres"
            description="Crea el primer semestre utilizando el formulario superior."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nivel</th>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Estado</th>
                  <th>Orden</th>
                  <th className="admin-table-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.level_number}</td>
                    <td><strong>{item.name}</strong></td>
                    <td><code>{item.slug}</code></td>
                    <td>
                      <span className={`record-status ${item.is_published ? 'is-published' : 'is-draft'}`}>
                        {item.is_published ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td>{item.sort_order}</td>
                    <td className="admin-table-actions">
                      <button className="icon-button" onClick={() => startEdit(item)} title="Editar" type="button">
                        <Edit3 size={17} />
                      </button>
                      <button className="icon-button danger" onClick={() => handleDelete(item)} title="Eliminar" type="button">
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  )
}

export default AdminSemestersPage
