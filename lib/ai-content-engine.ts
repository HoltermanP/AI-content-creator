import { openai, checkOpenAIConfiguration } from './openai'
import { scrapeUrl } from './web-scraper'
import { prisma } from './prisma'
import { Channel, PostStatus } from './constants'

/**
 * Voert AI-based research uit en genereert trends/actualiteiten zonder URL
 */
async function performAIRearch(
  companyInfo: {
    name: string
    industry?: string | null
    targetAudience?: string | null
    description?: string | null
    brandVoice?: string | null
  },
  productInfo?: {
    name: string
    description: string
  } | null,
  topic?: string | null
): Promise<{
  trends: string[]
  keywords: string[]
  insights: string
  sources: string[]
}> {
  const researchPrompt = `Je bent een expert marketeer, journalist en marktanalist met toegang tot actuele marktinformatie. Identificeer belangrijke, actuele marktontwikkelingen, nieuws en trends die relevant zijn voor dit bedrijf en product:

Bedrijf: ${companyInfo.name}
${companyInfo.description ? `Bedrijfsbeschrijving: ${companyInfo.description}` : ''}
Industrie: ${companyInfo.industry || 'Niet gespecificeerd'}
Doelgroep: ${companyInfo.targetAudience || 'Niet gespecificeerd'}
${companyInfo.brandVoice ? `Brand voice: ${companyInfo.brandVoice}` : ''}
${productInfo ? `Product: ${productInfo.name} - ${productInfo.description}` : ''}
${topic ? `Specifiek onderwerp/trend: ${topic}` : ''}

Geef een JSON response met:
{
  "trends": ["actuele marktontwikkeling 1", "actuele marktontwikkeling 2", "actuele marktontwikkeling 3"],
  "keywords": ["keyword 1", "keyword 2", "keyword 3"],
  "insights": "Uitgebreide beschrijving van de belangrijkste actuele marktontwikkelingen, nieuws en trends die relevant zijn. Beschrijf concrete ontwikkelingen, cijfers, en impact. Focus op wat er NU gebeurt in de markt, niet op het bedrijf/product zelf.",
  "sources": ["type bron 1", "type bron 2"]
}

BELANGRIJK:
- Focus op ACTUELE ontwikkelingen (laatste maanden/jaar)
- Identificeer concrete trends, nieuws en veranderingen in de markt
- Beschrijf uitdagingen en kansen die ontstaan door deze ontwikkelingen
- Geef relevante keywords die mensen gebruiken bij het zoeken naar oplossingen
- Denk aan ontwikkelingen waar dit bedrijf/product oplossingen voor biedt
- NIET op het bedrijf/product zelf, maar op de marktcontext en ontwikkelingen
${topic ? `- Specifiek gericht op: ${topic}` : ''}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Je bent een expert marketeer, journalist en marktanalist met kennis van actuele marktontwikkelingen. Je hebt toegang tot informatie over trends, nieuws en ontwikkelingen in verschillende industrieën. Geef altijd geldige JSON responses met concrete, actuele informatie.',
        },
        {
          role: 'user',
          content: researchPrompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Geen response van OpenAI')
    }

    const parsed = JSON.parse(content)
    return {
      trends: parsed.trends || [],
      keywords: parsed.keywords || [],
      insights: parsed.insights || '',
      sources: parsed.sources || [],
    }
  } catch (error) {
    console.error('Error in AI research:', error)
    // Fallback
    return {
      trends: ['Digitale transformatie', 'Klantgerichtheid', 'Innovatie'],
      keywords: ['marketing', 'groei', 'succes'],
      insights: 'Focus op relevante trends en positioneer het product als oplossing.',
      sources: [],
    }
  }
}

/**
 * Genereert een lang artikel op basis van AI research, bedrijfsinfo en product
 */
export async function generateArticle(
  companyId: string,
  productId: string | null,
  topic: string | null,
  focusType: 'product' | 'company' = 'company'
): Promise<{
  contentItemId: string
  title: string
  content: string
  summary: string
}> {
  // Haal bedrijfs- en productinfo op
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) {
    throw new Error('Bedrijf niet gevonden')
  }

  const product = productId
    ? await prisma.product.findUnique({
        where: { id: productId },
      })
    : null

  // Check OpenAI configuratie
  checkOpenAIConfiguration()

  // Voer AI-based research uit
  const research = await performAIRearch(
    company,
    product || undefined,
    topic
  )

  // Genereer artikel
  const articlePrompt = `Je bent een expert content schrijver en journalist. Schrijf een uitgebreid, enthousiasmerend artikel (minimaal 1500 woorden) dat:

BELANGRIJK: Het artikel moet PRIMAIR gaan over marktontwikkelingen, nieuws en trends. Het bedrijf/product wordt gepositioneerd als oplossing voor deze ontwikkelingen, maar is NIET het hoofdonderwerp.

Structuur:
1. START met actuele marktontwikkelingen en nieuws: ${research.trends.join(', ')}
2. Beschrijf de impact en betekenis van deze ontwikkelingen
3. Leg uit welke uitdagingen en kansen dit creëert
4. ${focusType === 'product' && product 
  ? `Positioneer "${product.name}" als de primaire oplossing voor deze ontwikkelingen. Focus op hoe dit specifieke product de uitdagingen oplost. Het bedrijf "${company.name}" wordt genoemd als de maker van dit product.`
  : `Positioneer "${company.name}" als relevante oplossing voor deze ontwikkelingen. Focus op het bedrijf, zijn expertise en aanpak.${product ? ` Het product "${product.name}" kan worden genoemd als voorbeeld van wat het bedrijf biedt.` : ''}`}
5. Maak het enthousiasmerend zodat mensen geïnteresseerd raken${focusType === 'product' && product ? ' in het product' : ' in het bedrijf'}
6. Sluit af met een duidelijke call-to-action${focusType === 'product' && product ? ' richting het product' : ' richting het bedrijf'}

Marktcontext en insights:
${research.insights}

${focusType === 'product' && product ? `PRODUCTINFO (PRIMAIRE FOCUS - gebruik dit als hoofdoplossing):
- Naam: ${product.name}
- Beschrijving: ${product.description}
- Features: ${product.features || 'Niet gespecificeerd'}
- CTA: ${product.ctaText || 'Meer informatie'}
- URL: ${product.ctaUrl || 'Niet gespecificeerd'}

Bedrijfsinfo (secundair - noem als maker van het product):
- Naam: ${company.name}
- Beschrijving: ${company.description || 'Niet gespecificeerd'}` : `BEDRIJFSINFO (PRIMAIRE FOCUS - gebruik dit als hoofdoplossing):
- Naam: ${company.name}
- Beschrijving: ${company.description || 'Niet gespecificeerd'}
- Industrie: ${company.industry || 'Niet gespecificeerd'}
- Doelgroep: ${company.targetAudience || 'Niet gespecificeerd'}
- Brand voice: ${company.brandVoice || 'Professioneel en toegankelijk'}
${product ? `
Productinfo (secundair - noem als voorbeeld van wat het bedrijf biedt):
- Naam: ${product.name}
- Beschrijving: ${product.description}` : ''}`}

Marktontwikkelingen en trends:
${research.trends.join(', ')}

Keywords: ${research.keywords.join(', ')}

Schrijf het artikel in Markdown formaat met:
- Een pakkende titel die gaat over de marktontwikkeling, niet over het bedrijf
- Inleiding die de lezer pakt met het nieuws/ontwikkeling
- Meerdere secties met subkoppen (##) die dieper ingaan op de ontwikkelingen
- Concrete voorbeelden, cases en data over de marktontwikkelingen
- Natuurlijke integratie van het product/bedrijf als oplossing (niet als hoofdonderwerp)
- Enthousiasmerende toon die mensen aanzet tot actie
- Sterke call-to-action aan het einde richting het product
- Gebruik van de keywords: ${research.keywords.join(', ')}

Het artikel moet:
- 80% gaan over marktontwikkelingen, nieuws en trends
- 20% gaan over hoe ${focusType === 'product' && product ? `het product "${product.name}"` : `het bedrijf "${company.name}"`} hierop inspeelt
- Waardevol en informatief zijn voor de lezer
- Enthousiasmerend zijn zodat mensen ${focusType === 'product' && product ? 'het product willen afnemen' : 'met het bedrijf willen werken'}
- ${focusType === 'product' && product ? `Focus op concrete voordelen en features van "${product.name}"` : `Focus op de expertise, aanpak en waarde van "${company.name}"`}
- NIET primair promotioneel zijn, maar wel overtuigend`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Je bent een expert content schrijver en journalist die artikelen schrijft over marktontwikkelingen en nieuws, waarbij producten/bedrijven worden gepositioneerd als oplossing. Je focus ligt op de marktontwikkelingen, niet op het bedrijf/product zelf.',
        },
        {
          role: 'user',
          content: articlePrompt,
        },
      ],
      temperature: 0.8,
    })

    const articleContent = response.choices[0]?.message?.content || ''
    const titleMatch = articleContent.match(/^#\s+(.+)$/m)
    const title = titleMatch
      ? titleMatch[1]
      : `Artikel over ${company.name}`

    // Genereer samenvatting
    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Geef een korte samenvatting (max 150 woorden) van het artikel.',
        },
        {
          role: 'user',
          content: `Samenvat het volgende artikel in max 150 woorden:\n\n${articleContent.substring(0, 2000)}`,
        },
      ],
      temperature: 0.5,
    })

    const summary = summaryResponse.choices[0]?.message?.content || ''

    // Sla artikel op in database
    const contentItem = await prisma.contentItem.create({
      data: {
        companyId,
        productId,
        sourceUrl: topic || `AI-generated: ${research.trends[0] || 'Marktontwikkelingen'}`,
        title,
        content: articleContent,
        summary,
        keywords: JSON.stringify(research.keywords),
        trends: JSON.stringify(research.trends),
      },
    })

    return {
      contentItemId: contentItem.id,
      title,
      content: articleContent,
      summary,
    }
  } catch (error) {
    console.error('Error generating article:', error)
    throw new Error('Fout bij genereren artikel')
  }
}

/**
 * Genereert social media posts uit een artikel
 */
export async function generateSocialPosts(
  contentItemId: string,
  channels: Channel[]
): Promise<void> {
  // Check OpenAI configuratie
  checkOpenAIConfiguration()

  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: {
      company: true,
      product: true,
    },
  })

  if (!contentItem) {
    throw new Error('Content item niet gevonden')
  }

  const channelConfigs: Record<string, { maxLength: number; style: string }> = {
    [Channel.LINKEDIN]: {
      maxLength: 3000,
      style: 'Professioneel, zakelijk, waardevol. Gebruik emoji spaarzaam. Focus op business value.',
    },
    [Channel.INSTAGRAM]: {
      maxLength: 2200,
      style: 'Visueel, inspirerend, gebruik emoji. Hashtags zijn belangrijk (5-10).',
    },
    [Channel.X_TWITTER]: {
      maxLength: 280,
      style: 'Kort, pakkend, trending. Gebruik 1-2 relevante hashtags. Directe CTA.',
    },
    [Channel.FACEBOOK]: {
      maxLength: 5000,
      style: 'Vriendelijk, toegankelijk, engagement-gericht. Gebruik vragen om reacties uit te lokken.',
    },
    [Channel.TIKTOK]: {
      maxLength: 300,
      style: 'Trendy, kort, pakkend. Focus op hook in eerste regel. Gebruik trending hashtags.',
    },
  }

  for (const channel of channels) {
    const config = channelConfigs[channel]

    const postPrompt = `Genereer een social media post voor ${channel} op basis van dit artikel:

BELANGRIJK: De post moet PRIMAIR gaan over de marktontwikkeling/nieuws uit het artikel, niet over het bedrijf/product. Het bedrijf/product wordt gepositioneerd als oplossing.

Artikel context:
Titel: ${contentItem.title}
Samenvatting: ${contentItem.summary}
Artikel (eerste deel): ${contentItem.content.substring(0, 1000)}

Bedrijfsinfo (gebruik om de oplossing te positioneren):
Bedrijf: ${contentItem.company.name}
${contentItem.product ? `Product: ${contentItem.product.name} - ${contentItem.product.description}` : ''}

Stijl: ${config.style}
Max lengte: ${config.maxLength} karakters

De post moet:
1. STARTEN met de marktontwikkeling/nieuws uit het artikel (pakkend en aandacht trekkend)
2. De impact en betekenis van deze ontwikkeling beschrijven
3. Natuurlijk verwijzen naar hoe ${contentItem.company.name}${contentItem.product ? ` en ${contentItem.product.name}` : ''} hierop inspelen als oplossing
4. Enthousiasmerend zijn zodat mensen geïnteresseerd raken
5. Een duidelijke CTA bevatten richting het artikel/product/abonnement
${contentItem.product ? `6. Link naar: ${contentItem.product.ctaUrl || 'product pagina'}` : ''}
7. Relevante hashtags bevatten (voor Instagram/TikTok/X)

Verhouding: 70% marktontwikkeling, 30% oplossing/product

Geef een JSON response:
{
  "content": "De post content",
  "ctaText": "Call-to-action tekst",
  "ctaUrl": "${contentItem.product?.ctaUrl || ''}",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert social media marketeer. Geef altijd geldige JSON.',
          },
          {
            role: 'user',
            content: postPrompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      })

      const postData = JSON.parse(
        response.choices[0]?.message?.content || '{}'
      )

      await prisma.socialPost.create({
        data: {
          contentItemId,
          channel,
          content: postData.content || '',
          ctaText: postData.ctaText || contentItem.product?.ctaText || 'Meer informatie',
          ctaUrl: postData.ctaUrl || contentItem.product?.ctaUrl || '',
          hashtags: JSON.stringify(postData.hashtags || []),
          status: PostStatus.DRAFT,
        },
      })
    } catch (error) {
      console.error(`Error generating post for ${channel}:`, error)
      // Maak een fallback post
      await prisma.socialPost.create({
        data: {
          contentItemId,
          channel,
          content: `${contentItem.title}\n\n${contentItem.summary?.substring(0, config.maxLength - 100)}...`,
          ctaText: contentItem.product?.ctaText || 'Lees meer',
          ctaUrl: contentItem.product?.ctaUrl || '',
          status: PostStatus.DRAFT,
        },
      })
    }
  }
}

/**
 * Genereert alleen korte social media posts zonder uitgebreid artikel
 */
export async function generateShortPosts(
  companyId: string,
  productId: string | null,
  topic: string | null,
  channels: Channel[],
  focusType: 'product' | 'company' = 'company'
): Promise<{
  contentItemId: string
  title: string
  summary: string
}> {
  // Check OpenAI configuratie
  checkOpenAIConfiguration()

  // Haal bedrijfs- en productinfo op
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) {
    throw new Error('Bedrijf niet gevonden')
  }

  const product = productId
    ? await prisma.product.findUnique({
        where: { id: productId },
      })
    : null

  // Voer AI-based research uit
  const research = await performAIRearch(
    company,
    product || undefined,
    topic
  )

  // Maak een kort content item aan
  const title = research.trends[0] || `Marktontwikkelingen voor ${company.name}`
  const summary = research.insights.substring(0, 200) + (research.insights.length > 200 ? '...' : '')

  const contentItem = await prisma.contentItem.create({
    data: {
      companyId,
      productId,
      sourceUrl: topic || `AI-generated: ${research.trends[0] || 'Marktontwikkelingen'}`,
      title,
      content: summary, // Korte samenvatting in plaats van volledig artikel
      summary,
      keywords: JSON.stringify(research.keywords),
      trends: JSON.stringify(research.trends),
    },
  })

  // Genereer social posts direct op basis van de scraped content en research
  const channelConfigs: Record<string, { maxLength: number; style: string }> = {
    [Channel.LINKEDIN]: {
      maxLength: 3000,
      style: 'Professioneel, zakelijk, waardevol. Gebruik emoji spaarzaam. Focus op business value.',
    },
    [Channel.INSTAGRAM]: {
      maxLength: 2200,
      style: 'Visueel, inspirerend, gebruik emoji. Hashtags zijn belangrijk (5-10).',
    },
    [Channel.X_TWITTER]: {
      maxLength: 280,
      style: 'Kort, pakkend, trending. Gebruik 1-2 relevante hashtags. Directe CTA.',
    },
    [Channel.FACEBOOK]: {
      maxLength: 5000,
      style: 'Vriendelijk, toegankelijk, engagement-gericht. Gebruik vragen om reacties uit te lokken.',
    },
    [Channel.TIKTOK]: {
      maxLength: 300,
      style: 'Trendy, kort, pakkend. Focus op hook in eerste regel. Gebruik trending hashtags.',
    },
  }

  for (const channel of channels) {
    const config = channelConfigs[channel]

    const postPrompt = `Genereer een social media post voor ${channel} op basis van deze informatie:

BELANGRIJK: De post moet PRIMAIR gaan over de marktontwikkeling/nieuws, niet over het bedrijf/product. ${focusType === 'product' && product ? `Het product "${product.name}" wordt gepositioneerd als de primaire oplossing.` : `Het bedrijf "${company.name}" wordt gepositioneerd als de primaire oplossing.`}

Marktontwikkelingen:
Actuele ontwikkelingen: ${research.trends.join(', ')}
Context: ${research.insights}
Keywords: ${research.keywords.join(', ')}

${focusType === 'product' && product ? `PRODUCTINFO (PRIMAIRE FOCUS):
Product: ${product.name}
Beschrijving: ${product.description}
${product.ctaText ? `CTA: ${product.ctaText}` : ''}
${product.ctaUrl ? `URL: ${product.ctaUrl}` : ''}

Bedrijfsinfo (secundair - noem als maker):
Bedrijf: ${company.name}` : `BEDRIJFSINFO (PRIMAIRE FOCUS):
Bedrijf: ${company.name}
${company.description ? `Beschrijving: ${company.description}` : ''}
${company.brandVoice ? `Brand voice: ${company.brandVoice}` : ''}
${product ? `Product (secundair - noem als voorbeeld): ${product.name} - ${product.description}` : ''}`}

Stijl: ${config.style}
Max lengte: ${config.maxLength} karakters

De post moet:
1. STARTEN met de marktontwikkeling/nieuws (pakkend en aandacht trekkend)
2. De impact en betekenis van deze ontwikkeling beschrijven
3. Natuurlijk verwijzen naar hoe ${focusType === 'product' && product ? `${product.name} hierop inspeelt als oplossing. Focus op het product.` : `${company.name} hierop inspeelt als oplossing. Focus op het bedrijf.`}
4. Enthousiasmerend zijn zodat mensen geïnteresseerd raken${focusType === 'product' && product ? ' in het product' : ' in het bedrijf'}
5. Een duidelijke CTA bevatten${focusType === 'product' && product ? ` richting het product: ${product.ctaUrl || 'product pagina'}` : ' richting het bedrijf'}
${focusType === 'product' && product ? `6. Link naar: ${product.ctaUrl || 'product pagina'}` : ''}
${focusType === 'product' && product ? '7' : '6'}. Relevante hashtags bevatten (voor Instagram/TikTok/X)

Verhouding: 70% marktontwikkeling, 30% ${focusType === 'product' && product ? 'product' : 'bedrijf'}

Geef een JSON response:
{
  "content": "De post content",
  "ctaText": "Call-to-action tekst",
  "ctaUrl": "${product?.ctaUrl || ''}",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert social media marketeer. Geef altijd geldige JSON.',
          },
          {
            role: 'user',
            content: postPrompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      })

      const postData = JSON.parse(
        response.choices[0]?.message?.content || '{}'
      )

      await prisma.socialPost.create({
        data: {
          contentItemId: contentItem.id,
          channel,
          content: postData.content || '',
          ctaText: postData.ctaText || product?.ctaText || 'Meer informatie',
          ctaUrl: postData.ctaUrl || product?.ctaUrl || '',
          hashtags: JSON.stringify(postData.hashtags || []),
          status: PostStatus.DRAFT,
        },
      })
    } catch (error) {
      console.error(`Error generating post for ${channel}:`, error)
      // Maak een fallback post
      await prisma.socialPost.create({
        data: {
          contentItemId: contentItem.id,
          channel,
          content: `${title}\n\n${summary.substring(0, config.maxLength - 100)}...`,
          ctaText: product?.ctaText || 'Lees meer',
          ctaUrl: product?.ctaUrl || '',
          status: PostStatus.DRAFT,
        },
      })
    }
  }

  return {
    contentItemId: contentItem.id,
    title,
    summary,
  }
}

