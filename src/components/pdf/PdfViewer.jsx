import { ExternalLink, FileText } from 'lucide-react'
import { getPdfEmbedUrl } from '../../utils/googleDrive'

function PdfViewer({
  url,
  title = 'Documento PDF',
  description = '',
  startPage = null,
  endPage = null,
}) {
  if (!url) {
    return (
      <section className="pdf-empty">
        <FileText size={42} />

        <div>
          <h3>Documento no disponible</h3>
          <p>Todavía no se ha registrado un enlace para este documento.</p>
        </div>
      </section>
    )
  }

  const embedUrl = getPdfEmbedUrl(url)
  const pageLabel = startPage
    ? `Lectura recomendada: páginas ${startPage}${endPage ? `–${endPage}` : ''}`
    : ''

  return (
    <section className="pdf-viewer">
      <header className="pdf-viewer-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
          {pageLabel && <small className="pdf-page-range">{pageLabel}</small>}
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="pdf-external-button"
        >
          <ExternalLink size={18} />
          Abrir original
        </a>
      </header>

      <div className="pdf-frame-container">
        <iframe
          src={embedUrl}
          title={title}
          className="pdf-frame"
          allow="autoplay"
        />
      </div>
    </section>
  )
}

export default PdfViewer
