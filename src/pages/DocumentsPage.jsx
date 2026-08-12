import { useEffect, useMemo, useState } from 'react'
import { BookOpen, FileText, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { listPublishedDocuments } from '../services/documentService'

const typeLabels = {
  compendium: 'Compendio',
  law: 'Normativa',
  reading: 'Lectura',
  guide: 'Guía',
  jurisprudence: 'Jurisprudencia',
  other: 'Otro',
}

function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [subjects, setSubjects] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState('all')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const [documentRows, subjectResult, unitResult] = await Promise.all([
          listPublishedDocuments(),
          supabase.from('subjects').select('id,name,code').eq('is_published', true).order('sort_order'),
          supabase.from('units').select('id,subject_id,unit_number,title').eq('is_published', true).order('unit_number'),
        ])

        if (subjectResult.error) throw subjectResult.error
        if (unitResult.error) throw unitResult.error

        setDocuments(documentRows)
        setSubjects(subjectResult.data ?? [])
        setUnits(unitResult.data ?? [])
      } catch (loadError) {
        console.error(loadError)
        setError(loadError?.message || 'No fue posible cargar la biblioteca.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const subjectById = useMemo(
    () => new Map(subjects.map((item) => [item.id, item])),
    [subjects],
  )

  const availableUnits = useMemo(() => {
    if (subjectFilter === 'all') return units
    return units.filter((unit) => unit.subject_id === subjectFilter)
  }, [subjectFilter, units])

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return documents.filter((item) => {
      if (subjectFilter !== 'all' && item.subject_id !== subjectFilter) return false
      if (unitFilter !== 'all' && item.unit_id !== unitFilter) return false

      if (!normalized) return true

      return [item.title, item.description, typeLabels[item.document_type]]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    })
  }, [documents, query, subjectFilter, unitFilter])

  return (
    <main className="page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Biblioteca jurídica</p>
          <h1>Documentos y compendios</h1>
          <p>Consulta los recursos publicados y abre los PDF directamente dentro de la plataforma.</p>
        </div>
        <Link className="button-secondary" to="/dashboard">← Dashboard</Link>
      </section>

      <section className="documents-toolbar">
        <label className="documents-search">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, descripción o tipo..."
            value={query}
          />
        </label>

        <select
          onChange={(event) => {
            setSubjectFilter(event.target.value)
            setUnitFilter('all')
          }}
          value={subjectFilter}
        >
          <option value="all">Todas las materias</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>

        <select onChange={(event) => setUnitFilter(event.target.value)} value={unitFilter}>
          <option value="all">Todas las unidades</option>
          {availableUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {subjectById.get(unit.subject_id)?.code || 'Materia'} · U{unit.unit_number}
            </option>
          ))}
        </select>
      </section>

      {loading && (
        <section className="loading-state">
          <p>Cargando documentos...</p>
        </section>
      )}

      {!loading && error && (
        <section className="auth-message auth-error">{error}</section>
      )}

      {!loading && !error && filteredDocuments.length === 0 && (
        <section className="documents-empty">
          <FileText size={42} />
          <h2>No hay documentos disponibles</h2>
          <p>Cuando el administrador publique compendios o lecturas aparecerán aquí.</p>
        </section>
      )}

      {!loading && !error && filteredDocuments.length > 0 && (
        <section className="documents-grid">
          {filteredDocuments.map((item) => {
            const subject = subjectById.get(item.subject_id)
            const unit = units.find((row) => row.id === item.unit_id)

            return (
              <article className="document-card" key={item.id}>
                <div className="document-card-icon"><BookOpen size={24} /></div>
                <span className="document-type-badge">{typeLabels[item.document_type] || 'Documento'}</span>
                <h2>{item.title}</h2>
                <p>{item.description || 'Recurso académico disponible para consulta.'}</p>

                <div className="document-card-meta">
                  <span>{subject?.name || 'Recurso general'}</span>
                  {unit && <span>Unidad {unit.unit_number}</span>}
                  {item.start_page && (
                    <span>Págs. {item.start_page}{item.end_page ? `–${item.end_page}` : ''}</span>
                  )}
                </div>

                <Link className="primary-button" to={`/documentos/${item.id}`}>
                  <FileText size={17} /> Abrir documento
                </Link>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default DocumentsPage
