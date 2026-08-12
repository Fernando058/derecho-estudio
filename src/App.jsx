import { useState } from 'react'
import {
  Link,
  Route,
  Routes,
} from 'react-router-dom'
import {
  BookOpen,
  FileText,
  GraduationCap,
} from 'lucide-react'
import PdfViewer from './components/pdf/PdfViewer'

function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <GraduationCap size={58} />

        <p className="eyebrow">
          Plataforma académica
        </p>

        <h1>Derecho Estudio</h1>

        <p className="hero-description">
          Plataforma de apoyo académico para el estudio estructurado
          de la carrera de Derecho.
        </p>

        <div className="hero-actions">
          <Link to="/visor" className="primary-button">
            <FileText size={18} />
            Probar visor PDF
          </Link>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <BookOpen size={32} />
          <h2>Materias</h2>
          <p>
            Organización por semestre, materia, unidad,
            tema y subtema.
          </p>
        </article>

        <article className="feature-card">
          <FileText size={32} />
          <h2>Compendios</h2>
          <p>
            Documentos externos mediante enlaces
            administrables.
          </p>
        </article>

        <article className="feature-card">
          <GraduationCap size={32} />
          <h2>Evaluación</h2>
          <p>
            Simuladores, retroalimentación y seguimiento
            del aprendizaje.
          </p>
        </article>
      </section>
    </main>
  )
}

function PdfTestPage() {
  const [inputUrl, setInputUrl] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    setDocumentUrl(inputUrl.trim())
  }

  return (
    <main className="page">
      <section className="viewer-test-header">
        <Link to="/" className="back-link">
          ← Inicio
        </Link>

        <h1>Prueba del visor PDF</h1>

        <p>
          Pega un enlace público de Google Drive para verificar
          el funcionamiento del visor.
        </p>

        <form
          className="pdf-test-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="pdf-url">
            Enlace de Google Drive
          </label>

          <div className="pdf-test-input-row">
            <input
              id="pdf-url"
              type="url"
              value={inputUrl}
              onChange={(event) =>
                setInputUrl(event.target.value)
              }
              placeholder="Pega aquí el enlace del PDF..."
              required
            />

            <button
              type="submit"
              className="primary-button"
            >
              Visualizar
            </button>
          </div>
        </form>
      </section>

      {documentUrl && (
        <PdfViewer
          url={documentUrl}
          title="Documento de prueba"
          description="Vista previa del documento almacenado en Google Drive."
        />
      )}
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/visor" element={<PdfTestPage />} />
    </Routes>
  )
}

export default App