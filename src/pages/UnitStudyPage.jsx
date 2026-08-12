import { useEffect, useMemo, useState } from 'react'
import {
  BookMarked,
  BookOpenCheck,
  ExternalLink,
  FileText,
  Gavel,
  KeyRound,
  Lightbulb,
  LoaderCircle,
  Scale,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import QuizLaunchActions from '../components/quiz/QuizLaunchActions'
import { getUnitStudyData } from '../services/studyService'

const typeLabels = {
  introduction: 'Introducción',
  summary: 'Resumen',
  analysis: 'Análisis jurídico',
  key_concepts: 'Conceptos clave',
  exam_tips: 'Claves para evaluación',
  example: 'Ejemplo',
  warning: 'Advertencia',
  custom: 'Contenido',
}

const contentIcons = {
  introduction: BookOpenCheck,
  summary: FileText,
  analysis: Gavel,
  key_concepts: KeyRound,
  exam_tips: Lightbulb,
  example: Lightbulb,
  warning: Scale,
  custom: FileText,
}

const importanceLabels = {
  essential: 'Esencial',
  recommended: 'Recomendada',
  complementary: 'Complementaria',
}

const relevanceLabels = {
  essential: 'Esencial',
  recommended: 'Recomendada',
  complementary: 'Complementaria',
}

function ContentBlock({ block }) {
  const Icon = contentIcons[block.content_type] || FileText

  return (
    <article className={`study-content-block type-${block.content_type}`}>
      <div className="study-content-icon">
        <Icon size={20} />
      </div>

      <div>
        <span className="study-content-type">
          {typeLabels[block.content_type] || block.content_type}
        </span>

        {block.title && <h3>{block.title}</h3>}

        <div className="study-rich-text">
          {block.content}
        </div>
      </div>
    </article>
  )
}

function UnitStudyPage() {
  const { subjectSlug, unitNumber } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      try {
        setData(await getUnitStudyData(subjectSlug, Number(unitNumber)))
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [subjectSlug, unitNumber])

  const topicTitleById = useMemo(
    () => new Map((data?.topics ?? []).map((topic) => [topic.id, topic.title])),
    [data],
  )

  const generalBlocks = useMemo(
    () => (data?.contentBlocks ?? []).filter((block) => !block.topic_id),
    [data],
  )

  const blocksByTopic = useMemo(() => {
    const map = new Map()

    for (const block of data?.contentBlocks ?? []) {
      if (!block.topic_id) continue
      if (!map.has(block.topic_id)) map.set(block.topic_id, [])
      map.get(block.topic_id).push(block)
    }

    return map
  }, [data])

  if (loading) {
    return (
      <main className="page">
        <section className="loading-state">
          <LoaderCircle className="spin" size={36} />
          <h2>Cargando unidad...</h2>
        </section>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page">
        <section className="feature-card">
          <h1>Unidad no disponible</h1>
          <p>{error || 'No encontramos esta unidad.'}</p>
          <Link className="back-link" to="/dashboard">← Dashboard</Link>
        </section>
      </main>
    )
  }

  const {
    subject,
    unit,
    topics,
    legalArticles,
    readings,
    documents,
    readyQuestionCount,
    quizConfig,
  } = data

  return (
    <main className="page study-page">
      <div className="study-breadcrumbs">
        <Link to="/dashboard">Dashboard</Link>
        <span>›</span>
        <Link to={`/materias/${subject.slug}`}>{subject.name}</Link>
        <span>›</span>
        <strong>Unidad {unit.unit_number}</strong>
      </div>

      <section className="study-hero unit-hero">
        <div>
          <p className="eyebrow">{subject.code} · Unidad {unit.unit_number}</p>
          <h1>{unit.title}</h1>

          {unit.summary && <p>{unit.summary}</p>}

          {unit.learning_outcome && (
            <div className="learning-outcome">
              <strong>Resultado de aprendizaje</strong>
              <span>{unit.learning_outcome}</span>
            </div>
          )}
        </div>

        <BookOpenCheck size={52} />
      </section>

      {generalBlocks.length > 0 && (
        <section className="study-section">
          <div className="study-section-heading">
            <FileText size={24} />
            <div>
              <h2>Análisis de la unidad</h2>
              <p>Contenido general preparado para el estudio.</p>
            </div>
          </div>

          <div className="study-content-list">
            {generalBlocks.map((block) => (
              <ContentBlock block={block} key={block.id} />
            ))}
          </div>
        </section>
      )}

      <section className="study-section">
        <div className="study-section-heading">
          <BookOpenCheck size={24} />
          <div>
            <h2>Temas de la unidad</h2>
            <p>{topics.length} tema(s) y subtema(s) publicados.</p>
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="study-empty-inline">
            Aún no se han publicado temas para esta unidad.
          </div>
        ) : (
          <div className="study-topics-list">
            {topics.map((topic) => (
              <article
                className={`study-topic ${topic.parent_topic_id ? 'is-subtopic' : ''}`}
                key={topic.id}
              >
                <div className="study-topic-heading">
                  <div>
                    <span>
                      {topic.parent_topic_id
                        ? `Subtema de ${topicTitleById.get(topic.parent_topic_id) || 'tema principal'}`
                        : 'Tema principal'}
                    </span>
                    <h3>{topic.title}</h3>
                    {topic.description && <p>{topic.description}</p>}
                  </div>
                </div>

                {(blocksByTopic.get(topic.id) || []).map((block) => (
                  <ContentBlock block={block} key={block.id} />
                ))}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="study-section">
        <div className="study-section-heading">
          <Scale size={24} />
          <div>
            <h2>Base legal y artículos</h2>
            <p>Normativa vinculada con los temas de esta unidad.</p>
          </div>
        </div>

        {legalArticles.length === 0 ? (
          <div className="study-empty-inline">
            No se han vinculado artículos jurídicos todavía.
          </div>
        ) : (
          <div className="legal-study-grid">
            {legalArticles.map((relation) => {
              const article = relation.legal_article
              const source = article?.legal_source
              const officialUrl = article?.official_url || source?.official_url

              return (
                <article
                  className="legal-study-card"
                  key={`${relation.topic_id}-${article?.id}`}
                >
                  <div className="legal-study-card-top">
                    <span className="document-type-badge">
                      {importanceLabels[relation.importance] || relation.importance}
                    </span>
                    <span>{topicTitleById.get(relation.topic_id) || 'Tema'}</span>
                  </div>

                  <h3>{source?.abbreviation || source?.title} · Art. {article?.article_number}</h3>
                  {article?.heading && <strong>{article.heading}</strong>}
                  {article?.explanation && <p>{article.explanation}</p>}
                  {relation.notes && <p className="study-note">{relation.notes}</p>}

                  {officialUrl && (
                    <a className="text-link" href={officialUrl} rel="noreferrer" target="_blank">
                      Consultar fuente oficial <ExternalLink size={14} />
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="study-section">
        <div className="study-section-heading">
          <BookMarked size={24} />
          <div>
            <h2>Lecturas recomendadas</h2>
            <p>Recursos para profundizar y complementar el compendio.</p>
          </div>
        </div>

        {readings.length === 0 ? (
          <div className="study-empty-inline">
            No se han publicado lecturas recomendadas todavía.
          </div>
        ) : (
          <div className="reading-study-grid">
            {readings.map((relation) => {
              const reading = relation.reading

              return (
                <article
                  className="reading-study-card"
                  key={`${relation.topic_id}-${reading?.id}`}
                >
                  <span className="document-type-badge">
                    {relevanceLabels[relation.relevance] || relation.relevance}
                  </span>

                  <h3>{reading?.title}</h3>
                  <p>
                    {[reading?.author, reading?.publication_year]
                      .filter(Boolean)
                      .join(' · ') || 'Datos bibliográficos pendientes'}
                  </p>

                  {reading?.description && <p>{reading.description}</p>}

                  {reading?.url && (
                    <a className="button-secondary" href={reading.url} rel="noreferrer" target="_blank">
                      Abrir lectura <ExternalLink size={16} />
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="study-section">
        <div className="study-section-heading">
          <FileText size={24} />
          <div>
            <h2>Compendios y documentos</h2>
            <p>Material de apoyo vinculado específicamente con esta unidad.</p>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="study-empty-inline">
            No hay documentos publicados para esta unidad.
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map((document) => (
              <article className="document-card" key={document.id}>
                <div className="document-card-icon"><FileText size={22} /></div>
                <span className="document-type-badge">{document.document_type}</span>
                <h2>{document.title}</h2>
                <p>{document.description || 'Documento de estudio.'}</p>

                {(document.start_page || document.end_page) && (
                  <span className="pdf-page-range">
                    Páginas {document.start_page || '—'}–{document.end_page || '—'}
                  </span>
                )}

                <Link className="primary-button" to={`/documentos/${document.id}`}>
                  Abrir documento
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="study-unit-quiz">
        <div className="study-final-exam-copy">
          <p className="eyebrow">Simulador de unidad</p>
          <h2>30 preguntas exclusivamente de la Unidad {unit.unit_number}</h2>
          <p>
            El servidor selecciona 30 preguntas activas y verificadas de esta unidad.
            En modo examen la retroalimentación se muestra al finalizar; en modo práctica,
            después de cada respuesta.
          </p>
        </div>

        <QuizLaunchActions
          quizConfig={quizConfig}
          ready={readyQuestionCount >= (quizConfig?.question_count ?? 30)}
          readyLabel={`${readyQuestionCount}/${quizConfig?.question_count ?? 30} preguntas listas`}
        />
      </section>
    </main>
  )
}

export default UnitStudyPage
