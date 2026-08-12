import { useEffect, useMemo, useState } from 'react'
import { Edit3, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import AdminNotice from '../../components/admin/AdminNotice'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoading from '../../components/admin/AdminLoading'
import {
  createUnit,
  deleteUnit,
  listSubjects,
  listUnits,
  updateUnit,
} from '../../services/admin/academicService'
import { slugify } from '../../utils/slugify'

const emptyForm = {
  subject_id: '',
  unit_number: 1,
  title: '',
  slug: '',
  summary: '',
  learning_outcome: '',
  is_published: false,
  sort_order: 1,
}

function AdminUnitsPage() {
  const [items, setItems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [filterSubject, setFilterSubject] = useState('all')

  async function loadData() {
    setLoading(true)
    try {
      const [subjectRows, unitRows] = await Promise.all([
        listSubjects(),
        listUnits(),
      ])
      setSubjects(subjectRows)
      setItems(unitRows)
      setForm((current) => ({
        ...current,
        subject_id: current.subject_id || subjectRows[0]?.id || '',
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
    if (filterSubject === 'all') return items
    return items.filter((item) => item.subject_id === filterSubject)
  }, [filterSubject, items])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleTitleChange(value) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: current.slug === slugify(current.title) || !current.slug
        ? slugify(value)
        : current.slug,
    }))
  }

  function resetForm() {
    setEditingId(null)
    setForm({
      ...emptyForm,
      subject_id: subjects[0]?.id || '',
    })
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      subject_id: item.subject_id,
      unit_number: item.unit_number,
      title: item.title,
      slug: item.slug,
      summary: item.summary || '',
      learning_outcome: item.learning_outcome || '',
      is_published: item.is_published,
      sort_order: item.sort_order,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const unitNumber = Number(form.unit_number)
    if (unitNumber < 1 || unitNumber > 4) {
      setNotice({ type: 'error', text: 'Para este proyecto cada materia debe utilizar únicamente las unidades 1, 2, 3 y 4.' })
      setSaving(false)
      return
    }

    const payload = {
      subject_id: form.subject_id,
      unit_number: unitNumber,
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      summary: form.summary.trim() || null,
      learning_outcome: form.learning_outcome.trim() || null,
      is_published: Boolean(form.is_published),
      sort_order: Number(form.sort_order) || unitNumber,
    }

    try {
      if (editingId) {
        await updateUnit(editingId, payload)
        setNotice({ type: 'success', text: 'Unidad actualizada correctamente.' })
      } else {
        await createUnit(payload)
        setNotice({ type: 'success', text: 'Unidad creada correctamente.' })
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
      `¿Eliminar la Unidad ${item.unit_number}: "${item.title}"?\n\nSe eliminarán en cascada sus temas y datos dependientes.`,
    )
    if (!confirmed) return

    try {
      await deleteUnit(item.id)
      if (editingId === item.id) resetForm()
      setNotice({ type: 'success', text: 'Unidad eliminada.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  return (
    <AdminShell
      title="Unidades"
      description="Cada materia de la plataforma se organiza en cuatro unidades académicas."
    >
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>{editingId ? 'Editar unidad' : 'Nueva unidad'}</h2>
            <p>El número de unidad está restringido del 1 al 4 en esta interfaz.</p>
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
              Materia
              <select
                onChange={(event) => updateField('subject_id', event.target.value)}
                required
                value={form.subject_id}
              >
                <option value="">Selecciona una materia</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} — {subject.semester?.name || 'Sin semestre'}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Número de unidad
              <select
                onChange={(event) => {
                  const value = Number(event.target.value)
                  setForm((current) => ({ ...current, unit_number: value, sort_order: value }))
                }}
                value={form.unit_number}
              >
                {[1, 2, 3, 4].map((number) => (
                  <option key={number} value={number}>Unidad {number}</option>
                ))}
              </select>
            </label>

            <label>
              Título
              <input
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Ej. Principio de legalidad y fuentes del Derecho Penal"
                required
                value={form.title}
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
          </div>

          <label>
            Resumen de la unidad
            <textarea
              onChange={(event) => updateField('summary', event.target.value)}
              rows="4"
              value={form.summary}
            />
          </label>

          <label>
            Resultado de aprendizaje
            <textarea
              onChange={(event) => updateField('learning_outcome', event.target.value)}
              rows="4"
              value={form.learning_outcome}
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
            <button className="primary-button" disabled={saving || subjects.length === 0} type="submit">
              {editingId ? <Save size={17} /> : <Plus size={17} />}
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear unidad'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Unidades registradas</h2>
            <p>{filteredItems.length} registro(s)</p>
          </div>
          <select
            className="admin-inline-select"
            onChange={(event) => setFilterSubject(event.target.value)}
            value={filterSubject}
          >
            <option value="all">Todas las materias</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <AdminLoading label="Cargando unidades..." />
        ) : filteredItems.length === 0 ? (
          <AdminEmptyState title="No hay unidades" description="Crea las cuatro unidades de la materia seleccionada." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Unidad</th>
                  <th>Título</th>
                  <th>Estado</th>
                  <th className="admin-table-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.subject?.name || '—'}</td>
                    <td><strong>{item.unit_number}</strong></td>
                    <td><strong>{item.title}</strong><br /><code>{item.slug}</code></td>
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

export default AdminUnitsPage
