import {
  useState,
} from 'react'

import {
  Link,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import {
  BookOpen,
  Database,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  UserPlus,
} from 'lucide-react'

import PdfViewer from './components/pdf/PdfViewer'

import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'

import SupabaseTestPage from './pages/SupabaseTestPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'

import {
  useAuth,
} from './context/AuthContext'

function HomePage() {
  const {
    session,
    profile,
    loading,
  } = useAuth()

  return (
    <main className="page">
      <section className="hero">
        <GraduationCap size={58} />

        <p className="eyebrow">
          Plataforma académica
        </p>

        <h1>
          Derecho Estudio
        </h1>

        <p className="hero-description">
          Plataforma de apoyo académico
          para el estudio estructurado
          de la carrera de Derecho.
        </p>

        <div className="hero-actions">
          {!loading &&
            !session && (
              <>
                <Link
                  to="/login"
                  className="primary-button"
                >
                  <LogIn size={18} />
                  Iniciar sesión
                </Link>

                <Link
                  to="/registro"
                  className="button-secondary"
                >
                  <UserPlus size={18} />
                  Registrarme
                </Link>
              </>
            )}

          {!loading &&
            session && (
              <Link
                to="/dashboard"
                className="primary-button"
              >
                <LayoutDashboard size={18} />

                Ir a mi dashboard
              </Link>
            )}
        </div>

        {session &&
          profile && (
            <p
              style={{
                marginTop: '20px',
              }}
            >
              Sesión activa:
              {' '}
              <strong>
                {profile.full_name}
              </strong>
            </p>
          )}
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <BookOpen size={32} />

          <h2>Materias</h2>

          <p>
            Organización por semestre,
            materia, unidad, tema
            y subtema.
          </p>
        </article>

        <article className="feature-card">
          <FileText size={32} />

          <h2>Compendios</h2>

          <p>
            Documentos externos mediante
            enlaces administrables
            de Google Drive.
          </p>

          <div
            style={{
              marginTop: '20px',
            }}
          >
            <Link
              to="/visor"
              className="button-secondary"
            >
              <FileText size={18} />
              Probar visor PDF
            </Link>
          </div>
        </article>

        <article className="feature-card">
          <GraduationCap size={32} />

          <h2>Evaluación</h2>

          <p>
            Simuladores,
            retroalimentación
            y seguimiento individual.
          </p>
        </article>
      </section>

      <section
        className="feature-card"
        style={{
          marginTop: '28px',
        }}
      >
        <Database size={30} />

        <h2>
          Estado técnico
        </h2>

        <Link
          to="/conexion"
          className="text-link"
        >
          Probar conexión Supabase
        </Link>
      </section>
    </main>
  )
}

function PdfTestPage() {
  const [inputUrl, setInputUrl] =
    useState('')

  const [
    documentUrl,
    setDocumentUrl,
  ] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    setDocumentUrl(
      inputUrl.trim(),
    )
  }

  return (
    <main className="page">
      <section className="viewer-test-header">
        <Link
          to="/"
          className="back-link"
        >
          ← Inicio
        </Link>

        <h1>
          Prueba del visor PDF
        </h1>

        <p>
          Pega un enlace público
          de Google Drive.
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
                setInputUrl(
                  event.target.value,
                )
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
      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/registro"
        element={<RegisterPage />}
      />

      <Route
        path="/visor"
        element={<PdfTestPage />}
      />

      <Route
        path="/conexion"
        element={<SupabaseTestPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}

export default App