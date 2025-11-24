import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const companySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  targetAudience: z.string().optional(),
  brandVoice: z.string().optional(),
})

// GET: Specifiek bedrijf ophalen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        products: true,
        contentItems: {
          include: {
            socialPosts: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        schedules: true,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Bedrijf niet gevonden' },
        { status: 404 }
      )
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen bedrijf' },
      { status: 500 }
    )
  }
}

// PUT: Bedrijf bijwerken
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = companySchema.parse(body)

    const company = await prisma.company.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json(company)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Fout bij bijwerken bedrijf' },
      { status: 500 }
    )
  }
}

// DELETE: Bedrijf verwijderen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.company.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Bedrijf verwijderd' })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { error: 'Fout bij verwijderen bedrijf' },
      { status: 500 }
    )
  }
}


