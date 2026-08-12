import { useEffect, useMemo, useState } from 'react'
import {
  BookMarked,
  Edit3,
  ExternalLink,
  Link2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import AdminNotice from '../../components/admin/AdminNotice'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoading from '../../components/admin/AdminLoading'
import { listSubjects, listTopics, listUnits } from '../../services/admin/academicService'
import {
  createReading,
  createTopicReading,
  deleteReading,
  deleteTopicReading,
  listReadingsAdmin,
  listTopicReadingsAdmin,
  updateReading,
  updateTopicReading,
} from '../../services/admin/readingService'

const readingTypes = [
  ['book', 'Libro'],
  ['article', 'Artículo'],
  ['paper', 'Artículo científico / paper'],
  ['jurisprudence', 'Jurisprudencia'],
  ['institutional', 'Documento institucional'],
  ['website', 'Sitio web'],
  ['other', 'Otro'],
]

const relevanceOptions = [
  ['essential', 'Esencial'],
  ['recommended', 'Recomendada'],
  ['complementary', 'Complementaria'],
]

const emptyReading = {
  title: '',
  author: '',
  publication_year: '',
  reading_type: 'article',
  description: '',
  url: '',
  is_published: true,
}

const emptyRelation = {
  subject_id: '',
  unit_id: '',
  topic_id: '',
  reading_id: '',
  relevance: 'recommended',
  sort_order: 0,
}

function AdminReadingsPage() {
  const [readings, setReadings] = useState([])
  const [relations, setRelations] = useState([])
  const [subjects, setSubjects] = useState([])
  const [units, setUnits] = useState([])
  const [topics, setTopics] = useState([])
  const [readingForm, setReadingForm] = useState(emptyReading)
  const [relationForm, setRelationForm] = useState(emptyRelation)
  const [editingReadingId, setEditingReadingId] = useState(null)
  const [editingRelation, setEditingRelation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  async function loadData() {
    setLoading(true)

    try {
      const [
        readingRows,
        relationRows,
        subjectRows,
        unitRows,
        topicRows,
      ] = await Promise.all([
        listReadingsAdmin(),
        listTopicReadingsAdmin(),
        listSubjects(),
        listUnits(),
        listTopics(),
      ])

      setReadings(readingRows)
      setRelations(relationRows)
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

  const relationUnits = useMemo(() => {
    if (!relationForm.subject_id) return []
    return units.filter((item) => item.subject_id === relationForm.subject_id)
  }, [relationForm.subject_id, units])

  const relationTopics = useMemo(() => {
    if (!relationForm.unit_id) return []
    return topics.filter((item) => item.unit_id === relationForm.unit_id)
  }, [relationForm.unit_id, topics])

  function setReadingField(field, value) {
    setReadingForm((current) => ({ ...current, [field]: value }))
  }

  function setRelationField(field, value) {
    setRelationForm((current) => ({ ...current, [field]: value }))
  }

  function resetReading() {
    setEditingReadingId(null)
    setReadingForm(emptyReading)
  }

  function resetRelation() {
    setEditingRelation(null)
    setRelationForm(emptyRelation)
  }

  function startReadingEdit(item) {
    setEditingReadingId(item.id)
    setReadingForm({
      title: item.title,
      author: item.author || '',
      publication_year: item.publication_year ?? '',
      reading_type: item.reading_type,
      description: item.description || '',
      url: item.url || '',
      is_published: item.is_published,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startRelationEdit(item) {
    const topic = item.topic
    const unit = topic?.unit

    setEditingRelation({
      topicId: item.topic_id,
      readingId: item.reading_id,
    })

    setRelationForm({
      subject_id: unit?.subject_id || '',
      unit_id: topic?.unit_id || '',
      topic_id: item.topic_id,
      reading_id: item.reading_id,
      relevance: item.relevance,
      sort_order: item.sort_order ?? 0,
    })

    document.getElementById('reading-relations')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function submitReading(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const year = readingForm.publication_year === ''
      ? null
      : Number(readingForm.publication_year)

    if (year !== null && (year < 1000 || year > new Date().getFullYear() + 1)) {
      setNotice({ type: 'error', text: 'El año de publicación no es válido.' })
      setSaving(false)
      return
    }

    const payload = {
      title: readingForm.title.trim(),
      author: readingForm.author.trim() || null,
      publication_year: year,
      reading_type: readingForm.reading_type,
      description: readingForm.description.trim() || null,
      url: readingForm.url.trim() || null,
      is_published: Boolean(readingForm.is_published),
    }

    try {
      if (editingReadingId) {
        await updateReading(editingReadingId, payload)
      } else {
        await createReading(payload)
      }

      setNotice({
        type: 'success',
        text: editingReadingId ? 'Lectura actualizada.' : 'Lectura registrada.',
      })
      resetReading()
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function submitRelation(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const payload = {
      relevance: relationForm.relevance,
      sort_order: Number(relationForm.sort_order) || 0,
    }

    try {
      if (editingRelation) {
        await updateTopicReading(
          editingRelation.topicId,
          editingRelation.readingId,
          payload,
        )
      } else {
        await createTopicReading({
          topic_id: relationForm.topic_id,
          reading_id: relationForm.reading_id,
          ...payload,
        })
      }

      setNotice({
        type: 'success',
        text: editingRelation ? 'Recomendación actualizada.' : 'Lectura vinculada al tema.',
      })
      resetRelation()
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function removeReading(item) {
    if (!window.confirm(`¿Eliminar la lectura "${item.title}"?`)) return

    try {
      await deleteReading(item.id)
      setNotice({ type: 'success', text: 'Lectura eliminada.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  async function removeRelation(item) {
    if (!window.confirm('¿Quitar esta lectura del tema?')) return

    try {
      await deleteTopicReading(item.topic_id, item.reading_id)
      setNotice({ type: 'success', text: 'Relación eliminada.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  function changeRelationSubject(subjectId) {
    setRelationForm((current) => ({
      ...current,
      subject_id: subjectId,
      unit_id: '',
      topic_id: '',
    }))
  }

  function changeRelationUnit(unitId) {
    setRelationForm((current) => ({
      ...current,
      unit_id: unitId,
      topic_id: '',
    }))
  }

  return (
    <AdminShell
      title="Lecturas recomendadas"
      description="Construye el catálogo de libros, artículos, jurisprudencia y recursos externos, y vincúlalos con los temas correspondientes."
    >
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>{editingReadingId ? 'Editar lectura' : 'Nueva lectura'}</h2>
            <p>El enlace puede apuntar a una editorial, repositorio, DOI, Google Drive u otra fuente.</p>
          </div>
          {editingReadingId && (
            <button className="button-secondary" onClick={resetReading} type="button">
              <RotateCcw size={17} /> Cancelar
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={submitReading}>
          <div className="admin-form-grid two-columns">
            <label>
              Título
              <input onChange={(e) => setReadingField('title', e.target.value)} required value={readingForm.title} />
            </label>

            <label>
              Autor / institución
              <input onChange={(e) => setReadingField('author', e.target.value)} value={readingForm.author} />
            </label>

            <label>
              Año
              <input min="1000" onChange={(e) => setReadingField('publication_year', e.target.value)} type="number" value={readingForm.publication_year} />
            </label>

            <label>
              Tipo
              <select onChange={(e) => setReadingField('reading_type', e.target.value)} value={readingForm.reading_type}>
                {readingTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label className="admin-form-span-2">
              Descripción
              <textarea onChange={(e) => setReadingField('description', e.target.value)} rows="4" value={readingForm.description} />
            </label>

            <label className="admin-form-span-2">
              Enlace
              <div className="admin-url-field">
                <Link2 size={18} />
                <input onChange={(e) => setReadingField('url', e.target.value)} type="url" value={readingForm.url} />
              </div>
            </label>

            <label className="admin-checkbox">
              <input checked={readingForm.is_published} onChange={(e) => setReadingField('is_published', e.target.checked)} type="checkbox" />
              Visible para estudiantes
            </label>
          </div>

          <div className="admin-form-actions">
            <button className="primary-button" disabled={saving} type="submit">
              {editingReadingId ? <Save size={17} /> : <Plus size={17} />}
              {editingReadingId ? 'Guardar lectura' : 'Crear lectura'}
            </button>
          </div>
        </form>

        {loading ? (
          <AdminLoading label="Cargando lecturas..." />
        ) : readings.length === 0 ? (
          <AdminEmptyState title="Sin lecturas" description="Registra el primer recurso recomendado." />
        ) : (
          <div className="admin-table-wrap admin-inner-table">
            <table className="admin-table">
              <thead>
                <tr><th>Lectura</th><th>Tipo</th><th>Año</th><th>Publicada</th><th className="admin-table-actions">Acciones</th></tr>
              </thead>
              <tbody>
                {readings.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.title}</strong><span className="admin-table-subtext">{item.author || 'Autor no registrado'}</span></td>
                    <td>{readingTypes.find(([value]) => value === item.reading_type)?.[1]}</td>
                    <td>{item.publication_year || '—'}</td>
                    <td><span className={`record-status ${item.is_published ? 'is-published' : 'is-draft'}`}>{item.is_published ? 'Sí' : 'No'}</span></td>
                    <td className="admin-table-actions">
                      {item.url && (
                        <a className="icon-button" href={item.url} rel="noreferrer" target="_blank" title="Abrir">
                          <ExternalLink size={17} />
                        </a>
                      )}
                      <button className="icon-button" onClick={() => startReadingEdit(item)} type="button"><Edit3 size={17} /></button>
                      <button className="icon-button danger" onClick={() => removeReading(item)} type="button"><Trash2 size={17} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-card" id="reading-relations">
        <div className="admin-card-heading">
          <div>
            <h2>{editingRelation ? 'Editar recomendación' : 'Vincular lectura con tema'}</h2>
            <p>Una misma lectura puede aparecer en varios temas sin duplicar el registro bibliográfico.</p>
          </div>
          {editingRelation && (
            <button className="button-secondary" onClick={resetRelation} type="button">
              <RotateCcw size={17} /> Cancelar
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={submitRelation}>
          <div className="admin-form-grid two-columns">
            <label>
              Materia
              <select disabled={Boolean(editingRelation)} onChange={(e) => changeRelationSubject(e.target.value)} required value={relationForm.subject_id}>
                <option value="">Selecciona una materia</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>

            <label>
              Unidad
              <select disabled={Boolean(editingRelation)} onChange={(e) => changeRelationUnit(e.target.value)} required value={relationForm.unit_id}>
                <option value="">Selecciona una unidad</option>
                {relationUnits.map((unit) => <option key={unit.id} value={unit.id}>Unidad {unit.unit_number} — {unit.title}</option>)}
              </select>
            </label>

            <label>
              Tema
              <select disabled={Boolean(editingRelation)} onChange={(e) => setRelationField('topic_id', e.target.value)} required value={relationForm.topic_id}>
                <option value="">Selecciona un tema</option>
                {relationTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
              </select>
            </label>

            <label>
              Lectura
              <select disabled={Boolean(editingRelation)} onChange={(e) => setRelationField('reading_id', e.target.value)} required value={relationForm.reading_id}>
                <option value="">Selecciona una lectura</option>
                {readings.map((reading) => <option key={reading.id} value={reading.id}>{reading.title}</option>)}
              </select>
            </label>

            <label>
              Relevancia
              <select onChange={(e) => setRelationField('relevance', e.target.value)} value={relationForm.relevance}>
                {relevanceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label>
              Orden
              <input min="0" onChange={(e) => setRelationField('sort_order', e.target.value)} type="number" value={relationForm.sort_order} />
            </label>
          </div>

          <div className="admin-form-actions">
            <button className="primary-button" disabled={saving || readings.length === 0} type="submit">
              {editingRelation ? <Save size={17} /> : <BookMarked size={17} />}
              {editingRelation ? 'Guardar recomendación' : 'Vincular lectura'}
            </button>
          </div>
        </form>

        {relations.length === 0 ? (
          <AdminEmptyState title="Sin lecturas vinculadas" description="Relaciona el catálogo con los temas de cada unidad." />
        ) : (
          <div className="admin-table-wrap admin-inner-table">
            <table className="admin-table admin-reading-relations-table">
              <thead>
                <tr><th>Materia / unidad</th><th>Tema</th><th>Lectura</th><th>Relevancia</th><th className="admin-table-actions">Acciones</th></tr>
              </thead>
              <tbody>
                {relations.map((item) => (
                  <tr key={`${item.topic_id}-${item.reading_id}`}>
                    <td><strong>{item.topic?.unit?.subject?.code || '—'}</strong><span className="admin-table-subtext">Unidad {item.topic?.unit?.unit_number}</span></td>
                    <td>{item.topic?.title}</td>
                    <td><strong>{item.reading?.title}</strong><span className="admin-table-subtext">{item.reading?.author || '—'}</span></td>
                    <td>{relevanceOptions.find(([value]) => value === item.relevance)?.[1]}</td>
                    <td className="admin-table-actions">
                      <button className="icon-button" onClick={() => startRelationEdit(item)} type="button"><Edit3 size={17} /></button>
                      <button className="icon-button danger" onClick={() => removeRelation(item)} type="button"><Trash2 size={17} /></button>
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

export default AdminReadingsPage
