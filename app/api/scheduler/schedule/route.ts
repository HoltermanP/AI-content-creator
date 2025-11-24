import { NextRequest, NextResponse } from 'next/server'
import { schedulePostsForContentItem } from '@/lib/scheduler'
import { z } from 'zod'

const scheduleSchema = z.object({
  contentItemId: z.string().min(1),
})

/**
 * POST /api/scheduler/schedule
 * 
 * Plant social posts voor een content item op basis van actieve schedules
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentItemId } = scheduleSchema.parse(body)

    await schedulePostsForContentItem(contentItemId)

    return NextResponse.json({
      success: true,
      message: 'Posts succesvol gepland',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatiefout', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error scheduling posts:', error)
    return NextResponse.json(
      {
        error: 'Fout bij plannen posts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


