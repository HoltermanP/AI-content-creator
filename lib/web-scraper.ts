import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * Scrapt content van een URL voor gebruik in content generatie
 */
export async function scrapeUrl(url: string): Promise<{
  title: string
  content: string
  text: string
  links: string[]
}> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    })

    const $ = cheerio.load(response.data)

    // Verwijder script en style tags
    $('script, style, nav, footer, header').remove()

    const title = $('title').text() || $('h1').first().text() || 'Geen titel'
    const content = $('main, article, .content, #content').html() || $('body').html() || ''
    const text = $('main, article, .content, #content').text() || $('body').text() || ''
    
    // Extract links
    const links: string[] = []
    $('a').each((_, el) => {
      const href = $(el).attr('href')
      if (href && href.startsWith('http')) {
        links.push(href)
      }
    })

    return {
      title: title.trim(),
      content: content.trim(),
      text: text.trim().substring(0, 10000), // Limiteer tot 10k karakters
      links: links.slice(0, 10), // Max 10 links
    }
  } catch (error) {
    console.error('Error scraping URL:', error)
    throw new Error(`Fout bij scrapen van URL: ${url}`)
  }
}


