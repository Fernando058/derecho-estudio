import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileWarning } from 'lucide-react'
import PdfViewer from '../components/pdf/PdfViewer'
import { getPublishedDocument } from '../services/documentService'

function DocumentViewerPage() {
  const { documentId } = useParams()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDocument() {
      setLoading(true)
      setError('')

      try {
        const row = await getPublishedDocument(documentId)

        if (!row) {
          setError('El documento no existe o no está publicado.')
          return
        }

        setDocument(row)
      } catch (loadError) {
        console.error(loadError)
        setError(loadError?.message || 'No fue posible abrir el documento.')
      } finally {
        setLoading(false)
      }
    }

    void loadDocument()
  }, [documentId])

  return (
    <main className="page document-viewer-page">
      <div className="document-viewer-actions">
        <Link className="back-link" to="/documentos">← Volver a documentos</Link>
      </div>

      {loading && (
        <section className="loading-state"><p>Cargando documento...</p></section>
      )}

      {!loading && error && (
        <section className="documents-empty">
          <FileWarning size={42} />
          <h2>No se pudo abrir</h2>
          <p>{error}</p>
        </section>
      )}

      {!loading && !error && document && (
        <PdfViewer
          description={document.description || ''}
          endPage={document.end_page}
          startPage={document.start_page}
          title={document.title}
          url={document.source_url}
        />
      )}
    </main>
  )
}

export default DocumentViewerPage
