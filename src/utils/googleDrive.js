export function extractGoogleDriveFileId(url = '') {
  if (!url || typeof url !== 'string') {
    return null
  }

  const cleanUrl = url.trim()

  const filePathMatch = cleanUrl.match(/\/file\/d\/([^/?#]+)/)

  if (filePathMatch?.[1]) {
    return filePathMatch[1]
  }

  const queryIdMatch = cleanUrl.match(/[?&]id=([^&#]+)/)

  if (queryIdMatch?.[1]) {
    return queryIdMatch[1]
  }

  return null
}

export function isGoogleDriveUrl(url = '') {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const parsedUrl = new URL(url)

    return (
      parsedUrl.hostname === 'drive.google.com' ||
      parsedUrl.hostname.endsWith('.drive.google.com')
    )
  } catch {
    return false
  }
}

export function getPdfEmbedUrl(url = '') {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const cleanUrl = url.trim()

  if (isGoogleDriveUrl(cleanUrl)) {
    const fileId = extractGoogleDriveFileId(cleanUrl)

    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`
    }
  }

  return cleanUrl
}