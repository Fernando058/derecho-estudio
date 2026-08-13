import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  BadgeCheck,
  CircleAlert,
  Download,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import AdminLoading from '../../components/admin/AdminLoading'
import AdminNotice from '../../components/admin/AdminNotice'
import {
  buildReadinessExport,
  loadReleaseReadiness,
} from '../../services/admin/readinessService'

function statusClass(value) {
  return value
    ? 'readiness-status is-ready'
    : 'readiness-status is-pending'
}

function downloadJson(data, levelNumber) {
  const payload = JSON.stringify(
    buildReadinessExport(data, levelNumber),
    null,
    2,
  )

  const blob = new Blob(
    [payload],
    { type: 'application/json;charset=utf-8' },
  )

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `derecho-estudio-semestre-${levelNumber}-readiness.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}

function AdminReadinessPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [levelNumber, setLevelNumber] = useState(4)

  const semesterLabel =
    levelNumber === 3
      ? 'Tercer semestre'
      : levelNumber === 5
        ? 'Quinto semestre'
        : 'Cuarto semestre'

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const nextData = await loadReleaseReadiness(levelNumber)
      setData(nextData)
    } catch (loadError) {
      console.error(loadError)
      setError(
        loadError?.message ||
          'No fue posible ejecutar la auditoría de preparación.',
      )
    } finally {
      setLoading(false)
    }
  }, [levelNumber])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const issues = useMemo(() => {
    if (!data) return []

    const result = []
    const summary = data.summary ?? {}

    if (Number(summary.subject_count || 0) !== 5) {
      result.push(
        `${semesterLabel} debe contener 5 materias en el catálogo actual; actualmente hay ${summary.subject_count || 0}.`,
      )
    }

    if (Number(summary.unit_count || 0) !== 20) {
      result.push(
        `Se esperan 20 unidades; actualmente hay ${summary.unit_count || 0}.`,
      )
    }

    for (const unit of data.units) {
      if (Number(unit.topic_count || 0) === 0) {
        result.push(
          `${unit.subject_code || unit.subject_name} · Unidad ${unit.unit_number}: no tiene temas registrados.`,
        )
      }

      if (Number(unit.content_count || 0) === 0) {
        result.push(
          `${unit.subject_code || unit.subject_name} · Unidad ${unit.unit_number}: no tiene contenido académico publicado.`,
        )
      }

      if (Number(unit.active_verified_questions || 0) < 30) {
        result.push(
          `${unit.subject_code || unit.subject_name} · Unidad ${unit.unit_number}: ${unit.active_verified_questions || 0}/30 preguntas listas.`,
        )
      }
    }

    for (const subject of data.subjects) {
      if (!subject.subject_ready) {
        result.push(
          `${subject.subject_code || subject.subject_name}: el simulador final aún no está listo.`,
        )
      }
    }

    return result
  }, [data, semesterLabel])

  if (loading) {
    return (
      <AdminShell
        title="Validación v1.0"
        description={`Auditoría estructural y académica de ${semesterLabel.toLowerCase()}.`}
      >
        <AdminLoading />
      </AdminShell>
    )
  }

  const summary = data?.summary ?? {}

  const structuralReady =
    Number(summary.subject_count || 0) === 5 &&
    Number(summary.unit_count || 0) === 20

  const quizzesReady =
    Number(summary.ready_unit_count || 0) === 20 &&
    Number(summary.ready_subject_count || 0) === 5

  const datasetLoaded =
    Number(summary.dataset_version_count || 0) > 0

  const allReady =
    structuralReady &&
    quizzesReady &&
    datasetLoaded &&
    issues.length === 0

  return (
    <AdminShell
      title="Validación v1.0"
      description={`Comprueba estructura, contenido y bancos de preguntas de ${semesterLabel.toLowerCase()}.`}
      actions={(
        <>
          <label className="readiness-semester-select">
            <span>Semestre</span>
            <select
              value={levelNumber}
              onChange={(event) => setLevelNumber(Number(event.target.value))}
            >
              <option value={3}>Tercer semestre</option>
              <option value={4}>Cuarto semestre</option>
              <option value={5}>Quinto semestre</option>
            </select>
          </label>
          <button
            className="button-secondary"
            onClick={() => void loadData()}
            type="button"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>

          <button
            className="button-secondary"
            disabled={!data}
            onClick={() => downloadJson(data, levelNumber)}
            type="button"
          >
            <Download size={17} />
            Exportar JSON
          </button>
        </>
      )}
    >
      {error && (
        <AdminNotice type="error">
          {error}
        </AdminNotice>
      )}

      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <strong>{summary.subject_count ?? 0}/5</strong>
          <span>Materias de {semesterLabel.toLowerCase()}</span>
        </article>

        <article className="admin-stat-card">
          <strong>{summary.unit_count ?? 0}/20</strong>
          <span>Unidades académicas</span>
        </article>

        <article className="admin-stat-card">
          <strong>{summary.ready_unit_count ?? 0}/20</strong>
          <span>Simuladores de unidad listos</span>
        </article>

        <article className="admin-stat-card">
          <strong>{summary.ready_subject_count ?? 0}/5</strong>
          <span>Simuladores finales listos</span>
        </article>
      </section>

      <section className="readiness-overview-grid">
        <article className="admin-card readiness-overview-card">
          <div className={statusClass(structuralReady)}>
            {structuralReady
              ? <BadgeCheck size={22} />
              : <CircleAlert size={22} />}
            <strong>Estructura académica</strong>
          </div>

          <p>
            Se validan las cinco materias y exactamente cuatro unidades por materia.
          </p>
        </article>

        <article className="admin-card readiness-overview-card">
          <div className={statusClass(datasetLoaded)}>
            {datasetLoaded
              ? <BadgeCheck size={22} />
              : <CircleAlert size={22} />}
            <strong>Dataset integral</strong>
          </div>

          <p>
            {datasetLoaded
              ? `${summary.dataset_version_count} versión(es) de dataset registradas.`
              : 'Todavía no se ha registrado la carga SQL integral de los semestres 3, 4 y 5.'}
          </p>
        </article>

        <article className="admin-card readiness-overview-card">
          <div className={statusClass(quizzesReady)}>
            {quizzesReady
              ? <BadgeCheck size={22} />
              : <CircleAlert size={22} />}
            <strong>Evaluación</strong>
          </div>

          <p>
            20 bancos de unidad con al menos 30 preguntas y 5 finales configurados a 100.
          </p>
        </article>

        <article className="admin-card readiness-overview-card">
          <div className={statusClass(allReady)}>
            {allReady
              ? <ShieldCheck size={22} />
              : <CircleAlert size={22} />}
            <strong>Estado v1.0</strong>
          </div>

          <p>
            {allReady
              ? `${semesterLabel} supera las comprobaciones automáticas.`
              : 'Aún existen elementos académicos o de evaluación pendientes.'}
          </p>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Contenido registrado</h2>
            <p>Conteos del semestre seleccionado y recursos jurídicos registrados.</p>
          </div>
        </div>

        <div className="readiness-count-grid">
          <div><strong>{summary.topic_count ?? 0}</strong><span>Temas/subtemas</span></div>
          <div><strong>{summary.content_count ?? 0}</strong><span>Bloques de contenido</span></div>
          <div><strong>{summary.document_count ?? 0}</strong><span>Documentos publicados</span></div>
          <div><strong>{summary.legal_source_count ?? 0}</strong><span>Fuentes legales</span></div>
          <div><strong>{summary.legal_article_count ?? 0}</strong><span>Artículos jurídicos</span></div>
          <div><strong>{summary.reading_count ?? 0}</strong><span>Lecturas</span></div>
          <div><strong>{summary.active_verified_question_count ?? 0}</strong><span>Preguntas listas</span></div>
          <div><strong>{summary.final_quiz_count ?? 0}</strong><span>Simuladores finales activos</span></div>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Estado por materia</h2>
            <p>La materia queda lista cuando sus cuatro unidades y el simulador final cumplen todos los requisitos.</p>
          </div>
        </div>

        <div className="readiness-subject-list">
          {(data?.subjects ?? []).map((subject) => (
            <article
              className="readiness-subject-row"
              key={subject.subject_id}
            >
              <div>
                <strong>
                  {subject.subject_code || '—'} · {subject.subject_name}
                </strong>
                <span>
                  {subject.unit_count}/4 unidades · {subject.ready_unit_count}/4 listas
                </span>
              </div>

              <div className="readiness-subject-metrics">
                <span>{subject.topic_count} temas</span>
                <span>{subject.content_count} contenidos</span>
                <span>{subject.document_count} documentos</span>
                <span>{subject.active_verified_questions} preguntas</span>
                <span>
                  Final: {subject.final_distribution_total}/100
                </span>
              </div>

              <div className={statusClass(subject.subject_ready)}>
                {subject.subject_ready ? 'Lista' : 'Pendiente'}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Matriz de unidades</h2>
            <p>Permite detectar rápidamente qué parte del dataset final aún necesita información.</p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table readiness-table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Unidad</th>
                <th>Temas</th>
                <th>Contenido</th>
                <th>Normativa</th>
                <th>Lecturas</th>
                <th>Docs.</th>
                <th>Preguntas</th>
                <th>30 preguntas</th>
              </tr>
            </thead>

            <tbody>
              {(data?.units ?? []).map((unit) => (
                <tr key={unit.unit_id}>
                  <td>{unit.subject_code || unit.subject_name}</td>
                  <td>
                    <strong>U{unit.unit_number}</strong>
                    <span className="table-subtext">
                      {unit.unit_title}
                    </span>
                  </td>
                  <td>{unit.topic_count}</td>
                  <td>{unit.content_count}</td>
                  <td>{unit.legal_article_count}</td>
                  <td>{unit.reading_count}</td>
                  <td>{unit.document_count}</td>
                  <td>{unit.active_verified_questions}/30</td>
                  <td>
                    <span className={statusClass(unit.unit_ready)}>
                      {unit.unit_ready ? 'Lista' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Pendientes detectados</h2>
            <p>
              Esta lista permite comprobar lo disponible y los faltantes reales del semestre seleccionado.
            </p>
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="readiness-success-box">
            <BadgeCheck size={26} />
            <div>
              <strong>Sin pendientes automáticos</strong>
              <p>La auditoría no detecta faltantes estructurales.</p>
            </div>
          </div>
        ) : (
          <div className="readiness-issues-list">
            {issues.map((issue, index) => (
              <div key={`${index}-${issue}`}>
                <CircleAlert size={17} />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Versiones de dataset</h2>
            <p>
              Las cargas integrales registran aquí identificador, versión, base documental y checksum.
            </p>
          </div>
        </div>

        {(data?.datasets ?? []).length === 0 ? (
          <div className="admin-empty-state">
            <ShieldCheck size={34} />
            <h3>Sin carga integral registrada</h3>
            <p>
              Es normal mientras no se haya ejecutado una carga académica versionada.
            </p>
          </div>
        ) : (
          <div className="readiness-dataset-list">
            {data.datasets.map((dataset) => (
              <article key={dataset.id}>
                <strong>{dataset.dataset_key}</strong>
                <span>{dataset.version_label}</span>
                <p>{dataset.description || 'Sin descripción.'}</p>
                <small>
                  Aplicado: {new Date(dataset.applied_at).toLocaleString()}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  )
}

export default AdminReadinessPage
