import { NextRequest, NextResponse } from 'next/server'
import { getPostsReadyToPublish, markPostAsPublished } from '@/lib/scheduler'

/**
 * POST /api/scheduler/run
 * 
 * Dit endpoint wordt aangeroepen door een cron job (bijv. elke minuut)
 * om geplande posts te publiceren.
 * 
 * In productie zou je dit kunnen triggeren via:
 * - Vercel Cron Jobs
 * - node-cron (lokaal)
 * - Externe service zoals EasyCron
 */
export async function POST(request: NextRequest) {
  try {
    // Verifieer API key (optioneel, voor beveiliging)
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.SCHEDULER_API_KEY

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const postsToPublish = await getPostsReadyToPublish()

    const results = []

    for (const post of postsToPublish) {
      try {
        // TODO: Implementeer daadwerkelijke publicatie naar social media APIs
        // Voor nu markeren we het als gepubliceerd
        // In productie zou je hier de LinkedIn/Instagram/X APIs aanroepen

        console.log(`Publishing post ${post.id} to ${post.channel}`)
        console.log(`Content: ${post.content.substring(0, 100)}...`)

        // Simuleer publicatie (vervang dit met echte API calls)
        await markPostAsPublished(post.id, true)

        results.push({
          postId: post.id,
          channel: post.channel,
          status: 'published',
        })
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error)
        await markPostAsPublished(post.id, false)

        results.push({
          postId: post.id,
          channel: post.channel,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: postsToPublish.length,
      results,
    })
  } catch (error) {
    console.error('Error in scheduler run:', error)
    return NextResponse.json(
      {
        error: 'Fout bij uitvoeren scheduler',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


