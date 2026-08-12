import { useEffect, useMemo, useState } from 'react'
import { Edit3, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import AdminNotice from '../../components/admin/AdminNotice'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoading from '../../components/admin/AdminLoading'
import {
  createSubject,
  deleteSubject,
  listSemesters,
  listSubjects,
  updateSubject,
} from '../../services/admin/academicService'
import { slugify } from '../../utils/slugify'

const emptyForm = {
  semester_id: '',
  name: '',
  slug: '',
  code: '',
  credits: 3,
  description: '',
  is_published: false,
  sort_order: 0,
}

function AdminSubjectsPage() {
  const [items, setItems] = useState([])
  const [semesters, setSemesters] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [filterSemester, setFilterSemester] = useState('all')

  async function loadData() {
    setLoading(true)
    try {
      const [semesterRows, subjectRows] = await Promise.all([
        listSemesters(),
        listSubjects(),
      ])
      setSemesters(semesterRows)
      setItems(subjectRows)
      setForm((current) => ({
        ...current,
        semester_id: current.semester_id || semesterRows[0]?.id || '',
      }))
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredItems = useMemo(() => {
    if (filterSemester === 'all') return items
    return items.filter((item) => item.semester_id === filterSemester)
  }, [filterSemester, items])

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
    setForm({
      ...emptyForm,
      semester_id: semesters[0]?.id || '',
    })
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      semester_id: item.semester_id,
      name: item.name,
      slug: item.slug,
      code: item.code || '',
      credits: item.credits ?? 3,
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
      semester_id: form.semester_id,
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      code: form.code.trim() || null,
      credits: form.credits === '' ? null : Number(form.credits),
      description: form.description.trim() || null,
      is_published: Boolean(form.is_published),
      sort_order: Number(form.sort_order) || 0,
    }

    try {
      if (editingId) {
        await updateSubject(editingId, payload)
        setNotice({ type: 'success', text: 'Materia actualizada correctamente.' })
      } else {
        await createSubject(payload)
        setNotice({ type: 'success', text: 'Materia creada correctamente.' })
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
      `¿Eliminar "${item.name}"?\n\nSe eliminarán en cascada sus unidades, temas y datos dependientes.`,
    )
    if (!confirmed) return

    try {
      await deleteSubject(item.id)
      if (editingId === item.id) resetForm()
      setNotice({ type: 'success', text: 'Materia eliminada.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  return (
    <AdminShell
      title="Materias"
      description="Administra las asignaturas asociadas a cada semestre."
    >
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>{editingId ? 'Editar materia' : 'Nueva materia'}</h2>
            <p>Las materias se organizan dentro de un semestre y luego contienen cuatro unidades.</p>
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
              Semestre
              <select
                onChange={(event) => updateField('semester_id', event.target.value)}
                required
                value={form.semester_id}
              >
                <option value="">Selecciona un semestre</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </label>

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
              Código corto
              <input
                maxLength="20"
                onChange={(event) => updateField('code', event.target.value.toUpperCase())}
                placeholder="Ej. PEN1"
                value={form.code}
              />
            </label>

            <label>
              Créditos
              <input
                min="0"
                onChange={(event) => updateField('credits', event.target.value)}
                type="number"
                value={form.credits}
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
            Publicada y visible para estudiantes
          </label>

          <div className="admin-form-actions">
            <button className="primary-button" disabled={saving || semesters.length === 0} type="submit">
              {editingId ? <Save size={17} /> : <Plus size={17} />}
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear materia'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Materias registradas</h2>
            <p>{filteredItems.length} registro(s) visibles con el filtro actual</p>
          </div>
          <select
            className="admin-inline-select"
            onChange={(event) => setFilterSemester(event.target.value)}
            value={filterSemester}
          >
            <option value="all">Todos los semestres</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>{semester.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <AdminLoading label="Cargando materias..." />
        ) : filteredItems.length === 0 ? (
          <AdminEmptyState title="No hay materias" description="Crea una materia o cambia el filtro de semestre." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Semestre</th>
                  <th>Código</th>
                  <th>Créditos</th>
                  <th>Estado</th>
                  <th className="admin-table-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong><br /><code>{item.slug}</code></td>
                    <td>{item.semester?.name || '—'}</td>
                    <td>{item.code || '—'}</td>
                    <td>{item.credits ?? '—'}</td>
                    <td>
                      <span className={`record-status ${item.is_published ? 'is-published' : 'is-draft'}`}>
                        {item.is_published ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="admin-table-actions">
                      <button className="icon-button" onClick={() => startEdit(item)} title="Editar" type="button"><Edit3 size={17} /></button>
                      <button className="icon-button danger" onClick={() => handleDelete(item)} title="Eliminar" type="button"><Trash2 size={17} /></button>
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

export default AdminSubjectsPage
