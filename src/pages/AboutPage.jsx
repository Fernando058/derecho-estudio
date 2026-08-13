import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Code2,
  FileBadge2,
  Mail,
  Phone,
  RotateCcw,
  Scale,
  Target,
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

const utilityCards = [
  {
    title: 'Organización académica',
    text: 'Reúne en un mismo entorno materias, unidades, temas, compendios, normativa, lecturas y evaluaciones, evitando que el estudiante dependa de información dispersa entre múltiples archivos o plataformas.',
    icon: BookOpenCheck,
  },
  {
    title: 'Estudio orientado',
    text: 'Permite avanzar por una estructura progresiva: revisar el contenido, identificar conceptos centrales, consultar la base jurídica relacionada y luego comprobar cuánto se comprendió mediante actividades de evaluación.',
    icon: Target,
  },
  {
    title: 'Seguimiento del aprendizaje',
    text: 'Registra intentos, aciertos, errores, desempeño por tema y evolución del estudiante, convirtiendo cada evaluación en información útil para decidir qué contenidos necesitan mayor atención.',
    icon: BarChart3,
  },
  {
    title: 'Refuerzo permanente',
    text: 'El estudiante puede repetir las prácticas tantas veces como sea necesario y volver sobre los temas que presentan mayor dificultad, favoreciendo un aprendizaje progresivo y no limitado a una sola evaluación.',
    icon: RotateCcw,
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
          <p className="eyebrow">Plataforma Académica Jurídica</p>
          <h1>LEX ACADEMIA</h1>
          <p>
            Estudio, práctica y evaluación para la formación en Derecho.
            La plataforma integra contenidos académicos, materiales de consulta,
            seguimiento del progreso y simuladores de evaluación dentro de un
            entorno único orientado al aprendizaje jurídico.
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

      <section className="feature-card about-purpose-card">
        <p className="eyebrow">Utilidad del producto</p>
        <h2>Una herramienta para convertir contenido jurídico en una experiencia de aprendizaje</h2>

        <div className="about-long-copy">
          <p>
            Lex Academia nace como una respuesta a una necesidad frecuente en la formación
            universitaria en Derecho: el estudiante dispone de compendios, códigos, leyes,
            lecturas y material de clase, pero ese contenido suele encontrarse fragmentado y
            no siempre ofrece un mecanismo inmediato para saber qué se ha comprendido, qué se
            ha olvidado y qué necesita ser revisado nuevamente.
          </p>

          <p>
            La plataforma organiza ese material por semestre, materia, unidad, tema y subtema,
            permitiendo que el proceso de estudio tenga una secuencia clara. El estudiante
            puede revisar el contenido de una unidad, relacionarlo con su base normativa,
            consultar documentos de apoyo y pasar luego a una etapa de comprobación mediante
            preguntas diseñadas a partir del mismo contenido académico disponible.
          </p>

          <p>
            Su utilidad no se limita a almacenar información. Lex Academia busca transformar
            el estudio pasivo en un proceso activo: leer, practicar, equivocarse, revisar,
            volver a intentar y observar la evolución del rendimiento. De esta forma, el
            sistema funciona como un complemento permanente del estudio autónomo y como una
            herramienta de preparación antes de evaluaciones, controles de lectura, exámenes
            parciales o finales.
          </p>
        </div>
      </section>

      <section className="about-utility-grid">
        {utilityCards.map((item) => {
          const Icon = item.icon

          return (
            <article className="about-utility-card" key={item.title}>
              <div className="about-card-icon">
                <Icon size={23} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          )
        })}
      </section>

      <section className="feature-card about-simulator-section">
        <div className="study-section-heading">
          <BrainCircuit size={28} />
          <div>
            <p className="eyebrow">Necesidad de los simuladores</p>
            <h2>Evaluar para identificar lo que realmente se domina</h2>
          </div>
        </div>

        <div className="about-long-copy">
          <p>
            En el estudio del Derecho no basta con reconocer que un contenido “suena conocido”.
            Es necesario recuperar conceptos, diferenciar instituciones jurídicas, identificar
            relaciones entre normas y seleccionar respuestas correctas frente a alternativas
            plausibles. Los simuladores permiten ejercitar precisamente esa recuperación activa
            de información.
          </p>

          <p>
            Los test de 30 preguntas por unidad cumplen una función formativa: permiten comprobar
            el dominio de un bloque específico inmediatamente después de estudiarlo. Al mostrar
            los errores y la retroalimentación correspondiente, cada intento se convierte en una
            oportunidad de aprendizaje y no únicamente en una calificación.
          </p>

          <p>
            El simulador final de 100 preguntas tiene una finalidad distinta y complementaria:
            integrar las cuatro unidades de una materia y exigir al estudiante recuperar contenidos
            distribuidos a lo largo de todo el curso. Esto ayuda a detectar si existe una comprensión
            equilibrada de la asignatura o si determinados temas permanecen débiles.
          </p>

          <p>
            La posibilidad de repetir los simuladores cuantas veces sea necesario permite comparar
            resultados entre intentos, reforzar preguntas falladas y comprobar si el estudiante está
            corrigiendo errores previos. Por ello, la plataforma no concibe el error como el final de
            una evaluación, sino como el punto de partida para orientar el siguiente ciclo de estudio.
          </p>
        </div>

        <div className="about-simulator-flow">
          <div>
            <span>1</span>
            <strong>Estudiar</strong>
            <p>Revisar unidad, temas, normativa y material disponible.</p>
          </div>
          <div>
            <span>2</span>
            <strong>Practicar</strong>
            <p>Responder preguntas de la unidad o de toda la materia.</p>
          </div>
          <div>
            <span>3</span>
            <strong>Detectar errores</strong>
            <p>Identificar respuestas incorrectas y temas con menor precisión.</p>
          </div>
          <div>
            <span>4</span>
            <strong>Reforzar</strong>
            <p>Volver al contenido y repetir la evaluación para medir la mejora.</p>
          </div>
        </div>
      </section>

      <section className="feature-card">
        <p className="eyebrow">Enfoque</p>
        <h2>Complemento del proceso formativo</h2>
        <div className="about-long-copy">
          <p>
            Lex Academia no sustituye la enseñanza docente, la lectura integral de los compendios
            ni la consulta de las fuentes jurídicas oficiales. Su propósito es complementar ese
            proceso mediante organización, práctica, retroalimentación y seguimiento, ofreciendo
            al estudiante una herramienta adicional para estudiar con mayor autonomía y criterio.
          </p>
        </div>
      </section>

      <section className="about-grid about-collaborators-section">
        {collaborators.map((person) => {
          const Icon = person.icon

          return (
            <article className="about-card" key={person.email}>
              <div className="about-card-photo-wrap">
                <img
                  className="about-card-photo"
                  src={person.photo}
                  alt={person.photoAlt}
                />
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

      <div style={{ marginTop: '24px' }}>
        <Link to="/" className="back-link">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  )
}

export default AboutPage
