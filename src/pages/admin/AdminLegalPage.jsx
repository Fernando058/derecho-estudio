import { useEffect, useMemo, useState } from 'react'
import { Edit3, Link2, Plus, RotateCcw, Save, Scale, Trash2 } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import AdminNotice from '../../components/admin/AdminNotice'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoading from '../../components/admin/AdminLoading'
import { listSubjects, listTopics, listUnits } from '../../services/admin/academicService'
import {
  createLegalArticle,
  createLegalSource,
  createTopicLegalArticle,
  deleteLegalArticle,
  deleteLegalSource,
  deleteTopicLegalArticle,
  listLegalArticlesAdmin,
  listLegalSourcesAdmin,
  listTopicLegalArticlesAdmin,
  updateLegalArticle,
  updateLegalSource,
  updateTopicLegalArticle,
} from '../../services/admin/legalService'

const sourceTypes = [
  ['constitution', 'Constitución'],
  ['code', 'Código'],
  ['law', 'Ley'],
  ['regulation', 'Reglamento'],
  ['treaty', 'Tratado'],
  ['resolution', 'Resolución'],
  ['jurisprudence', 'Jurisprudencia'],
  ['other', 'Otro'],
]

const statuses = [
  ['active', 'Vigente'],
  ['reformed', 'Reformado'],
  ['repealed', 'Derogado'],
  ['review', 'Revisar vigencia'],
]

const importanceOptions = [
  ['essential', 'Esencial'],
  ['recommended', 'Recomendada'],
  ['complementary', 'Complementaria'],
]

const emptySource = {
  title: '',
  abbreviation: '',
  source_type: 'code',
  jurisdiction: 'Ecuador',
  official_url: '',
  status: 'active',
  is_published: true,
}

const emptyArticle = {
  legal_source_id: '',
  article_number: '',
  heading: '',
  article_text: '',
  explanation: '',
  official_url: '',
  status: 'active',
  is_published: true,
}

const emptyRelation = {
  subject_id: '',
  unit_id: '',
  topic_id: '',
  legal_article_id: '',
  importance: 'recommended',
  notes: '',
}

function AdminLegalPage() {
  const [sources, setSources] = useState([])
  const [articles, setArticles] = useState([])
  const [relations, setRelations] = useState([])
  const [subjects, setSubjects] = useState([])
  const [units, setUnits] = useState([])
  const [topics, setTopics] = useState([])
  const [sourceForm, setSourceForm] = useState(emptySource)
  const [articleForm, setArticleForm] = useState(emptyArticle)
  const [relationForm, setRelationForm] = useState(emptyRelation)
  const [editingSourceId, setEditingSourceId] = useState(null)
  const [editingArticleId, setEditingArticleId] = useState(null)
  const [editingRelation, setEditingRelation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  async function loadData() {
    setLoading(true)
    try {
      const [
        sourceRows,
        articleRows,
        relationRows,
        subjectRows,
        unitRows,
        topicRows,
      ] = await Promise.all([
        listLegalSourcesAdmin(),
        listLegalArticlesAdmin(),
        listTopicLegalArticlesAdmin(),
        listSubjects(),
        listUnits(),
        listTopics(),
      ])

      setSources(sourceRows)
      setArticles(articleRows)
      setRelations(relationRows)
      setSubjects(subjectRows)
      setUnits(unitRows)
      setTopics(topicRows)

      setArticleForm((current) => ({
        ...current,
        legal_source_id: current.legal_source_id || sourceRows[0]?.id || '',
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

  const relationUnits = useMemo(() => {
    if (!relationForm.subject_id) return []
    return units.filter((item) => item.subject_id === relationForm.subject_id)
  }, [relationForm.subject_id, units])

  const relationTopics = useMemo(() => {
    if (!relationForm.unit_id) return []
    return topics.filter((item) => item.unit_id === relationForm.unit_id)
  }, [relationForm.unit_id, topics])

  function setSourceField(field, value) {
    setSourceForm((current) => ({ ...current, [field]: value }))
  }

  function setArticleField(field, value) {
    setArticleForm((current) => ({ ...current, [field]: value }))
  }

  function setRelationField(field, value) {
    setRelationForm((current) => ({ ...current, [field]: value }))
  }

  function resetSource() {
    setEditingSourceId(null)
    setSourceForm(emptySource)
  }

  function resetArticle() {
    setEditingArticleId(null)
    setArticleForm({
      ...emptyArticle,
      legal_source_id: sources[0]?.id || '',
    })
  }

  function resetRelation() {
    setEditingRelation(null)
    setRelationForm(emptyRelation)
  }

  function startSourceEdit(item) {
    setEditingSourceId(item.id)
    setSourceForm({
      title: item.title,
      abbreviation: item.abbreviation || '',
      source_type: item.source_type,
      jurisdiction: item.jurisdiction || 'Ecuador',
      official_url: item.official_url || '',
      status: item.status,
      is_published: item.is_published,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startArticleEdit(item) {
    setEditingArticleId(item.id)
    setArticleForm({
      legal_source_id: item.legal_source_id,
      article_number: item.article_number,
      heading: item.heading || '',
      article_text: item.article_text || '',
      explanation: item.explanation || '',
      official_url: item.official_url || '',
      status: item.status,
      is_published: item.is_published,
    })
    document.getElementById('legal-articles')?.scrollIntoView({ behavior: 'smooth' })
  }

  function startRelationEdit(item) {
    const topic = item.topic
    const unit = topic?.unit

    setEditingRelation({
      topicId: item.topic_id,
      articleId: item.legal_article_id,
    })

    setRelationForm({
      subject_id: unit?.subject_id || '',
      unit_id: topic?.unit_id || '',
      topic_id: item.topic_id,
      legal_article_id: item.legal_article_id,
      importance: item.importance,
      notes: item.notes || '',
    })

    document.getElementById('legal-relations')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function submitSource(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const payload = {
      title: sourceForm.title.trim(),
      abbreviation: sourceForm.abbreviation.trim() || null,
      source_type: sourceForm.source_type,
      jurisdiction: sourceForm.jurisdiction.trim() || null,
      official_url: sourceForm.official_url.trim() || null,
      status: sourceForm.status,
      is_published: Boolean(sourceForm.is_published),
      last_verified_at: new Date().toISOString(),
    }

    try {
      if (editingSourceId) {
        await updateLegalSource(editingSourceId, payload)
      } else {
        await createLegalSource(payload)
      }

      setNotice({
        type: 'success',
        text: editingSourceId ? 'Fuente normativa actualizada.' : 'Fuente normativa creada.',
      })
      resetSource()
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function submitArticle(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const payload = {
      legal_source_id: articleForm.legal_source_id,
      article_number: articleForm.article_number.trim(),
      heading: articleForm.heading.trim() || null,
      article_text: articleForm.article_text.trim() || null,
      explanation: articleForm.explanation.trim() || null,
      official_url: articleForm.official_url.trim() || null,
      status: articleForm.status,
      is_published: Boolean(articleForm.is_published),
      last_verified_at: new Date().toISOString(),
    }

    try {
      if (editingArticleId) {
        await updateLegalArticle(editingArticleId, payload)
      } else {
        await createLegalArticle(payload)
      }

      setNotice({
        type: 'success',
        text: editingArticleId ? 'Artículo actualizado.' : 'Artículo creado.',
      })
      resetArticle()
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

    const relationPayload = {
      importance: relationForm.importance,
      notes: relationForm.notes.trim() || null,
    }

    try {
      if (editingRelation) {
        await updateTopicLegalArticle(
          editingRelation.topicId,
          editingRelation.articleId,
          relationPayload,
        )
      } else {
        await createTopicLegalArticle({
          topic_id: relationForm.topic_id,
          legal_article_id: relationForm.legal_article_id,
          ...relationPayload,
        })
      }

      setNotice({
        type: 'success',
        text: editingRelation ? 'Vinculación actualizada.' : 'Artículo vinculado al tema.',
      })
      resetRelation()
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function removeSource(item) {
    if (!window.confirm(`¿Eliminar "${item.title}"? Sus artículos también se eliminarán.`)) return

    try {
      await deleteLegalSource(item.id)
      setNotice({ type: 'success', text: 'Fuente normativa eliminada.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  async function removeArticle(item) {
    if (!window.confirm(`¿Eliminar el artículo ${item.article_number}?`)) return

    try {
      await deleteLegalArticle(item.id)
      setNotice({ type: 'success', text: 'Artículo eliminado.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  async function removeRelation(item) {
    if (!window.confirm('¿Quitar este artículo del tema?')) return

    try {
      await deleteTopicLegalArticle(item.topic_id, item.legal_article_id)
      setNotice({ type: 'success', text: 'Vinculación eliminada.' })
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
      title="Normativa y base legal"
      description="Administra cuerpos normativos, artículos y su vinculación con los temas de estudio."
    >
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>{editingSourceId ? 'Editar fuente normativa' : 'Nueva fuente normativa'}</h2>
            <p>Constitución, códigos, leyes, tratados, resoluciones y jurisprudencia.</p>
          </div>
          {editingSourceId && (
            <button className="button-secondary" onClick={resetSource} type="button">
              <RotateCcw size={17} /> Cancelar
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={submitSource}>
          <div className="admin-form-grid two-columns">
            <label>
              Título
              <input onChange={(e) => setSourceField('title', e.target.value)} required value={sourceForm.title} />
            </label>

            <label>
              Abreviatura
              <input onChange={(e) => setSourceField('abbreviation', e.target.value)} placeholder="CRE, COIP, COGEP..." value={sourceForm.abbreviation} />
            </label>

            <label>
              Tipo
              <select onChange={(e) => setSourceField('source_type', e.target.value)} value={sourceForm.source_type}>
                {sourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label>
              Jurisdicción
              <input onChange={(e) => setSourceField('jurisdiction', e.target.value)} value={sourceForm.jurisdiction} />
            </label>

            <label className="admin-form-span-2">
              Enlace oficial
              <div className="admin-url-field">
                <Link2 size={18} />
                <input onChange={(e) => setSourceField('official_url', e.target.value)} type="url" value={sourceForm.official_url} />
              </div>
            </label>

            <label>
              Estado
              <select onChange={(e) => setSourceField('status', e.target.value)} value={sourceForm.status}>
                {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label className="admin-checkbox">
              <input checked={sourceForm.is_published} onChange={(e) => setSourceField('is_published', e.target.checked)} type="checkbox" />
              Visible para estudiantes
            </label>
          </div>

          <div className="admin-form-actions">
            <button className="primary-button" disabled={saving} type="submit">
              {editingSourceId ? <Save size={17} /> : <Plus size={17} />}
              {editingSourceId ? 'Guardar fuente' : 'Crear fuente'}
            </button>
          </div>
        </form>

        {loading ? (
          <AdminLoading label="Cargando normativa..." />
        ) : sources.length === 0 ? (
          <AdminEmptyState title="Sin fuentes normativas" description="Registra el primer cuerpo normativo." />
        ) : (
          <div className="admin-table-wrap admin-inner-table">
            <table className="admin-table">
              <thead>
                <tr><th>Fuente</th><th>Tipo</th><th>Estado</th><th>Publicada</th><th className="admin-table-actions">Acciones</th></tr>
              </thead>
              <tbody>
                {sources.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.title}</strong><span className="admin-table-subtext">{item.abbreviation || 'Sin abreviatura'}</span></td>
                    <td>{sourceTypes.find(([value]) => value === item.source_type)?.[1]}</td>
                    <td>{statuses.find(([value]) => value === item.status)?.[1]}</td>
                    <td><span className={`record-status ${item.is_published ? 'is-published' : 'is-draft'}`}>{item.is_published ? 'Sí' : 'No'}</span></td>
                    <td className="admin-table-actions">
                      <button className="icon-button" onClick={() => startSourceEdit(item)} type="button"><Edit3 size={17} /></button>
                      <button className="icon-button danger" onClick={() => removeSource(item)} type="button"><Trash2 size={17} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-card" id="legal-articles">
        <div className="admin-card-heading">
          <div>
            <h2>{editingArticleId ? 'Editar artículo' : 'Nuevo artículo / decisión'}</h2>
            <p>Puedes guardar únicamente la referencia y enlace oficial, o añadir texto y explicación didáctica.</p>
          </div>
          {editingArticleId && (
            <button className="button-secondary" onClick={resetArticle} type="button">
              <RotateCcw size={17} /> Cancelar
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={submitArticle}>
          <div className="admin-form-grid two-columns">
            <label>
              Fuente
              <select onChange={(e) => setArticleField('legal_source_id', e.target.value)} required value={articleForm.legal_source_id}>
                <option value="">Selecciona una fuente</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.abbreviation ? `${source.abbreviation} — ` : ''}{source.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Número / identificación
              <input onChange={(e) => setArticleField('article_number', e.target.value)} placeholder="Art. 76, Sentencia 123-..." required value={articleForm.article_number} />
            </label>

            <label className="admin-form-span-2">
              Encabezado
              <input onChange={(e) => setArticleField('heading', e.target.value)} value={articleForm.heading} />
            </label>

            <label className="admin-form-span-2">
              Texto normativo (opcional)
              <textarea onChange={(e) => setArticleField('article_text', e.target.value)} rows="5" value={articleForm.article_text} />
            </label>

            <label className="admin-form-span-2">
              Explicación para estudio
              <textarea onChange={(e) => setArticleField('explanation', e.target.value)} rows="5" value={articleForm.explanation} />
            </label>

            <label className="admin-form-span-2">
              Enlace oficial
              <div className="admin-url-field">
                <Link2 size={18} />
                <input onChange={(e) => setArticleField('official_url', e.target.value)} type="url" value={articleForm.official_url} />
              </div>
            </label>

            <label>
              Estado
              <select onChange={(e) => setArticleField('status', e.target.value)} value={articleForm.status}>
                {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label className="admin-checkbox">
              <input checked={articleForm.is_published} onChange={(e) => setArticleField('is_published', e.target.checked)} type="checkbox" />
              Visible para estudiantes
            </label>
          </div>

          <div className="admin-form-actions">
            <button className="primary-button" disabled={saving || sources.length === 0} type="submit">
              {editingArticleId ? <Save size={17} /> : <Plus size={17} />}
              {editingArticleId ? 'Guardar artículo' : 'Crear artículo'}
            </button>
          </div>
        </form>

        {articles.length > 0 && (
          <div className="admin-table-wrap admin-inner-table">
            <table className="admin-table">
              <thead>
                <tr><th>Fuente</th><th>Artículo</th><th>Encabezado</th><th>Estado</th><th className="admin-table-actions">Acciones</th></tr>
              </thead>
              <tbody>
                {articles.map((item) => (
                  <tr key={item.id}>
                    <td>{item.legal_source?.abbreviation || item.legal_source?.title}</td>
                    <td><strong>{item.article_number}</strong></td>
                    <td>{item.heading || '—'}</td>
                    <td>{statuses.find(([value]) => value === item.status)?.[1]}</td>
                    <td className="admin-table-actions">
                      <button className="icon-button" onClick={() => startArticleEdit(item)} type="button"><Edit3 size={17} /></button>
                      <button className="icon-button danger" onClick={() => removeArticle(item)} type="button"><Trash2 size={17} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-card" id="legal-relations">
        <div className="admin-card-heading">
          <div>
            <h2>{editingRelation ? 'Editar vinculación' : 'Vincular artículo con tema'}</h2>
            <p>La vinculación determina la base legal que aparecerá en la unidad del estudiante.</p>
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
              Artículo
              <select disabled={Boolean(editingRelation)} onChange={(e) => setRelationField('legal_article_id', e.target.value)} required value={relationForm.legal_article_id}>
                <option value="">Selecciona un artículo</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.legal_source?.abbreviation || article.legal_source?.title} · {article.article_number}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Importancia
              <select onChange={(e) => setRelationField('importance', e.target.value)} value={relationForm.importance}>
                {importanceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label>
              Nota
              <input onChange={(e) => setRelationField('notes', e.target.value)} value={relationForm.notes} />
            </label>
          </div>

          <div className="admin-form-actions">
            <button className="primary-button" disabled={saving || articles.length === 0} type="submit">
              {editingRelation ? <Save size={17} /> : <Plus size={17} />}
              {editingRelation ? 'Guardar vinculación' : 'Vincular artículo'}
            </button>
          </div>
        </form>

        {relations.length === 0 ? (
          <AdminEmptyState title="Sin relaciones normativas" description="Vincula artículos con los temas para que aparezcan al estudiante." />
        ) : (
          <div className="admin-table-wrap admin-inner-table">
            <table className="admin-table admin-legal-relations-table">
              <thead>
                <tr><th>Materia / unidad</th><th>Tema</th><th>Artículo</th><th>Importancia</th><th className="admin-table-actions">Acciones</th></tr>
              </thead>
              <tbody>
                {relations.map((item) => (
                  <tr key={`${item.topic_id}-${item.legal_article_id}`}>
                    <td><strong>{item.topic?.unit?.subject?.code || '—'}</strong><span className="admin-table-subtext">Unidad {item.topic?.unit?.unit_number}</span></td>
                    <td>{item.topic?.title}</td>
                    <td><strong>{item.legal_article?.legal_source?.abbreviation || item.legal_article?.legal_source?.title}</strong> · {item.legal_article?.article_number}</td>
                    <td>{importanceOptions.find(([value]) => value === item.importance)?.[1]}</td>
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

      <section className="admin-card admin-help-card">
        <Scale size={24} />
        <div>
          <h3>Vigencia jurídica</h3>
          <p>El estado y la fecha de verificación sirven como control editorial. Antes de publicar un análisis dependiente de una norma, verifica siempre su vigencia en una fuente oficial.</p>
        </div>
      </section>
    </AdminShell>
  )
}

export default AdminLegalPage
