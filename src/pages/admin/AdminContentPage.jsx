import { useEffect, useMemo, useState } from 'react'
import { Edit3, FilePenLine, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import AdminNotice from '../../components/admin/AdminNotice'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoading from '../../components/admin/AdminLoading'
import {
  createContentBlock,
  deleteContentBlock,
  listContentBlocksAdmin,
  updateContentBlock,
} from '../../services/admin/contentService'
import {
  listSubjects,
  listTopics,
  listUnits,
} from '../../services/admin/academicService'

const contentTypes = [
  ['introduction', 'Introducción'],
  ['summary', 'Resumen'],
  ['analysis', 'Análisis jurídico'],
  ['key_concepts', 'Conceptos clave'],
  ['exam_tips', 'Claves para evaluación'],
  ['example', 'Ejemplo'],
  ['warning', 'Advertencia'],
  ['custom', 'Contenido personalizado'],
]

const emptyForm = {
  subject_id: '',
  unit_id: '',
  topic_id: '',
  content_type: 'analysis',
  title: '',
  content: '',
  is_published: false,
  sort_order: 0,
}

function AdminContentPage() {
  const [items, setItems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [units, setUnits] = useState([])
  const [topics, setTopics] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterUnit, setFilterUnit] = useState('all')
  const [filterType, setFilterType] = useState('all')

  async function loadData() {
    setLoading(true)
    try {
      const [contentRows, subjectRows, unitRows, topicRows] = await Promise.all([
        listContentBlocksAdmin(),
        listSubjects(),
        listUnits(),
        listTopics(),
      ])
      setItems(contentRows)
      setSubjects(subjectRows)
      setUnits(unitRows)
      setTopics(topicRows)
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const unitById = useMemo(
    () => new Map(units.map((item) => [item.id, item])),
    [units],
  )

  const formUnits = useMemo(() => {
    if (!form.subject_id) return []
    return units.filter((item) => item.subject_id === form.subject_id)
  }, [form.subject_id, units])

  const formTopics = useMemo(() => {
    if (!form.unit_id) return []
    return topics.filter((item) => item.unit_id === form.unit_id)
  }, [form.unit_id, topics])

  const filterUnits = useMemo(() => {
    if (filterSubject === 'all') return units
    return units.filter((item) => item.subject_id === filterSubject)
  }, [filterSubject, units])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterUnit !== 'all' && item.unit_id !== filterUnit) return false
      if (filterSubject !== 'all' && item.unit?.subject_id !== filterSubject) return false
      if (filterType !== 'all' && item.content_type !== filterType) return false
      return true
    })
  }, [filterSubject, filterType, filterUnit, items])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubjectChange(subjectId) {
    setForm((current) => ({
      ...current,
      subject_id: subjectId,
      unit_id: '',
      topic_id: '',
    }))
  }

  function handleUnitChange(unitId) {
    const unit = unitById.get(unitId)
    setForm((current) => ({
      ...current,
      subject_id: unit?.subject_id || current.subject_id,
      unit_id: unitId,
      topic_id: '',
    }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      subject_id: item.unit?.subject_id || '',
      unit_id: item.unit_id,
      topic_id: item.topic_id || '',
      content_type: item.content_type,
      title: item.title || '',
      content: item.content,
      is_published: item.is_published,
      sort_order: item.sort_order ?? 0,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    if (!form.unit_id) {
      setNotice({ type: 'error', text: 'Debes seleccionar una unidad.' })
      setSaving(false)
      return
    }

    if (!form.content.trim()) {
      setNotice({ type: 'error', text: 'El contenido no puede estar vacío.' })
      setSaving(false)
      return
    }

    const payload = {
      unit_id: form.unit_id,
      topic_id: form.topic_id || null,
      content_type: form.content_type,
      title: form.title.trim() || null,
      content: form.content.trim(),
      is_published: Boolean(form.is_published),
      sort_order: Number(form.sort_order) || 0,
    }

    try {
      if (editingId) {
        await updateContentBlock(editingId, payload)
        setNotice({ type: 'success', text: 'Contenido actualizado correctamente.' })
      } else {
        await createContentBlock(payload)
        setNotice({ type: 'success', text: 'Contenido creado correctamente.' })
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
    const label = item.title || contentTypes.find(([value]) => value === item.content_type)?.[1] || 'Contenido'
    if (!window.confirm(`¿Eliminar el bloque "${label}"?`)) return

    try {
      await deleteContentBlock(item.id)
      if (editingId === item.id) resetForm()
      setNotice({ type: 'success', text: 'Contenido eliminado.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  return (
    <AdminShell
      title="Contenido académico"
      description="Redacta introducciones, análisis jurídicos, conceptos clave y otros bloques que verá el estudiante dentro de cada unidad."
    >
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>{editingId ? 'Editar contenido' : 'Nuevo bloque de contenido'}</h2>
            <p>Puede pertenecer a toda la unidad o a un tema concreto.</p>
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
              <select onChange={(event) => handleSubjectChange(event.target.value)} required value={form.subject_id}>
                <option value="">Selecciona una materia</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>

            <label>
              Unidad
              <select onChange={(event) => handleUnitChange(event.target.value)} required value={form.unit_id}>
                <option value="">Selecciona una unidad</option>
                {formUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>Unidad {unit.unit_number} — {unit.title}</option>
                ))}
              </select>
            </label>

            <label>
              Tema (opcional)
              <select onChange={(event) => updateField('topic_id', event.target.value)} value={form.topic_id}>
                <option value="">Contenido general de la unidad</option>
                {formTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.title}</option>
                ))}
              </select>
            </label>

            <label>
              Tipo de contenido
              <select onChange={(event) => updateField('content_type', event.target.value)} value={form.content_type}>
                {contentTypes.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              Título (opcional)
              <input onChange={(event) => updateField('title', event.target.value)} value={form.title} />
            </label>

            <label>
              Orden
              <input min="0" onChange={(event) => updateField('sort_order', event.target.value)} type="number" value={form.sort_order} />
            </label>
          </div>

          <label>
            Contenido
            <textarea
              className="admin-content-textarea"
              onChange={(event) => updateField('content', event.target.value)}
              placeholder="Escribe el análisis, resumen, conceptos o recomendaciones..."
              required
              rows="12"
              value={form.content}
            />
          </label>

          <label className="admin-checkbox">
            <input checked={form.is_published} onChange={(event) => updateField('is_published', event.target.checked)} type="checkbox" />
            Publicado y visible para estudiantes
          </label>

          <div className="admin-form-actions">
            <button className="primary-button" disabled={saving} type="submit">
              {editingId ? <Save size={17} /> : <Plus size={17} />}
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear contenido'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Contenido registrado</h2>
            <p>{filteredItems.length} registro(s) según los filtros actuales.</p>
          </div>
          <div className="admin-filter-row">
            <select className="admin-inline-select" onChange={(event) => { setFilterSubject(event.target.value); setFilterUnit('all') }} value={filterSubject}>
              <option value="all">Todas las materias</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            <select className="admin-inline-select" onChange={(event) => setFilterUnit(event.target.value)} value={filterUnit}>
              <option value="all">Todas las unidades</option>
              {filterUnits.map((unit) => <option key={unit.id} value={unit.id}>Unidad {unit.unit_number} — {unit.title}</option>)}
            </select>
            <select className="admin-inline-select" onChange={(event) => setFilterType(event.target.value)} value={filterType}>
              <option value="all">Todos los tipos</option>
              {contentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <AdminLoading label="Cargando contenido..." />
        ) : filteredItems.length === 0 ? (
          <AdminEmptyState title="No hay contenido" description="Crea el primer bloque para la unidad seleccionada." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-content-table">
              <thead>
                <tr>
                  <th>Contexto</th>
                  <th>Tipo</th>
                  <th>Título / vista previa</th>
                  <th>Estado</th>
                  <th>Orden</th>
                  <th className="admin-table-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.unit?.subject?.code || '—'}</strong>
                      <span className="admin-table-subtext">Unidad {item.unit?.unit_number} · {item.topic?.title || 'General'}</span>
                    </td>
                    <td>{contentTypes.find(([value]) => value === item.content_type)?.[1] || item.content_type}</td>
                    <td>
                      <strong>{item.title || 'Sin título'}</strong>
                      <span className="admin-table-subtext admin-content-preview">{item.content}</span>
                    </td>
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

      <section className="admin-card admin-help-card">
        <FilePenLine size={24} />
        <div>
          <h3>Modelo editorial</h3>
          <p>Combina varios bloques por unidad: resumen, análisis jurídico, conceptos clave, advertencias y claves para examen. El estudiante los verá según el campo “Orden”.</p>
        </div>
      </section>
    </AdminShell>
  )
}

export default AdminContentPage
