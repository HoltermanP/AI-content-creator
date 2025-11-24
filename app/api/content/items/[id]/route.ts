import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSocialPosts } from '@/lib/ai-content-engine'
import { Channel } from '@/lib/constants'
import { z } from 'zod'

// GET: Specifiek content item ophalen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentItem = await prisma.contentItem.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        product: true,
        socialPosts: {
          orderBy: {
            channel: 'asc',
          },
        },
      },
    })

    if (!contentItem) {
      return NextResponse.json(
        { error: 'Content item niet gevonden' },
        { status: 404 }
      )
    }

    return NextResponse.json(contentItem)
  } catch (error) {
    console.error('Error fetching content item:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen content item' },
      { status: 500 }
    )
  }
}

// PUT: Content item bijwerken
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, content, summary } = body

    const contentItem = await prisma.contentItem.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(summary && { summary }),
      },
    })

    return NextResponse.json(contentItem)
  } catch (error) {
    console.error('Error updating content item:', error)
    return NextResponse.json(
      { error: 'Fout bij bijwerken content item' },
      { status: 500 }
    )
  }
}

// DELETE: Content item verwijderen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contentItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Content item verwijderd' })
  } catch (error) {
    console.error('Error deleting content item:', error)
    return NextResponse.json(
      { error: 'Fout bij verwijderen content item' },
      { status: 500 }
    )
  }
}

// POST: Genereer extra social posts voor dit content item
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { channels } = z
      .object({
        channels: z.array(z.enum([Channel.LINKEDIN, Channel.INSTAGRAM, Channel.X_TWITTER, Channel.FACEBOOK, Channel.TIKTOK])).min(1),
      })
      .parse(body)

    await generateSocialPosts(params.id, channels)

    return NextResponse.json({
      success: true,
      message: 'Social posts gegenereerd',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error generating social posts:', error)
    return NextResponse.json(
      { error: 'Fout bij genereren social posts' },
      { status: 500 }
    )
  }
}

