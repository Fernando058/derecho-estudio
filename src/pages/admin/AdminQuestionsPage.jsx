import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Edit3,
  FileQuestion,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminShell from '../../components/admin/AdminShell'
import AdminNotice from '../../components/admin/AdminNotice'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoading from '../../components/admin/AdminLoading'
import {
  listSubjects,
  listTopics,
  listUnits,
} from '../../services/admin/academicService'
import { listLegalArticlesAdmin } from '../../services/admin/legalService'
import {
  deleteQuestion,
  listQuestionsAdmin,
  saveQuestion,
} from '../../services/admin/questionService'

const questionTypes = [
  ['multiple_choice', 'Selección múltiple'],
  ['conceptual', 'Conceptual'],
  ['normative', 'Normativa'],
  ['case_based', 'Caso práctico'],
  ['jurisprudence', 'Jurisprudencia'],
]

const difficulties = [
  ['basic', 'Básica'],
  ['intermediate', 'Intermedia'],
  ['advanced', 'Avanzada'],
]

const optionKeys = ['A', 'B', 'C', 'D']

function createEmptyOptions() {
  return optionKeys.map((key) => ({
    key,
    text: '',
    feedback: '',
    is_correct: key === 'A',
  }))
}

const emptyForm = {
  subject_id: '',
  unit_id: '',
  topic_id: '',
  legal_article_id: '',
  question_text: '',
  question_type: 'multiple_choice',
  difficulty: 'intermediate',
  source_reference: '',
  correct_explanation: '',
  is_active: true,
  is_verified: false,
  options: createEmptyOptions(),
}

function AdminQuestionsPage() {
  const [items, setItems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [units, setUnits] = useState([])
  const [topics, setTopics] = useState([])
  const [legalArticles, setLegalArticles] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterUnit, setFilterUnit] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const [questionRows, subjectRows, unitRows, topicRows, articleRows] = await Promise.all([
        listQuestionsAdmin(),
        listSubjects(),
        listUnits(),
        listTopics(),
        listLegalArticlesAdmin(),
      ])

      setItems(questionRows)
      setSubjects(subjectRows)
      setUnits(unitRows)
      setTopics(topicRows)
      setLegalArticles(articleRows)
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const formUnits = useMemo(() => {
    if (!form.subject_id) return []
    return units.filter((unit) => unit.subject_id === form.subject_id)
  }, [form.subject_id, units])

  const formTopics = useMemo(() => {
    if (!form.unit_id) return []
    return topics.filter((topic) => topic.unit_id === form.unit_id)
  }, [form.unit_id, topics])

  const filterUnits = useMemo(() => {
    if (filterSubject === 'all') return units
    return units.filter((unit) => unit.subject_id === filterSubject)
  }, [filterSubject, units])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()

    return items.filter((item) => {
      if (filterSubject !== 'all' && item.unit?.subject_id !== filterSubject) return false
      if (filterUnit !== 'all' && item.unit_id !== filterUnit) return false
      if (filterStatus === 'verified' && !item.is_verified) return false
      if (filterStatus === 'pending' && item.is_verified) return false
      if (filterStatus === 'inactive' && item.is_active) return false
      if (term && !item.question_text.toLowerCase().includes(term)) return false
      return true
    })
  }, [filterStatus, filterSubject, filterUnit, items, search])

  const summary = useMemo(() => ({
    total: items.length,
    verified: items.filter((item) => item.is_verified && item.is_active).length,
    pending: items.filter((item) => !item.is_verified).length,
    inactive: items.filter((item) => !item.is_active).length,
  }), [items])

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
    const unit = units.find((item) => item.id === unitId)
    setForm((current) => ({
      ...current,
      subject_id: unit?.subject_id || current.subject_id,
      unit_id: unitId,
      topic_id: '',
    }))
  }

  function updateOption(index, field, value) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => {
        if (field === 'is_correct') {
          return {
            ...option,
            is_correct: optionIndex === index,
          }
        }

        if (optionIndex !== index) return option
        return { ...option, [field]: value }
      }),
    }))
  }

  function resetForm() {
    setEditingId(null)
    setForm({
      ...emptyForm,
      options: createEmptyOptions(),
    })
  }

  function startEdit(item) {
    const correctOptionId = item.answer?.correct_option_id
    const existingByKey = new Map(item.options.map((option) => [option.option_key, option]))

    setEditingId(item.id)
    setForm({
      subject_id: item.unit?.subject_id || '',
      unit_id: item.unit_id,
      topic_id: item.topic_id || '',
      legal_article_id: item.legal_article_id || '',
      question_text: item.question_text,
      question_type: item.question_type,
      difficulty: item.difficulty,
      source_reference: item.source_reference || '',
      correct_explanation: item.answer?.correct_explanation || '',
      is_active: item.is_active,
      is_verified: item.is_verified,
      options: optionKeys.map((key) => {
        const option = existingByKey.get(key)
        return {
          key,
          text: option?.option_text || '',
          feedback: option?.feedback || '',
          is_correct: option?.id === correctOptionId,
        }
      }),
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

    if (!form.question_text.trim()) {
      setNotice({ type: 'error', text: 'La pregunta no puede estar vacía.' })
      setSaving(false)
      return
    }

    if (!form.correct_explanation.trim()) {
      setNotice({ type: 'error', text: 'Incluye la explicación general de la respuesta correcta.' })
      setSaving(false)
      return
    }

    if (form.options.some((option) => !option.text.trim() || !option.feedback.trim())) {
      setNotice({
        type: 'error',
        text: 'Las cuatro opciones deben tener texto y feedback individual.',
      })
      setSaving(false)
      return
    }

    try {
      await saveQuestion({
        id: editingId,
        unit_id: form.unit_id,
        topic_id: form.topic_id || null,
        legal_article_id: form.legal_article_id || null,
        question_text: form.question_text.trim(),
        question_type: form.question_type,
        difficulty: form.difficulty,
        source_reference: form.source_reference.trim() || null,
        correct_explanation: form.correct_explanation.trim(),
        is_active: form.is_active,
        is_verified: form.is_verified,
        options: form.options.map((option) => ({
          key: option.key,
          text: option.text.trim(),
          feedback: option.feedback.trim(),
          is_correct: option.is_correct,
        })),
      })

      setNotice({
        type: 'success',
        text: editingId ? 'Pregunta actualizada correctamente.' : 'Pregunta creada correctamente.',
      })
      resetForm()
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('¿Eliminar esta pregunta y todas sus opciones y explicaciones?')) return

    try {
      await deleteQuestion(item.id)
      if (editingId === item.id) resetForm()
      setNotice({ type: 'success', text: 'Pregunta eliminada.' })
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  return (
    <AdminShell
      title="Banco de preguntas"
      description="Crea, revisa y organiza reactivos con cuatro alternativas, respuesta protegida y feedback pedagógico individual."
      actions={(
        <Link className="primary-button" to="/admin/preguntas/importar">
          <Upload size={18} /> Importar banco
        </Link>
      )}
    >
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <section className="admin-stats-grid question-stats-grid">
        <article className="admin-stat-card"><strong>{summary.total}</strong><span>Total</span></article>
        <article className="admin-stat-card"><strong>{summary.verified}</strong><span>Activas y verificadas</span></article>
        <article className="admin-stat-card"><strong>{summary.pending}</strong><span>Pendientes de verificar</span></article>
        <article className="admin-stat-card"><strong>{summary.inactive}</strong><span>Inactivas</span></article>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>{editingId ? 'Editar pregunta' : 'Nueva pregunta'}</h2>
            <p>La respuesta correcta se almacena separada de las opciones visibles para los estudiantes.</p>
          </div>

          {editingId && (
            <button className="button-secondary" onClick={resetForm} type="button">
              <RotateCcw size={17} /> Cancelar edición
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid three-columns">
            <label>
              Materia
              <select required value={form.subject_id} onChange={(event) => handleSubjectChange(event.target.value)}>
                <option value="">Selecciona una materia</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>

            <label>
              Unidad
              <select required value={form.unit_id} onChange={(event) => handleUnitChange(event.target.value)}>
                <option value="">Selecciona una unidad</option>
                {formUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>Unidad {unit.unit_number} — {unit.title}</option>
                ))}
              </select>
            </label>

            <label>
              Tema (opcional)
              <select value={form.topic_id} onChange={(event) => updateField('topic_id', event.target.value)}>
                <option value="">Sin tema específico</option>
                {formTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.title}</option>
                ))}
              </select>
            </label>

            <label>
              Tipo
              <select value={form.question_type} onChange={(event) => updateField('question_type', event.target.value)}>
                {questionTypes.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              Dificultad
              <select value={form.difficulty} onChange={(event) => updateField('difficulty', event.target.value)}>
                {difficulties.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              Artículo relacionado (opcional)
              <select value={form.legal_article_id} onChange={(event) => updateField('legal_article_id', event.target.value)}>
                <option value="">Sin artículo específico</option>
                {legalArticles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.legal_source?.abbreviation || article.legal_source?.title} · Art. {article.article_number}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Pregunta
            <textarea
              rows="4"
              required
              value={form.question_text}
              onChange={(event) => updateField('question_text', event.target.value)}
              placeholder="Redacta el enunciado completo..."
            />
          </label>

          <div className="question-options-editor">
            {form.options.map((option, index) => (
              <article className={`question-option-editor${option.is_correct ? ' is-correct' : ''}`} key={option.key}>
                <div className="question-option-key">{option.key}</div>

                <div className="question-option-fields">
                  <label>
                    Texto de la opción
                    <textarea
                      rows="2"
                      required
                      value={option.text}
                      onChange={(event) => updateOption(index, 'text', event.target.value)}
                    />
                  </label>

                  <label>
                    Feedback de esta opción
                    <textarea
                      rows="3"
                      required
                      value={option.feedback}
                      onChange={(event) => updateOption(index, 'feedback', event.target.value)}
                      placeholder={option.is_correct
                        ? 'Explica por qué esta alternativa es correcta.'
                        : 'Explica por qué esta alternativa es incorrecta.'}
                    />
                  </label>

                  <label className="question-correct-selector">
                    <input
                      checked={option.is_correct}
                      name="correct-option"
                      onChange={() => updateOption(index, 'is_correct', true)}
                      type="radio"
                    />
                    <CheckCircle2 size={17} /> Respuesta correcta
                  </label>
                </div>
              </article>
            ))}
          </div>

          <label>
            Explicación general de la respuesta correcta
            <textarea
              rows="4"
              required
              value={form.correct_explanation}
              onChange={(event) => updateField('correct_explanation', event.target.value)}
              placeholder="Explicación jurídica que verá el estudiante durante la revisión..."
            />
          </label>

          <label>
            Fuente o referencia interna (opcional)
            <input
              value={form.source_reference}
              onChange={(event) => updateField('source_reference', event.target.value)}
              placeholder="Ej.: Compendio Penal I, Unidad 1, pág. 12"
            />
          </label>

          <div className="admin-checkbox-row">
            <label className="admin-checkbox">
              <input
                checked={form.is_active}
                onChange={(event) => updateField('is_active', event.target.checked)}
                type="checkbox"
              />
              Activa
            </label>

            <label className="admin-checkbox">
              <input
                checked={form.is_verified}
                onChange={(event) => updateField('is_verified', event.target.checked)}
                type="checkbox"
              />
              Verificada para simuladores
            </label>
          </div>

          <button className="primary-button" disabled={saving} type="submit">
            {editingId ? <Save size={18} /> : <Plus size={18} />}
            {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear pregunta'}
          </button>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Preguntas registradas</h2>
            <p>{filteredItems.length} de {items.length} pregunta(s).</p>
          </div>
        </div>

        <div className="admin-filters question-filters">
          <input
            placeholder="Buscar en el enunciado..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={filterSubject}
            onChange={(event) => {
              setFilterSubject(event.target.value)
              setFilterUnit('all')
            }}
          >
            <option value="all">Todas las materias</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>

          <select value={filterUnit} onChange={(event) => setFilterUnit(event.target.value)}>
            <option value="all">Todas las unidades</option>
            {filterUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>Unidad {unit.unit_number} — {unit.title}</option>
            ))}
          </select>

          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="verified">Verificadas</option>
            <option value="pending">Pendientes</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>

        {loading ? (
          <AdminLoading label="Cargando preguntas..." />
        ) : filteredItems.length === 0 ? (
          <AdminEmptyState
            icon={FileQuestion}
            title="No hay preguntas para mostrar"
            description="Crea una pregunta o cambia los filtros."
          />
        ) : (
          <div className="question-bank-list">
            {filteredItems.map((item) => {
              const correctKey = item.options.find((option) => option.id === item.answer?.correct_option_id)?.option_key

              return (
                <article className="question-bank-card" key={item.id}>
                  <div className="question-bank-card-top">
                    <div>
                      <span className="status-badge">{item.unit?.subject?.code}</span>
                      <span className="status-badge">Unidad {item.unit?.unit_number}</span>
                      <span className="status-badge">{difficulties.find(([value]) => value === item.difficulty)?.[1]}</span>
                    </div>

                    <div>
                      <span className={`question-status ${item.is_verified ? 'is-verified' : 'is-pending'}`}>
                        {item.is_verified ? 'Verificada' : 'Pendiente'}
                      </span>
                      {!item.is_active && <span className="question-status is-inactive">Inactiva</span>}
                    </div>
                  </div>

                  <h3>{item.question_text}</h3>

                  <div className="question-bank-options-preview">
                    {item.options.map((option) => (
                      <div className={option.option_key === correctKey ? 'is-correct' : ''} key={option.id}>
                        <strong>{option.option_key}.</strong> {option.option_text}
                      </div>
                    ))}
                  </div>

                  <div className="question-bank-meta">
                    <span>Tema: {item.topic?.title || 'General de la unidad'}</span>
                    <span>Correcta: {correctKey || '—'}</span>
                  </div>

                  <div className="admin-row-actions">
                    <button className="button-secondary" onClick={() => startEdit(item)} type="button">
                      <Edit3 size={16} /> Editar
                    </button>
                    <button className="button-danger" onClick={() => handleDelete(item)} type="button">
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </AdminShell>
  )
}

export default AdminQuestionsPage
