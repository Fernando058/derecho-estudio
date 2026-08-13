import {
  Code2,
  FileBadge2,
  Mail,
  Phone,
  Scale,
  Users2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const assetBase = import.meta.env.BASE_URL

const collaborators = [
  {
    name: 'Ing Jose Xavier Santos Cedeño',
    role: 'Desarrollo documental',
    email: 'Jsantos8133@utm.edu.ec',
    phone: '0996289297',
    icon: FileBadge2,
    photo: `${assetBase}collaborators/jose-xavier-santos.png`,
    photoAlt: 'Fotografía de Jose Xavier Santos Cedeño',
  },
  {
    name: 'Ing. Francisco Fernando Cárdenas Baque, Msc',
    role: 'Desarrollo y programación',
    email: 'fcardenas5739@utm.edu.ec',
    phone: '0996796229',
    icon: Code2,
    photo: `${assetBase}collaborators/francisco-fernando-cardenas.jpg`,
    photoAlt: 'Fotografía de Francisco Fernando Cárdenas Baque',
  },
]

function AboutPage() {
  return (
    <main className="page about-page">
      <div className="study-breadcrumbs">
        <Link to="/">Inicio</Link>
        <span>›</span>
        <strong>Acerca de</strong>
      </div>

      <section className="about-hero">
        <div>
          <p className="eyebrow">Acerca de la plataforma</p>
          <h1>Derecho Estudio</h1>
          <p>
            Espacio académico de apoyo para la carrera de Derecho, diseñado para estudiar por
            semestres, materias, unidades, normativa, lecturas, compendios y simuladores con
            retroalimentación para mejorar continuamente.
          </p>

          <div className="about-chip-list">
            <span className="legal-brand-chip">
              <Scale size={16} />
              Derecho · estudio · práctica
            </span>

            <span className="legal-brand-chip">
              <Users2 size={16} />
              Proyecto colaborativo
            </span>
          </div>
        </div>

        <div className="about-hero-mark">
          <Scale size={74} />
        </div>
      </section>

      <section className="feature-card">
        <p className="eyebrow">Propósito</p>
        <h2>¿Qué busca esta plataforma?</h2>
        <p>
          Facilitar el aprendizaje estructurado del estudiante mediante contenido jurídico
          organizado, acceso a compendios y evaluaciones formativas que permitan detectar
          fortalezas, errores recurrentes y temas que requieren refuerzo.
        </p>
      </section>

      <section className="about-grid">
        {collaborators.map((person) => {
          const Icon = person.icon

          return (
            <article className="about-card" key={person.email}>
              <div className="about-card-photo-wrap">
                <img className="about-card-photo" src={person.photo} alt={person.photoAlt} />
              </div>

              <div className="about-card-icon">
                <Icon size={24} />
              </div>

              <p className="eyebrow">Colaborador</p>
              <h2>{person.name}</h2>
              <p className="about-role">{person.role}</p>

              <div className="about-contact-list">
                <div>
                  <Mail size={16} />
                  <a href={`mailto:${person.email}`}>{person.email}</a>
                </div>

                <div>
                  <Phone size={16} />
                  <a href={`tel:${person.phone}`}>{person.phone}</a>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="feature-card" style={{ marginTop: '28px' }}>
        <p className="eyebrow">Observación funcional</p>
        <h2>Simuladores y mejora continua</h2>
        <p>
          Los simuladores están diseñados para poder repetirse cuantas veces sea necesario.
          En modo práctica, la plataforma muestra retroalimentación inmediata; en modo examen,
          la revisión completa aparece al finalizar, con errores, explicación y base jurídica
          relacionada cuando está disponible.
        </p>
      </section>

      <div style={{ marginTop: '24px' }}>
        <Link to="/" className="back-link">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  )
}

export default AboutPage
