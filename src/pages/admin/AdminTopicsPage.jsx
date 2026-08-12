import { useEffect, useMemo, useState } from 'react'
import { Edit3, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import AdminNotice from '../../components/admin/AdminNotice'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoading from '../../components/admin/AdminLoading'
import {
  createTopic,
  deleteTopic,
  listSubjects,
  listTopics,
  listUnits,
  updateTopic,
} from '../../services/admin/academicService'
import { slugify } from '../../utils/slugify'

const emptyForm = {
  unit_id: '',
  parent_topic_id: '',
  title: '',
  slug: '',
  description: '',
  is_published: false,
  sort_order: 0,
}

function AdminTopicsPage() {
  const [items, setItems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [units, setUnits] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterUnit, setFilterUnit] = useState('all')

  async function loadData() {
    setLoading(true)
    try {
      const [subjectRows, unitRows, topicRows] = await Promise.all([
        listSubjects(),
        listUnits(),
        listTopics(),
      ])
      setSubjects(subjectRows)
      setUnits(unitRows)
      setItems(topicRows)
      setForm((current) => ({
        ...current,
        unit_id: current.unit_id || unitRows[0]?.id || '',
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

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === form.unit_id),
    [form.unit_id, units],
  )

  const parentCandidates = useMemo(
    () => items.filter((item) => item.unit_id === form.unit_id && item.id !== editingId),
    [editingId, form.unit_id, items],
  )

  const filteredUnits = useMemo(() => {
    if (filterSubject === 'all') return units
    return units.filter((unit) => unit.subject_id === filterSubject)
  }, [filterSubject, units])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterUnit !== 'all') return item.unit_id === filterUnit
      if (filterSubject !== 'all') return item.unit?.subject_id === filterSubject
      return true
    })
  }, [filterSubject, filterUnit, items])

  const topicTitleById = useMemo(
    () => new Map(items.map((item) => [item.id, item.title])),
    [items],
  )

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
    setForm({ ...emptyForm, unit_id: units[0]?.id || '' })
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      unit_id: item.unit_id,
      parent_topic_id: item.parent_topic_id || '',
      title: item.title,
      slug: item.slug,
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
      unit_id: form.unit_id,
      parent_topic_id: form.parent_topic_id || null,
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      description: form.description.trim() || null,
      is_published: Boolean(form.is_published),
      sort_order: Number(form.sort_order) || 0,
    }

    try {
      if (editingId) {
        await updateTopic(editingId, payload)
        setNotice({ type: 'success', text: 'Tema actualizado correctamente.' })
      } else {
        await createTopic(payload)
        setNotice({ type: 'success', text: 'Tema creado correctamente.' })
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
      `¿Eliminar "${item.title}"?\n\nSi contiene subtemas o contenido dependiente, también se eliminarán en cascada.`,
    )
    if (!confirmed) return

    try {
      await deleteTopic(item.id)
      if (editingId === item.id) resetForm()
      setNotice({ type: 'success', text: 'Tema eliminado.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  function handleSubjectFilter(value) {
    setFilterSubject(value)
    setFilterUnit('all')
  }

  return (
    <AdminShell
      title="Temas y subtemas"
      description="Organiza el contenido interno de cada una de las cuatro unidades."
    >
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>{editingId ? 'Editar tema' : 'Nuevo tema'}</h2>
            <p>Para crear un subtema, selecciona un tema padre de la misma unidad.</p>
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
              Unidad
              <select
                onChange={(event) => setForm((current) => ({ ...current, unit_id: event.target.value, parent_topic_id: '' }))}
                required
                value={form.unit_id}
              >
                <option value="">Selecciona una unidad</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.subject?.code || unit.subject?.name} — Unidad {unit.unit_number}: {unit.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tema padre (opcional)
              <select
                onChange={(event) => updateField('parent_topic_id', event.target.value)}
                value={form.parent_topic_id}
              >
                <option value="">Es un tema principal</option>
                {parentCandidates.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.title}</option>
                ))}
              </select>
            </label>

            <label>
              Título
              <input
                onChange={(event) => handleTitleChange(event.target.value)}
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

            <label>
              Orden
              <input
                min="0"
                onChange={(event) => updateField('sort_order', event.target.value)}
                type="number"
                value={form.sort_order}
              />
            </label>

            <div className="admin-context-box">
              <span>Contexto seleccionado</span>
              <strong>{selectedUnit?.subject?.name || 'Sin materia'}</strong>
              <small>{selectedUnit ? `Unidad ${selectedUnit.unit_number}` : 'Selecciona una unidad'}</small>
            </div>
          </div>

          <label>
            Descripción
            <textarea
              onChange={(event) => updateField('description', event.target.value)}
              rows="4"
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
            <button className="primary-button" disabled={saving || units.length === 0} type="submit">
              {editingId ? <Save size={17} /> : <Plus size={17} />}
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear tema'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading admin-card-heading-wrap">
          <div>
            <h2>Temas registrados</h2>
            <p>{filteredItems.length} registro(s)</p>
          </div>
          <div className="admin-filter-row">
            <select className="admin-inline-select" onChange={(event) => handleSubjectFilter(event.target.value)} value={filterSubject}>
              <option value="all">Todas las materias</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
            <select className="admin-inline-select" onChange={(event) => setFilterUnit(event.target.value)} value={filterUnit}>
              <option value="all">Todas las unidades</option>
              {filteredUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>Unidad {unit.unit_number}: {unit.title}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <AdminLoading label="Cargando temas..." />
        ) : filteredItems.length === 0 ? (
          <AdminEmptyState title="No hay temas" description="Selecciona una unidad y crea su primer tema." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Materia / Unidad</th>
                  <th>Tema</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Orden</th>
                  <th className="admin-table-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.unit?.subject?.code || item.unit?.subject?.name || '—'}</strong><br />
                      <span>Unidad {item.unit?.unit_number ?? '—'}</span>
                    </td>
                    <td><strong>{item.title}</strong><br /><code>{item.slug}</code></td>
                    <td>{item.parent_topic_id ? `Subtema de ${topicTitleById.get(item.parent_topic_id) || 'tema'}` : 'Tema principal'}</td>
                    <td>
                      <span className={`record-status ${item.is_published ? 'is-published' : 'is-draft'}`}>
                        {item.is_published ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td>{item.sort_order}</td>
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

export default AdminTopicsPage
