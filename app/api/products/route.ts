import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const productSchema = z.object({
  companyId: z.string().min(1, 'Company ID is verplicht'),
  name: z.string().min(1, 'Productnaam is verplicht'),
  description: z.string().min(1, 'Beschrijving is verplicht'),
  price: z.string().optional(),
  features: z.string().optional(), // JSON string
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional().or(z.literal('')),
})

// GET: Alle producten ophalen (optioneel gefilterd op companyId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    const where = companyId ? { companyId } : {}

    const products = await prisma.product.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
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

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen producten' },
      { status: 500 }
    )
  }
}

// POST: Nieuw product aanmaken
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = productSchema.parse(body)

    // Verifieer dat bedrijf bestaat
    const company = await prisma.company.findUnique({
      where: { id: validatedData.companyId },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Bedrijf niet gevonden' },
        { status: 404 }
      )
    }

    const product = await prisma.product.create({
      data: validatedData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Fout bij aanmaken product' },
      { status: 500 }
    )
  }
}


