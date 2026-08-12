import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Database,
  LoaderCircle,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function SupabaseTestPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [semesters, setSemesters] = useState([])
  const [subjects, setSubjects] = useState([])

  useEffect(() => {
    async function testConnection() {
      setLoading(true)
      setError('')

      try {
        const {
          data: semesterData,
          error: semesterError,
        } = await supabase
          .from('semesters')
          .select(
            `
              id,
              name,
              slug,
              level_number,
              is_published
            `,
          )
          .order('level_number', {
            ascending: true,
          })

        if (semesterError) {
          throw semesterError
        }

        const {
          data: subjectData,
          error: subjectError,
        } = await supabase
          .from('subjects')
          .select(
            `
              id,
              semester_id,
              name,
              slug,
              code,
              credits,
              is_published
            `,
          )
          .order('sort_order', {
            ascending: true,
          })

        if (subjectError) {
          throw subjectError
        }

        setSemesters(semesterData ?? [])
        setSubjects(subjectData ?? [])
      } catch (connectionError) {
        console.error(connectionError)

        setError(
          connectionError?.message ||
            'No fue posible conectar con Supabase.',
        )
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  return (
    <main className="page">
      <section className="viewer-test-header">
        <Link to="/" className="back-link">
          ← Inicio
        </Link>

        <Database size={42} />

        <h1>Prueba de conexión con Supabase</h1>

        <p>
          Esta pantalla comprueba la conexión entre
          React, Supabase y las políticas RLS.
        </p>
      </section>

      {loading && (
        <article className="feature-card">
          <LoaderCircle size={32} />

          <h2>Conectando...</h2>

          <p>
            Consultando la estructura académica.
          </p>
        </article>
      )}

      {!loading && error && (
        <article className="feature-card">
          <XCircle size={32} />

          <h2>Error de conexión</h2>

          <p>{error}</p>
        </article>
      )}

      {!loading && !error && (
        <>
          <article className="feature-card">
            <CheckCircle2 size={32} />

            <h2>Conexión correcta</h2>

            <p>
              React puede consultar Supabase
              correctamente mediante las políticas RLS.
            </p>
          </article>

          <section className="feature-grid">
            <article className="feature-card">
              <Database size={30} />

              <h2>Semestres</h2>

              <p>
                Registros encontrados:
                {' '}
                <strong>{semesters.length}</strong>
              </p>
            </article>

            <article className="feature-card">
              <Database size={30} />

              <h2>Materias</h2>

              <p>
                Registros encontrados:
                {' '}
                <strong>{subjects.length}</strong>
              </p>
            </article>

            <article className="feature-card">
              <CheckCircle2 size={30} />

              <h2>Estado</h2>

              <p>
                Base académica disponible.
              </p>
            </article>
          </section>

          <section
            className="feature-card"
            style={{ marginTop: '28px' }}
          >
            <h2>Semestres encontrados</h2>

            {semesters.map((semester) => (
              <p key={semester.id}>
                <strong>{semester.name}</strong>
                {' — '}
                Nivel {semester.level_number}
              </p>
            ))}
          </section>

          <section
            className="feature-card"
            style={{ marginTop: '28px' }}
          >
            <h2>Materias encontradas</h2>

            {subjects.map((subject) => (
              <p key={subject.id}>
                <strong>{subject.name}</strong>

                {' — '}

                {subject.code}

                {' — '}

                {subject.credits ?? 'N/D'} créditos
              </p>
            ))}
          </section>
        </>
      )}
    </main>
  )
}

export default SupabaseTestPage