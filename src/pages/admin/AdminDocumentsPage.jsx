import { useEffect, useMemo, useState } from 'react'
import {
  Edit3,
  Eye,
  FileText,
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
import PdfViewer from '../../components/pdf/PdfViewer'
import {
  createDocument,
  deleteDocument,
  listDocumentsAdmin,
  updateDocument,
} from '../../services/admin/documentService'
import {
  listSubjects,
  listTopics,
  listUnits,
} from '../../services/admin/academicService'
import {
  isGoogleDriveUrl,
} from '../../utils/googleDrive'

const emptyForm = {
  subject_id: '',
  unit_id: '',
  topic_id: '',
  title: '',
  description: '',
  document_type: 'compendium',
  provider: 'google_drive',
  source_url: '',
  start_page: '',
  end_page: '',
  is_published: true,
  sort_order: 0,
}

const documentTypes = [
  ['compendium', 'Compendio'],
  ['law', 'Normativa'],
  ['reading', 'Lectura'],
  ['guide', 'Guía'],
  ['jurisprudence', 'Jurisprudencia'],
  ['other', 'Otro'],
]

const providers = [
  ['google_drive', 'Google Drive'],
  ['external', 'Enlace externo'],
]

function AdminDocumentsPage() {
  const [items, setItems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [units, setUnits] = useState([])
  const [topics, setTopics] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [previewItem, setPreviewItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterUnit, setFilterUnit] = useState('all')

  async function loadData() {
    setLoading(true)

    try {
      const [documentRows, subjectRows, unitRows, topicRows] = await Promise.all([
        listDocumentsAdmin(),
        listSubjects(),
        listUnits(),
        listTopics(),
      ])

      setItems(documentRows)
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

  const subjectById = useMemo(
    () => new Map(subjects.map((item) => [item.id, item])),
    [subjects],
  )

  const unitById = useMemo(
    () => new Map(units.map((item) => [item.id, item])),
    [units],
  )

  const topicById = useMemo(
    () => new Map(topics.map((item) => [item.id, item])),
    [topics],
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
      if (filterUnit !== 'all') return item.unit_id === filterUnit
      if (filterSubject !== 'all') return item.subject_id === filterSubject
      return true
    })
  }, [filterSubject, filterUnit, items])

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

  function handleTopicChange(topicId) {
    const topic = topicById.get(topicId)
    const unit = topic ? unitById.get(topic.unit_id) : null

    setForm((current) => ({
      ...current,
      subject_id: unit?.subject_id || current.subject_id,
      unit_id: topic?.unit_id || current.unit_id,
      topic_id: topicId,
    }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      subject_id: item.subject_id || '',
      unit_id: item.unit_id || '',
      topic_id: item.topic_id || '',
      title: item.title,
      description: item.description || '',
      document_type: item.document_type,
      provider: item.provider === 'supabase_storage' ? 'external' : item.provider,
      source_url: item.source_url,
      start_page: item.start_page ?? '',
      end_page: item.end_page ?? '',
      is_published: item.is_published,
      sort_order: item.sort_order ?? 0,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const sourceUrl = form.source_url.trim()

    if (!sourceUrl) {
      setNotice({ type: 'error', text: 'Debes registrar el enlace del documento.' })
      setSaving(false)
      return
    }

    if (form.provider === 'google_drive' && !isGoogleDriveUrl(sourceUrl)) {
      setNotice({
        type: 'error',
        text: 'El proveedor está configurado como Google Drive, pero el enlace no pertenece a drive.google.com.',
      })
      setSaving(false)
      return
    }

    if (form.topic_id && !form.unit_id) {
      setNotice({ type: 'error', text: 'Un documento asociado a un tema también debe pertenecer a una unidad.' })
      setSaving(false)
      return
    }

    if (form.unit_id && !form.subject_id) {
      setNotice({ type: 'error', text: 'Un documento asociado a una unidad también debe pertenecer a una materia.' })
      setSaving(false)
      return
    }

    const startPage = form.start_page === '' ? null : Number(form.start_page)
    const endPage = form.end_page === '' ? null : Number(form.end_page)

    if (startPage !== null && startPage < 1) {
      setNotice({ type: 'error', text: 'La página inicial debe ser mayor o igual a 1.' })
      setSaving(false)
      return
    }

    if (endPage !== null && endPage < 1) {
      setNotice({ type: 'error', text: 'La página final debe ser mayor o igual a 1.' })
      setSaving(false)
      return
    }

    if (startPage !== null && endPage !== null && endPage < startPage) {
      setNotice({ type: 'error', text: 'La página final no puede ser menor que la página inicial.' })
      setSaving(false)
      return
    }

    const payload = {
      subject_id: form.subject_id || null,
      unit_id: form.unit_id || null,
      topic_id: form.topic_id || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      document_type: form.document_type,
      provider: form.provider,
      source_url: sourceUrl,
      start_page: startPage,
      end_page: endPage,
      is_published: Boolean(form.is_published),
      sort_order: Number(form.sort_order) || 0,
    }

    try {
      if (editingId) {
        await updateDocument(editingId, payload)
        setNotice({ type: 'success', text: 'Documento actualizado correctamente.' })
      } else {
        await createDocument(payload)
        setNotice({ type: 'success', text: 'Documento registrado correctamente.' })
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
      `¿Eliminar el documento "${item.title}"?\n\nSolo se elimina el registro de la plataforma. El archivo original de Google Drive no será eliminado.`,
    )

    if (!confirmed) return

    try {
      await deleteDocument(item.id)
      if (editingId === item.id) resetForm()
      if (previewItem?.id === item.id) setPreviewItem(null)
      setNotice({ type: 'success', text: 'Documento eliminado de la plataforma.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  function getContextLabel(item) {
    const subject = subjectById.get(item.subject_id)
    const unit = unitById.get(item.unit_id)
    const topic = topicById.get(item.topic_id)

    const parts = []
    if (subject) parts.push(subject.code || subject.name)
    if (unit) parts.push(`U${unit.unit_number}`)
    if (topic) parts.push(topic.title)

    return parts.length > 0 ? parts.join(' · ') : 'Documento general'
  }

  return (
    <AdminShell
      title="Documentos y compendios"
      description="Administra enlaces de Google Drive y otros documentos sin modificar el código de la plataforma."
    >
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>{editingId ? 'Editar documento' : 'Nuevo documento'}</h2>
            <p>Pega el enlace compartido de Google Drive. Para visualizarlo, el archivo debe permitir acceso mediante enlace.</p>
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
              Materia (opcional)
              <select onChange={(event) => handleSubjectChange(event.target.value)} value={form.subject_id}>
                <option value="">Documento general</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} — {subject.semester?.name || 'Sin semestre'}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Unidad (opcional)
              <select
                disabled={!form.subject_id}
                onChange={(event) => handleUnitChange(event.target.value)}
                value={form.unit_id}
              >
                <option value="">Toda la materia</option>
                {formUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Unidad {unit.unit_number}: {unit.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tema (opcional)
              <select
                disabled={!form.unit_id}
                onChange={(event) => handleTopicChange(event.target.value)}
                value={form.topic_id}
              >
                <option value="">Toda la unidad</option>
                {formTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.parent_topic_id ? '↳ ' : ''}{topic.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tipo de documento
              <select onChange={(event) => updateField('document_type', event.target.value)} value={form.document_type}>
                {documentTypes.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              Título
              <input
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Ej. Compendio Derecho Penal I — Unidad 1"
                required
                value={form.title}
              />
            </label>

            <label>
              Proveedor
              <select onChange={(event) => updateField('provider', event.target.value)} value={form.provider}>
                {providers.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Enlace del documento
            <div className="admin-url-field">
              <Link2 size={18} />
              <input
                onChange={(event) => updateField('source_url', event.target.value)}
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                required
                type="url"
                value={form.source_url}
              />
            </div>
          </label>

          <label>
            Descripción
            <textarea
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Describe brevemente el documento y su utilidad para el estudiante."
              rows="3"
              value={form.description}
            />
          </label>

          <div className="admin-form-grid two-columns">
            <label>
              Página inicial recomendada
              <input
                min="1"
                onChange={(event) => updateField('start_page', event.target.value)}
                placeholder="Opcional"
                type="number"
                value={form.start_page}
              />
            </label>

            <label>
              Página final recomendada
              <input
                min="1"
                onChange={(event) => updateField('end_page', event.target.value)}
                placeholder="Opcional"
                type="number"
                value={form.end_page}
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
              <span>Estado del enlace</span>
              <strong>
                {form.source_url
                  ? form.provider === 'google_drive' && isGoogleDriveUrl(form.source_url)
                    ? 'Google Drive reconocido'
                    : form.provider === 'external'
                      ? 'Enlace externo'
                      : 'Revisa el enlace'
                  : 'Sin enlace'}
              </strong>
              <small>La URL se guarda en Supabase; el PDF continúa alojado en tu servicio externo.</small>
            </div>
          </div>

          <label className="admin-checkbox">
            <input
              checked={form.is_published}
              onChange={(event) => updateField('is_published', event.target.checked)}
              type="checkbox"
            />
            Publicado y visible para estudiantes autenticados
          </label>

          <div className="admin-form-actions">
            <button className="primary-button" disabled={saving} type="submit">
              {editingId ? <Save size={17} /> : <Plus size={17} />}
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar documento'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading admin-card-heading-wrap">
          <div>
            <h2>Documentos registrados</h2>
            <p>Filtra los registros por materia o unidad y abre una vista previa sin salir del panel.</p>
          </div>

          <div className="admin-filter-row">
            <select
              className="admin-inline-select"
              onChange={(event) => {
                setFilterSubject(event.target.value)
                setFilterUnit('all')
              }}
              value={filterSubject}
            >
              <option value="all">Todas las materias</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>

            <select
              className="admin-inline-select"
              onChange={(event) => setFilterUnit(event.target.value)}
              value={filterUnit}
            >
              <option value="all">Todas las unidades</option>
              {filterUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.subject?.code || 'Materia'} · U{unit.unit_number} — {unit.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && <AdminLoading label="Cargando documentos..." />}

        {!loading && filteredItems.length === 0 && (
          <AdminEmptyState
            icon={FileText}
            title="No hay documentos registrados"
            description="Registra el primer compendio o recurso mediante un enlace de Google Drive."
          />
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table admin-documents-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Contexto</th>
                  <th>Tipo</th>
                  <th>Proveedor</th>
                  <th>Estado</th>
                  <th className="admin-table-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      {item.start_page && (
                        <small className="admin-table-subtext">
                          Págs. {item.start_page}{item.end_page ? `–${item.end_page}` : ''}
                        </small>
                      )}
                    </td>
                    <td>{getContextLabel(item)}</td>
                    <td>{documentTypes.find(([value]) => value === item.document_type)?.[1] || item.document_type}</td>
                    <td>{item.provider === 'google_drive' ? 'Google Drive' : 'Externo'}</td>
                    <td>
                      <span className={`record-status ${item.is_published ? 'is-published' : 'is-draft'}`}>
                        {item.is_published ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="admin-table-actions">
                      <button
                        aria-label={`Vista previa de ${item.title}`}
                        className="icon-button"
                        onClick={() => setPreviewItem(item)}
                        title="Vista previa"
                        type="button"
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        aria-label={`Editar ${item.title}`}
                        className="icon-button"
                        onClick={() => startEdit(item)}
                        title="Editar"
                        type="button"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        aria-label={`Eliminar ${item.title}`}
                        className="icon-button danger"
                        onClick={() => void handleDelete(item)}
                        title="Eliminar"
                        type="button"
                      >
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

      {previewItem && (
        <section className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Vista previa</h2>
              <p>{getContextLabel(previewItem)}</p>
            </div>
            <button className="button-secondary" onClick={() => setPreviewItem(null)} type="button">
              Cerrar vista previa
            </button>
          </div>

          <PdfViewer
            description={previewItem.description || ''}
            endPage={previewItem.end_page}
            startPage={previewItem.start_page}
            title={previewItem.title}
            url={previewItem.source_url}
          />
        </section>
      )}
    </AdminShell>
  )
}

export default AdminDocumentsPage
