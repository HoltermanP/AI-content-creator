import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Channel } from '@/lib/constants'

const scheduleSchema = z.object({
  companyId: z.string().min(1),
  channel: z.enum([Channel.LINKEDIN, Channel.INSTAGRAM, Channel.X_TWITTER, Channel.FACEBOOK, Channel.TIKTOK]),
  enabled: z.boolean().default(true),
  postsPerWeek: z.number().min(1).max(20).default(3),
  preferredDays: z.string().optional().nullable(),
  preferredHours: z.string().optional().nullable(),
  timezone: z.string().default('Europe/Amsterdam'),
  randomization: z.boolean().default(true),
})

// GET: Alle schedules ophalen (optioneel gefilterd op companyId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    const where = companyId ? { companyId } : {}

    const schedules = await prisma.publicationSchedule.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        channel: 'asc',
      },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen schedules' },
      { status: 500 }
    )
  }
}

// POST: Nieuwe schedule aanmaken
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = scheduleSchema.parse(body)

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

    // Check of er al een schedule bestaat voor dit bedrijf + kanaal
    const existing = await prisma.publicationSchedule.findUnique({
      where: {
        companyId_channel: {
          companyId: validatedData.companyId,
          channel: validatedData.channel,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Schedule bestaat al voor dit bedrijf en kanaal' },
        { status: 400 }
      )
    }

    const schedule = await prisma.publicationSchedule.create({
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

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Fout bij aanmaken schedule' },
      { status: 500 }
    )
  }
}

