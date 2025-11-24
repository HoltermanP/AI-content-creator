import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Channel } from '@/lib/constants'

const updateScheduleSchema = z.object({
  enabled: z.boolean().optional(),
  postsPerWeek: z.number().min(1).max(20).optional(),
  preferredDays: z.string().optional().nullable(),
  preferredHours: z.string().optional().nullable(),
  timezone: z.string().optional(),
  randomization: z.boolean().optional(),
})

// GET: Specifieke schedule ophalen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schedule = await prisma.publicationSchedule.findUnique({
      where: { id: params.id },
      include: {
        company: true,
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule niet gevonden' },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen schedule' },
      { status: 500 }
    )
  }
}

// PUT: Schedule bijwerken
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateScheduleSchema.parse(body)

    const schedule = await prisma.publicationSchedule.update({
      where: { id: params.id },
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

    return NextResponse.json(schedule)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Fout bij bijwerken schedule' },
      { status: 500 }
    )
  }
}

// DELETE: Schedule verwijderen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.publicationSchedule.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Schedule verwijderd' })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Fout bij verwijderen schedule' },
      { status: 500 }
    )
  }
}

