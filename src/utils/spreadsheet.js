const SHEETJS_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'

let sheetJsPromise = null

export function loadSheetJs() {
  if (globalThis.XLSX) return Promise.resolve(globalThis.XLSX)
  if (sheetJsPromise) return sheetJsPromise

  sheetJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SHEETJS_URL
    script.async = true
    script.dataset.derechoEstudioSheetjs = 'true'

    script.addEventListener('load', () => {
      if (globalThis.XLSX) {
        resolve(globalThis.XLSX)
      } else {
        reject(new Error('SheetJS se cargó, pero no expuso el objeto XLSX.'))
      }
    })

    script.addEventListener('error', () => {
      sheetJsPromise = null
      reject(new Error('No fue posible cargar el lector XLSX. Verifica tu conexión a Internet.'))
    })

    document.head.appendChild(script)
  })

  return sheetJsPromise
}

export async function parseSpreadsheetFile(file) {
  const XLSX = await loadSheetJs()
  const extension = file.name.split('.').pop()?.toLowerCase()

  let workbook

  if (extension === 'csv') {
    const text = await file.text()
    workbook = XLSX.read(text, { type: 'string' })
  } else {
    const buffer = await file.arrayBuffer()
    workbook = XLSX.read(buffer, { type: 'array' })
  }

  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []

  const worksheet = workbook.Sheets[firstSheetName]

  return XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  })
}
