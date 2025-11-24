import { NextRequest, NextResponse } from 'next/server'
import { generateArticle, generateSocialPosts, generateShortPosts } from '@/lib/ai-content-engine'
import { z } from 'zod'
import { Channel } from '@/lib/constants'

const generateSchema = z.object({
  companyId: z.string().min(1),
  productId: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
  channels: z.array(z.enum([Channel.LINKEDIN, Channel.INSTAGRAM, Channel.X_TWITTER, Channel.FACEBOOK, Channel.TIKTOK])).min(1, 'Selecteer minimaal 1 kanaal'),
  contentType: z.enum(['short', 'blog']).default('short'),
  focusType: z.enum(['product', 'company']).default('company'),
})

/**
 * POST /api/content/generate
 * Genereert een artikel en social posts op basis van bedrijfsinfo, product en URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = generateSchema.parse(body)

    let result

    if (validatedData.contentType === 'blog') {
      // Genereer uitgebreid artikel
      const article = await generateArticle(
        validatedData.companyId,
        validatedData.productId || null,
        validatedData.topic || null,
        validatedData.focusType
      )

      // Genereer social posts
      await generateSocialPosts(article.contentItemId, validatedData.channels)

      result = {
        success: true,
        contentItemId: article.contentItemId,
        title: article.title,
        summary: article.summary,
        message: 'Uitgebreid artikel en social posts succesvol gegenereerd',
      }
    } else {
      // Genereer alleen korte social posts
      const posts = await generateShortPosts(
        validatedData.companyId,
        validatedData.productId || null,
        validatedData.topic || null,
        validatedData.channels,
        validatedData.focusType
      )

      result = {
        success: true,
        contentItemId: posts.contentItemId,
        title: posts.title || 'Social Media Posts',
        summary: posts.summary || 'Korte social media posts gegenereerd',
        message: 'Social posts succesvol gegenereerd',
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error generating content:', error)
    return NextResponse.json(
      {
        error: 'Fout bij genereren content',
        message: error instanceof Error ? error.message : 'Onbekende fout',
      },
      { status: 500 }
    )
  }
}

