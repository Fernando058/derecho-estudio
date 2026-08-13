import { useEffect, useMemo, useState } from 'react'
import {
  Clock3,
  FileQuestion,
  LoaderCircle,
  Save,
  Shuffle,
} from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import {
  listQuizConfigs,
  updateQuizConfig,
} from '../../services/admin/quizConfigService'

function configLabel(config) {
  if (config.quiz_type === 'unit_30') {
    return `Unidad ${config.unit?.unit_number ?? '?'} · 30 preguntas`
  }

  return 'Simulador final · 100 preguntas'
}

function toDraft(config) {
  return {
    timeLimitMinutes: config.time_limit_minutes ?? '',
    randomizeQuestions: Boolean(config.randomize_questions),
    randomizeOptions: Boolean(config.randomize_options),
    isActive: Boolean(config.is_active),
    distribution: (config.distribution ?? [])
      .slice()
      .sort((a, b) => (a.unit?.unit_number ?? 0) - (b.unit?.unit_number ?? 0))
      .map((item) => ({
        unit_id: item.unit_id,
        unit_number: item.unit?.unit_number,
        title: item.unit?.title,
        question_count: Number(item.question_count),
      })),
  }
}

function AdminQuizConfigsPage() {
  const [configs, setConfigs] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    setLoading(true)
    setError('')

    try {
      const items = await listQuizConfigs()
      setConfigs(items)
      setDrafts(Object.fromEntries(items.map((item) => [item.id, toDraft(item)])))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const grouped = useMemo(() => {
    const map = new Map()

    for (const config of configs) {
      const subjectId = config.subject?.id ?? 'unknown'
      const current = map.get(subjectId) ?? {
        subject: config.subject,
        items: [],
      }
      current.items.push(config)
      map.set(subjectId, current)
    }

    return [...map.values()].sort((a, b) => (
      (a.subject?.name ?? '').localeCompare(b.subject?.name ?? '')
    ))
  }, [configs])

  function patchDraft(configId, patch) {
    setDrafts((previous) => ({
      ...previous,
      [configId]: {
        ...previous[configId],
        ...patch,
      },
    }))
  }

  function patchDistribution(configId, unitId, value) {
    setDrafts((previous) => ({
      ...previous,
      [configId]: {
        ...previous[configId],
        distribution: previous[configId].distribution.map((item) => (
          item.unit_id === unitId
            ? { ...item, question_count: Number(value) }
            : item
        )),
      },
    }))
  }

  async function handleSave(config) {
    const draft = drafts[config.id]
    if (!draft || savingId) return

    setError('')
    setSuccess('')

    if (config.quiz_type === 'subject_100') {
      const total = draft.distribution.reduce(
        (sum, item) => sum + Number(item.question_count || 0),
        0,
      )

      if (total !== 100) {
        setError(`La distribución de ${config.subject?.name} debe sumar exactamente 100. Actualmente suma ${total}.`)
        return
      }
    }

    setSavingId(config.id)

    try {
      await updateQuizConfig({
        id: config.id,
        timeLimitMinutes: draft.timeLimitMinutes === ''
          ? null
          : Number(draft.timeLimitMinutes),
        randomizeQuestions: draft.randomizeQuestions,
        randomizeOptions: draft.randomizeOptions,
        isActive: draft.isActive,
        distribution: config.quiz_type === 'subject_100'
          ? draft.distribution.map((item) => ({
              unit_id: item.unit_id,
              question_count: Number(item.question_count),
            }))
          : null,
      })

      setSuccess(`Configuración guardada: ${config.subject?.name} · ${configLabel(config)}.`)
      await load()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSavingId('')
    }
  }

  return (
    <AdminShell
      title="Configuración de simuladores"
      description="Controla tiempos, aleatorización, disponibilidad y distribución del simulador final de cada materia."
    >
      {error && <div className="auth-message auth-error">{error}</div>}
      {success && <div className="auth-message auth-success">{success}</div>}

      {loading ? (
        <section className="loading-state">
          <LoaderCircle className="spin" size={34} />
          <h2>Cargando configuraciones...</h2>
        </section>
      ) : (
        <div className="admin-config-subject-list">
          {grouped.map((group) => (
            <section className="admin-card" key={group.subject?.id}>
              <div className="admin-card-heading">
                <div>
                  <span className="eyebrow">{group.subject?.code}</span>
                  <h2>{group.subject?.name}</h2>
                </div>
              </div>

              <div className="admin-config-list">
                {group.items
                  .slice()
                  .sort((a, b) => {
                    if (a.quiz_type !== b.quiz_type) return a.quiz_type === 'unit_30' ? -1 : 1
                    return (a.unit?.unit_number ?? 99) - (b.unit?.unit_number ?? 99)
                  })
                  .map((config) => {
                    const draft = drafts[config.id]
                    if (!draft) return null

                    const distributionTotal = draft.distribution.reduce(
                      (sum, item) => sum + Number(item.question_count || 0),
                      0,
                    )

                    return (
                      <article className="admin-config-card" key={config.id}>
                        <div className="admin-config-card-title">
                          <div>
                            <FileQuestion size={23} />
                            <div>
                              <strong>{configLabel(config)}</strong>
                              <span>{config.quiz_type === 'unit_30' ? 'Cantidad fija por diseño' : 'Distribución configurable entre las 4 unidades'}</span>
                            </div>
                          </div>
                          <span className={`status-badge${draft.isActive ? '' : ' is-muted'}`}>
                            {draft.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        <div className="admin-config-controls">
                          <label>
                            <span><Clock3 size={16} /> Tiempo límite</span>
                            <input
                              min="5"
                              max="300"
                              onChange={(event) => patchDraft(config.id, { timeLimitMinutes: event.target.value })}
                              type="number"
                              value={draft.timeLimitMinutes}
                            />
                            <small>Minutos. Vacío = sin límite.</small>
                          </label>

                          <label className="admin-check-row">
                            <input
                              checked={draft.randomizeQuestions}
                              onChange={(event) => patchDraft(config.id, { randomizeQuestions: event.target.checked })}
                              type="checkbox"
                            />
                            <span><Shuffle size={16} /> Aleatorizar preguntas</span>
                          </label>

                          <label className="admin-check-row">
                            <input
                              checked={draft.randomizeOptions}
                              onChange={(event) => patchDraft(config.id, { randomizeOptions: event.target.checked })}
                              type="checkbox"
                            />
                            <span><Shuffle size={16} /> Aleatorizar opciones</span>
                          </label>

                          <label className="admin-check-row">
                            <input
                              checked={draft.isActive}
                              onChange={(event) => patchDraft(config.id, { isActive: event.target.checked })}
                              type="checkbox"
                            />
                            <span>Simulador disponible</span>
                          </label>
                        </div>

                        {config.quiz_type === 'subject_100' && (
                          <div className="admin-distribution-box">
                            <div className="admin-distribution-heading">
                              <strong>Distribución del simulador final</strong>
                              <span>Total: {distributionTotal}/100</span>
                            </div>

                            <div className="admin-distribution-grid">
                              {draft.distribution.map((item) => (
                                <label key={item.unit_id}>
                                  <span>Unidad {item.unit_number}</span>
                                  <small>{item.title}</small>
                                  <input
                                    min="1"
                                    max="97"
                                    onChange={(event) => patchDistribution(config.id, item.unit_id, event.target.value)}
                                    type="number"
                                    value={item.question_count}
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          className="primary-button"
                          disabled={Boolean(savingId)}
                          onClick={() => handleSave(config)}
                          type="button"
                        >
                          {savingId === config.id
                            ? <LoaderCircle className="spin" size={17} />
                            : <Save size={17} />}
                          Guardar configuración
                        </button>
                      </article>
                    )
                  })}
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  )
}

export default AdminQuizConfigsPage
