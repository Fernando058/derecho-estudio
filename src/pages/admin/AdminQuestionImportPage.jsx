import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminShell from '../../components/admin/AdminShell'
import AdminNotice from '../../components/admin/AdminNotice'
import {
  listSubjects,
  listTopics,
  listUnits,
} from '../../services/admin/academicService'
import {
  listLegalArticlesAdmin,
  listLegalSourcesAdmin,
} from '../../services/admin/legalService'
import { saveQuestion } from '../../services/admin/questionService'
import { parseSpreadsheetFile } from '../../utils/spreadsheet'

const requiredColumns = [
  'materia_codigo',
  'unidad',
  'pregunta',
  'opcion_a',
  'opcion_b',
  'opcion_c',
  'opcion_d',
  'correcta',
  'explicacion_correcta',
  'feedback_a',
  'feedback_b',
  'feedback_c',
  'feedback_d',
]

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function normalizeHeader(value) {
  return normalize(value).replace(/\s+/g, '_')
}

function booleanValue(value, fallback) {
  if (value === '' || value == null) return fallback
  return ['si', 'sí', 'yes', 'true', '1', 'x'].includes(normalize(value))
}

function normalizeQuestionType(value) {
  const key = normalize(value)
  if (!key || ['test', 'multiple_choice', 'seleccion_multiple', 'selección_múltiple'].includes(key)) return 'multiple_choice'
  if (['conceptual', 'concepto'].includes(key)) return 'conceptual'
  if (['normative', 'normativa', 'normativo'].includes(key)) return 'normative'
  if (['case_based', 'caso', 'caso_practico', 'caso_práctico'].includes(key)) return 'case_based'
  if (['jurisprudence', 'jurisprudencia'].includes(key)) return 'jurisprudence'
  return null
}

function normalizeDifficulty(value) {
  const key = normalize(value)
  if (!key || ['intermediate', 'intermedia', 'media'].includes(key)) return 'intermediate'
  if (['basic', 'basica', 'básica', 'facil', 'fácil'].includes(key)) return 'basic'
  if (['advanced', 'avanzada', 'dificil', 'difícil'].includes(key)) return 'advanced'
  return null
}

function AdminQuestionImportPage() {
  const [subjects, setSubjects] = useState([])
  const [units, setUnits] = useState([])
  const [topics, setTopics] = useState([])
  const [legalSources, setLegalSources] = useState([])
  const [legalArticles, setLegalArticles] = useState([])
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [subjectRows, unitRows, topicRows, sourceRows, articleRows] = await Promise.all([
          listSubjects(),
          listUnits(),
          listTopics(),
          listLegalSourcesAdmin(),
          listLegalArticlesAdmin(),
        ])

        setSubjects(subjectRows)
        setUnits(unitRows)
        setTopics(topicRows)
        setLegalSources(sourceRows)
        setLegalArticles(articleRows)
      } catch (error) {
        setNotice({ type: 'error', text: error.message })
      }
    }

    void loadCatalogs()
  }, [])

  const subjectByCode = useMemo(() => {
    const map = new Map()
    for (const subject of subjects) {
      if (subject.code) map.set(normalize(subject.code), subject)
      map.set(normalize(subject.name), subject)
    }
    return map
  }, [subjects])

  const sourceByName = useMemo(() => {
    const map = new Map()
    for (const source of legalSources) {
      map.set(normalize(source.title), source)
      if (source.abbreviation) map.set(normalize(source.abbreviation), source)
    }
    return map
  }, [legalSources])

  const validation = useMemo(() => {
    return rows.map((rawRow, index) => {
      const errors = []
      const row = Object.fromEntries(
        Object.entries(rawRow).map(([key, value]) => [normalizeHeader(key), value]),
      )

      const missingColumns = requiredColumns.filter((column) => !(column in row))
      if (missingColumns.length) {
        errors.push(`Faltan columnas: ${missingColumns.join(', ')}`)
      }

      const subject = subjectByCode.get(normalize(row.materia_codigo))
      if (!subject) errors.push('Materia no encontrada por código o nombre.')

      const unitNumber = Number.parseInt(String(row.unidad), 10)
      const unit = subject
        ? units.find((item) => item.subject_id === subject.id && item.unit_number === unitNumber)
        : null
      if (!unit) errors.push('Unidad no encontrada dentro de la materia.')

      let topic = null
      if (unit && String(row.tema || '').trim()) {
        topic = topics.find(
          (item) => item.unit_id === unit.id && normalize(item.title) === normalize(row.tema),
        )
        if (!topic) errors.push('Tema no encontrado dentro de la unidad.')
      }

      const type = normalizeQuestionType(row.tipo)
      if (!type) errors.push('Tipo de pregunta no reconocido.')

      const difficulty = normalizeDifficulty(row.dificultad)
      if (!difficulty) errors.push('Dificultad no reconocida.')

      const correctKey = String(row.correcta || '').trim().toUpperCase()
      if (!['A', 'B', 'C', 'D'].includes(correctKey)) {
        errors.push('La columna correcta debe contener A, B, C o D.')
      }

      const questionText = String(row.pregunta || '').trim()
      if (!questionText) errors.push('La pregunta está vacía.')

      const optionTexts = {
        A: String(row.opcion_a || '').trim(),
        B: String(row.opcion_b || '').trim(),
        C: String(row.opcion_c || '').trim(),
        D: String(row.opcion_d || '').trim(),
      }

      const feedback = {
        A: String(row.feedback_a || '').trim(),
        B: String(row.feedback_b || '').trim(),
        C: String(row.feedback_c || '').trim(),
        D: String(row.feedback_d || '').trim(),
      }

      for (const key of ['A', 'B', 'C', 'D']) {
        if (!optionTexts[key]) errors.push(`La opción ${key} está vacía.`)
        if (!feedback[key]) errors.push(`Falta feedback para la opción ${key}.`)
      }

      const correctExplanation = String(row.explicacion_correcta || '').trim()
      if (!correctExplanation) errors.push('Falta la explicación general de la respuesta correcta.')

      let legalArticle = null
      const sourceText = String(row.norma || '').trim()
      const articleText = String(row.articulo || '').trim()

      if (sourceText || articleText) {
        if (!sourceText || !articleText) {
          errors.push('Para vincular normativa debes indicar norma y artículo.')
        } else {
          const source = sourceByName.get(normalize(sourceText))
          if (!source) {
            errors.push('Norma no encontrada.')
          } else {
            legalArticle = legalArticles.find(
              (article) => article.legal_source_id === source.id && normalize(article.article_number) === normalize(articleText),
            )
            if (!legalArticle) errors.push('Artículo no encontrado dentro de la norma.')
          }
        }
      }

      return {
        index,
        source: row,
        errors,
        valid: errors.length === 0,
        payload: errors.length === 0 ? {
          unit_id: unit.id,
          topic_id: topic?.id || null,
          legal_article_id: legalArticle?.id || null,
          question_text: questionText,
          question_type: type,
          difficulty,
          source_reference: String(row.fuente || '').trim() || null,
          correct_explanation: correctExplanation,
          is_verified: booleanValue(row.verificada, false),
          is_active: booleanValue(row.activa, true),
          options: ['A', 'B', 'C', 'D'].map((key) => ({
            key,
            text: optionTexts[key],
            feedback: feedback[key],
            is_correct: key === correctKey,
          })),
        } : null,
      }
    })
  }, [legalArticles, rows, sourceByName, subjectByCode, topics, units])

  const validRows = validation.filter((row) => row.valid)
  const invalidRows = validation.filter((row) => !row.valid)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setParsing(true)
    setNotice(null)
    setRows([])
    setFileName(file.name)

    try {
      const parsedRows = await parseSpreadsheetFile(file)
      setRows(parsedRows)

      if (!parsedRows.length) {
        setNotice({ type: 'error', text: 'El archivo no contiene filas de datos.' })
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setParsing(false)
      event.target.value = ''
    }
  }

  async function handleImport() {
    if (!validRows.length || invalidRows.length) return

    if (!window.confirm(`¿Importar ${validRows.length} pregunta(s) al banco?`)) return

    setImporting(true)
    setNotice(null)
    setProgress({ current: 0, total: validRows.length })

    try {
      for (let index = 0; index < validRows.length; index += 1) {
        await saveQuestion(validRows[index].payload)
        setProgress({ current: index + 1, total: validRows.length })
      }

      setNotice({ type: 'success', text: `${validRows.length} pregunta(s) importadas correctamente.` })
      setRows([])
      setFileName('')
    } catch (error) {
      setNotice({
        type: 'error',
        text: `La importación se detuvo en la pregunta ${progress.current + 1}: ${error.message}`,
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <AdminShell
      title="Importación masiva de preguntas"
      description="Carga bancos en CSV o Excel. Cada fila se valida contra materias, unidades, temas y normativa existentes antes de guardarse."
      actions={(
        <Link className="button-secondary" to="/admin/preguntas">
          ← Banco de preguntas
        </Link>
      )}
    >
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <section className="admin-card import-instructions">
        <div className="admin-card-heading">
          <div>
            <h2>1. Descarga la plantilla</h2>
            <p>La plantilla CSV puede abrirse y editarse directamente en Excel. Después también puedes guardarla como XLSX.</p>
          </div>

          <a className="button-secondary" href={`${import.meta.env.BASE_URL}templates/preguntas_importacion.csv`} download>
            <Download size={17} /> Descargar plantilla CSV
          </a>
        </div>

        <div className="import-rules-grid">
          <article>
            <strong>Materia</strong>
            <span>Usa DIP, DPC1, LAB2, PEN1 o CIV3.</span>
          </article>
          <article>
            <strong>Unidad</strong>
            <span>Indica 1, 2, 3 o 4.</span>
          </article>
          <article>
            <strong>Correcta</strong>
            <span>Debe ser A, B, C o D.</span>
          </article>
          <article>
            <strong>Feedback</strong>
            <span>Las cuatro opciones necesitan explicación.</span>
          </article>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>2. Selecciona el archivo</h2>
            <p>Formatos admitidos: .csv, .xlsx y .xls. El procesamiento ocurre en tu navegador.</p>
          </div>
        </div>

        <label className="import-dropzone">
          {parsing ? <LoaderCircle className="spin" size={36} /> : <FileSpreadsheet size={42} />}
          <strong>{parsing ? 'Procesando archivo...' : 'Seleccionar banco de preguntas'}</strong>
          <span>{fileName || 'CSV, XLSX o XLS'}</span>
          <input accept=".csv,.xlsx,.xls" disabled={parsing || importing} onChange={handleFile} type="file" />
        </label>
      </section>

      {rows.length > 0 && (
        <section className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>3. Validación</h2>
              <p>{rows.length} fila(s) detectadas antes de escribir en Supabase.</p>
            </div>
          </div>

          <div className="admin-stats-grid question-import-stats">
            <article className="admin-stat-card"><strong>{rows.length}</strong><span>Total</span></article>
            <article className="admin-stat-card"><strong>{validRows.length}</strong><span>Válidas</span></article>
            <article className="admin-stat-card"><strong>{invalidRows.length}</strong><span>Con errores</span></article>
          </div>

          {invalidRows.length > 0 && (
            <div className="import-error-list">
              <div className="import-error-heading">
                <AlertTriangle size={20} /> Corrige estas filas antes de importar
              </div>

              {invalidRows.slice(0, 30).map((row) => (
                <article key={row.index}>
                  <strong>Fila {row.index + 2}</strong>
                  <span>{String(row.source.pregunta || '(sin pregunta)').slice(0, 100)}</span>
                  <ul>
                    {row.errors.map((error) => <li key={error}>{error}</li>)}
                  </ul>
                </article>
              ))}

              {invalidRows.length > 30 && <p>Se muestran los primeros 30 errores.</p>}
            </div>
          )}

          {invalidRows.length === 0 && (
            <div className="import-ready-banner">
              <CheckCircle2 size={24} />
              <div>
                <strong>Archivo listo para importar</strong>
                <span>Las {validRows.length} filas cumplen las reglas estructurales.</span>
              </div>
            </div>
          )}

          <div className="import-preview-table-wrap">
            <table className="admin-table import-preview-table">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Materia</th>
                  <th>Unidad</th>
                  <th>Pregunta</th>
                  <th>Correcta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {validation.slice(0, 20).map((row) => (
                  <tr key={row.index}>
                    <td>{row.index + 2}</td>
                    <td>{row.source.materia_codigo || '—'}</td>
                    <td>{row.source.unidad || '—'}</td>
                    <td>{String(row.source.pregunta || '—').slice(0, 120)}</td>
                    <td>{row.source.correcta || '—'}</td>
                    <td>{row.valid ? 'Lista' : 'Corregir'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="primary-button"
            disabled={importing || invalidRows.length > 0 || validRows.length === 0}
            onClick={handleImport}
            type="button"
          >
            <Upload size={18} />
            {importing
              ? `Importando ${progress.current}/${progress.total}...`
              : `Importar ${validRows.length} pregunta(s)`}
          </button>
        </section>
      )}
    </AdminShell>
  )
}

export default AdminQuestionImportPage
