import {
  lazy,
  Suspense,
  useState,
} from 'react'

import {
  Link,
  Route,
  Routes,
} from 'react-router-dom'

import {
  BookOpen,
  Database,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  Scale,
  UserPlus,
} from 'lucide-react'

import PdfViewer from './components/pdf/PdfViewer'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import MainNavbar from './components/navigation/MainNavbar'
import { useAuth } from './hooks/useAuth'

const SupabaseTestPage = lazy(() => import('./pages/SupabaseTestPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const InactiveAccountPage = lazy(() => import('./pages/InactiveAccountPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))
const DocumentViewerPage = lazy(() => import('./pages/DocumentViewerPage'))
const SubjectPage = lazy(() => import('./pages/SubjectPage'))
const UnitStudyPage = lazy(() => import('./pages/UnitStudyPage'))
const QuizAttemptPage = lazy(() => import('./pages/QuizAttemptPage'))
const QuizResultPage = lazy(() => import('./pages/QuizResultPage'))
const AttemptsPage = lazy(() => import('./pages/AttemptsPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const ErrorPracticePage = lazy(() => import('./pages/ErrorPracticePage'))

const AdminSemestersPage = lazy(() => import('./pages/admin/AdminSemestersPage'))
const AdminSubjectsPage = lazy(() => import('./pages/admin/AdminSubjectsPage'))
const AdminUnitsPage = lazy(() => import('./pages/admin/AdminUnitsPage'))
const AdminTopicsPage = lazy(() => import('./pages/admin/AdminTopicsPage'))
const AdminDocumentsPage = lazy(() => import('./pages/admin/AdminDocumentsPage'))
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentPage'))
const AdminLegalPage = lazy(() => import('./pages/admin/AdminLegalPage'))
const AdminReadingsPage = lazy(() => import('./pages/admin/AdminReadingsPage'))
const AdminQuestionsPage = lazy(() => import('./pages/admin/AdminQuestionsPage'))
const AdminQuestionImportPage = lazy(() => import('./pages/admin/AdminQuestionImportPage'))
const AdminQuizConfigsPage = lazy(() => import('./pages/admin/AdminQuizConfigsPage'))
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminReadinessPage = lazy(() => import('./pages/admin/AdminReadinessPage'))

function RouteLoader() {
  return (
    <main className="page">
      <section className="loading-state">
        <LoaderCircle className="spin" size={36} />
        <h2>Cargando módulo...</h2>
      </section>
    </main>
  )
}

function HomePage() {
  const {
    session,
    profile,
    loading,
  } = useAuth()

  return (
    <main className="page">
      <section className="hero hero-legal">
        <div className="hero-legal-copy">
          <p className="eyebrow">
            Plataforma Académica Jurídica
          </p>

          <h1>
            LEX ACADEMIA
          </h1>

          <p className="hero-description">
            Estudio, práctica y evaluación para la formación en Derecho.
          </p>

          <div className="hero-actions">
            {!loading && !session && (
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

            {!loading && session && (
              <Link
                to="/dashboard"
                className="primary-button"
              >
                <LayoutDashboard size={18} />
                Ir a mi dashboard
              </Link>
            )}

            <Link
              to="/acerca"
              className="button-secondary"
            >
              <Scale size={18} />
              Acerca de
            </Link>
          </div>

          {session && profile && (
            <p style={{ marginTop: '20px' }}>
              Sesión activa: <strong>{profile.full_name}</strong>
            </p>
          )}
        </div>

        <div className="hero-legal-mark">
          <Scale size={92} />
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <BookOpen size={32} />
          <h2>Materias y unidades</h2>
          <p>
            Organización por semestre, materia, unidad, tema y subtema con enfoque de estudio.
          </p>
        </article>

        <article className="feature-card">
          <FileText size={32} />
          <h2>Compendios y visor</h2>
          <p>
            Documentos externos administrables mediante enlaces de Google Drive y visor PDF.
          </p>

          <div style={{ marginTop: '20px' }}>
            <Link to="/visor" className="button-secondary">
              <FileText size={18} />
              Probar visor PDF
            </Link>
          </div>
        </article>

        <article className="feature-card">
          <GraduationCap size={32} />
          <h2>Simuladores</h2>
          <p>
            Modo práctica y modo examen, repetibles sin límite y con revisión detallada.
          </p>
        </article>

        <article className="feature-card">
          <Scale size={32} />
          <h2>Acerca del proyecto</h2>
          <p>
            Consulta propósito, colaboradores y responsables del desarrollo y soporte documental.
          </p>

          <div style={{ marginTop: '20px' }}>
            <Link to="/acerca" className="button-secondary">
              <Scale size={18} />
              Ver colaboradores
            </Link>
          </div>
        </article>
      </section>

      <section className="feature-card" style={{ marginTop: '28px' }}>
        <Database size={30} />
        <h2>Estado técnico</h2>
        <p style={{ marginBottom: '12px' }}>
          Verifica conectividad, catálogo académico y disponibilidad de la base.
        </p>
        <Link to="/conexion" className="text-link">
          Probar conexión Supabase
        </Link>
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
        <p>Pega un enlace público de Google Drive.</p>

        <form className="pdf-test-form" onSubmit={handleSubmit}>
          <label htmlFor="pdf-url">Enlace de Google Drive</label>

          <div className="pdf-test-input-row">
            <input
              id="pdf-url"
              type="url"
              value={inputUrl}
              onChange={(event) => setInputUrl(event.target.value)}
              placeholder="Pega aquí el enlace del PDF..."
              required
            />

            <button type="submit" className="primary-button">
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
    <>
      <MainNavbar />

      <Suspense fallback={<RouteLoader />}>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/acerca" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
        <Route path="/actualizar-contrasena" element={<UpdatePasswordPage />} />
        <Route path="/cuenta-inactiva" element={<InactiveAccountPage />} />
        <Route path="/visor" element={<PdfTestPage />} />
        <Route path="/conexion" element={<SupabaseTestPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/materias/:subjectSlug"
          element={
            <ProtectedRoute>
              <SubjectPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/materias/:subjectSlug/unidades/:unitNumber"
          element={
            <ProtectedRoute>
              <UnitStudyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/simuladores/intentos/:attemptId"
          element={
            <ProtectedRoute>
              <QuizAttemptPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/simuladores/intentos/:attemptId/resultados"
          element={
            <ProtectedRoute>
              <QuizResultPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/intentos"
          element={
            <ProtectedRoute>
              <AttemptsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/progreso"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/practicar-errores"
          element={
            <ProtectedRoute>
              <ErrorPracticePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documentos"
          element={
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documentos/:documentId"
          element={
            <ProtectedRoute>
              <DocumentViewerPage />
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
          path="/admin/semestres"
          element={
            <AdminRoute>
              <AdminSemestersPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/materias"
          element={
            <AdminRoute>
              <AdminSubjectsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/unidades"
          element={
            <AdminRoute>
              <AdminUnitsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/temas"
          element={
            <AdminRoute>
              <AdminTopicsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/documentos"
          element={
            <AdminRoute>
              <AdminDocumentsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/contenido"
          element={
            <AdminRoute>
              <AdminContentPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/normativa"
          element={
            <AdminRoute>
              <AdminLegalPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/lecturas"
          element={
            <AdminRoute>
              <AdminReadingsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/preguntas"
          element={
            <AdminRoute>
              <AdminQuestionsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/simuladores"
          element={
            <AdminRoute>
              <AdminQuizConfigsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/analitica"
          element={
            <AdminRoute>
              <AdminAnalyticsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/usuarios"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/validacion"
          element={
            <AdminRoute>
              <AdminReadinessPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/preguntas/importar"
          element={
            <AdminRoute>
              <AdminQuestionImportPage />
            </AdminRoute>
          }
        />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
