import { extractUrl, isJobPostingUrl } from './url-extractor'

interface ScrapeResult {
  success: boolean
  text: string | null
  url: string
  error?: string
}

/**
 * Fetches a URL and extracts readable text content.
 * Used to extract job descriptions from job posting URLs.
 *
 * Security: Only fetches from known job platforms.
 * Timeout: 10 seconds max.
 * Size: Limits response to 1MB to prevent abuse.
 */
export async function scrapeJobPosting(url: string): Promise<ScrapeResult> {
  // Security: only allow known job platforms
  if (!isJobPostingUrl(url)) {
    return {
      success: false,
      text: null,
      url,
      error: 'URL não reconhecida. Por favor, cole o texto da vaga diretamente.',
    }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000) // 10s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Pretend to be a browser to avoid bot blocks
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return {
        success: false,
        text: null,
        url,
        error: `Não consegui acessar o link (status ${response.status}). Cole o texto da vaga diretamente.`,
      }
    }

    // Limit response size to 1MB
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1_000_000) {
      return {
        success: false,
        text: null,
        url,
        error: 'Página muito grande. Cole o texto da vaga diretamente.',
      }
    }

    const html = await response.text()

    // Extract text content from HTML
    const text = extractTextFromHtml(html)

    if (!text || text.length < 50) {
      return {
        success: false,
        text: null,
        url,
        error: 'Não consegui extrair o conteúdo da vaga. O site pode estar bloqueando. Cole o texto diretamente.',
      }
    }

    // Truncate if too long (keep under ~6000 tokens worth of text)
    const truncated = text.length > 8000 ? text.slice(0, 8000) + '\n\n[Texto truncado]' : text

    return {
      success: true,
      text: truncated,
      url,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        text: null,
        url,
        error: 'O site demorou demais para responder. Cole o texto da vaga diretamente.',
      }
    }

    return {
      success: false,
      text: null,
      url,
      error: 'Erro ao acessar o link. Cole o texto da vaga diretamente.',
    }
  }
}

/**
 * Strips HTML tags and extracts readable text.
 * Removes scripts, styles, nav elements, and other non-content elements.
 */
function extractTextFromHtml(html: string): string {
  // Remove script, style, nav, header, footer tags and their content
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')

  // Replace block elements with newlines
  cleaned = cleaned.replace(/<\/?(div|p|br|h[1-6]|li|tr|section|article)[^>]*>/gi, '\n')

  // Remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '')

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Clean up whitespace
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')

  // Remove excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  return cleaned.trim()
}
