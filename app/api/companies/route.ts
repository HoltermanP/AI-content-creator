import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validatie schema voor bedrijfsinfo
const companySchema = z.object({
  name: z.string().min(1, 'Bedrijfsnaam is verplicht'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  targetAudience: z.string().optional(),
  brandVoice: z.string().optional(),
})

// GET: Alle bedrijven ophalen
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        products: true,
        _count: {
          select: {
            contentItems: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen bedrijven' },
      { status: 500 }
    )
  }
}

// POST: Nieuw bedrijf aanmaken
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = companySchema.parse(body)

    const company = await prisma.company.create({
      data: validatedData,
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating company:', error)
    return NextResponse.json(
      { error: 'Fout bij aanmaken bedrijf' },
      { status: 500 }
    )
  }
}


