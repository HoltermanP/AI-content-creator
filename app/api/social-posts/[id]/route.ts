import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PostStatus } from '@/lib/constants'
import { z } from 'zod'

// GET: Specifieke social post ophalen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.socialPost.findUnique({
      where: { id: params.id },
      include: {
        contentItem: {
          include: {
            company: true,
            product: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Social post niet gevonden' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching social post:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen social post' },
      { status: 500 }
    )
  }
}

// PUT: Social post bijwerken
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updateSchema = z.object({
      content: z.string().optional(),
      ctaText: z.string().optional(),
      ctaUrl: z.string().url().optional().or(z.literal('')),
      hashtags: z.array(z.string()).optional(),
      status: z.enum([PostStatus.DRAFT, PostStatus.SCHEDULED, PostStatus.PUBLISHED, PostStatus.FAILED]).optional(),
      scheduledFor: z.string().datetime().optional().nullable(),
    })

    const validatedData = updateSchema.parse(body)

    // Converteer hashtags array naar JSON string
    const updateData: any = { ...validatedData }
    if (validatedData.hashtags) {
      updateData.hashtags = JSON.stringify(validatedData.hashtags)
    }
    if (validatedData.scheduledFor) {
      updateData.scheduledFor = new Date(validatedData.scheduledFor)
    }

    const post = await prisma.socialPost.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(post)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating social post:', error)
    return NextResponse.json(
      { error: 'Fout bij bijwerken social post' },
      { status: 500 }
    )
  }
}

// DELETE: Social post verwijderen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.socialPost.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Social post verwijderd' })
  } catch (error) {
    console.error('Error deleting social post:', error)
    return NextResponse.json(
      { error: 'Fout bij verwijderen social post' },
      { status: 500 }
    )
  }
}

