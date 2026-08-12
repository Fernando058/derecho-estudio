import { supabase } from '../lib/supabase'

function fail(error, fallback) {
  if (error) throw new Error(error.message || fallback)
}

export async function getSubjectStudyData(subjectSlug) {
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id,name,slug,code,credits,description,semester_id')
    .eq('slug', subjectSlug)
    .eq('is_published', true)
    .maybeSingle()

  fail(subjectError, 'No fue posible cargar la materia.')
  if (!subject) return null

  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('id,unit_number,title,slug,summary,learning_outcome,sort_order')
    .eq('subject_id', subject.id)
    .eq('is_published', true)
    .order('unit_number', { ascending: true })

  fail(unitsError, 'No fue posible cargar las unidades.')

  const { data: documents, error: documentsError } = await supabase
    .from('documents')
    .select('id,unit_id,document_type')
    .eq('subject_id', subject.id)
    .eq('is_published', true)

  fail(documentsError, 'No fue posible cargar los documentos de la materia.')

  return {
    subject,
    units: units ?? [],
    documents: documents ?? [],
  }
}

export async function getUnitStudyData(subjectSlug, unitNumber) {
  const subjectResult = await getSubjectStudyData(subjectSlug)
  if (!subjectResult) return null

  const unit = subjectResult.units.find(
    (item) => item.unit_number === Number(unitNumber),
  )

  if (!unit) return null

  const [topicsResult, blocksResult, documentsResult] = await Promise.all([
    supabase
      .from('topics')
      .select('id,parent_topic_id,title,slug,description,sort_order')
      .eq('unit_id', unit.id)
      .eq('is_published', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('content_blocks')
      .select('id,topic_id,content_type,title,content,sort_order')
      .eq('unit_id', unit.id)
      .eq('is_published', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('documents')
      .select('id,topic_id,title,description,document_type,provider,source_url,start_page,end_page,sort_order')
      .eq('unit_id', unit.id)
      .eq('is_published', true)
      .order('sort_order', { ascending: true }),
  ])

  fail(topicsResult.error, 'No fue posible cargar los temas.')
  fail(blocksResult.error, 'No fue posible cargar el contenido.')
  fail(documentsResult.error, 'No fue posible cargar los documentos.')

  const topics = topicsResult.data ?? []
  const topicIds = topics.map((topic) => topic.id)

  let legalArticles = []
  let readings = []

  if (topicIds.length > 0) {
    const [legalResult, readingResult] = await Promise.all([
      supabase
        .from('topic_legal_articles')
        .select(`
          topic_id,
          importance,
          notes,
          legal_article:legal_articles(
            id,
            article_number,
            heading,
            article_text,
            explanation,
            official_url,
            status,
            legal_source:legal_sources(
              id,
              title,
              abbreviation,
              source_type,
              jurisdiction,
              official_url,
              status
            )
          )
        `)
        .in('topic_id', topicIds),
      supabase
        .from('topic_readings')
        .select(`
          topic_id,
          relevance,
          sort_order,
          reading:readings(
            id,
            title,
            author,
            publication_year,
            reading_type,
            description,
            url
          )
        `)
        .in('topic_id', topicIds)
        .order('sort_order', { ascending: true }),
    ])

    fail(legalResult.error, 'No fue posible cargar la base normativa.')
    fail(readingResult.error, 'No fue posible cargar las lecturas.')

    legalArticles = (legalResult.data ?? []).filter((item) => item.legal_article)
    readings = (readingResult.data ?? []).filter((item) => item.reading)
  }

  return {
    subject: subjectResult.subject,
    unit,
    topics,
    contentBlocks: blocksResult.data ?? [],
    documents: documentsResult.data ?? [],
    legalArticles,
    readings,
  }
}
