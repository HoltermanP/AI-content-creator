import { prisma } from './prisma'
import { PostStatus, Channel } from './constants'
import { addDays, addHours, setHours, setMinutes, startOfWeek } from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'

/**
 * Berekent de volgende publicatietijdstippen voor een schedule
 * met randomisatie voor natuurlijk patroon
 */
export function calculateNextPublishTimes(
  postsPerWeek: number,
  randomization: boolean,
  preferredDays?: number[] | null,
  preferredHours?: number[] | null,
  timezone: string = 'Europe/Amsterdam'
): Date[] {
  const now = new Date()
  const times: Date[] = []
  const daysInWeek = 7

  // Bepaal voorkeursdagen (standaard alle dagen)
  const days = preferredDays && preferredDays.length > 0
    ? preferredDays
    : [1, 2, 3, 4, 5] // Maandag t/m Vrijdag standaard

  // Bepaal voorkeurstijden (standaard 9-17 uur)
  const hours = preferredHours && preferredHours.length > 0
    ? preferredHours
    : [9, 12, 15, 17] // Standaard tijden

  // Verdeel posts over de week
  const postsPerDay = Math.floor(postsPerWeek / days.length)
  const extraPosts = postsPerWeek % days.length

  let dayIndex = 0
  let postsRemaining = postsPerWeek

  // Start vanaf volgende week
  const startOfNextWeek = startOfWeek(addDays(now, 7), { weekStartsOn: 1 })

  while (postsRemaining > 0 && dayIndex < days.length * 2) {
    // Wissel tussen voorkeursdagen
    const dayOfWeek = days[dayIndex % days.length]
    const dayOffset = dayOfWeek - 1 // Convert to 0-based (Monday = 0)
    const targetDate = addDays(startOfNextWeek, dayOffset + Math.floor(dayIndex / days.length) * 7)

    // Bepaal aantal posts voor deze dag
    const postsForDay = postsPerDay + (dayIndex < extraPosts ? 1 : 0)
    const actualPosts = Math.min(postsForDay, postsRemaining)

    for (let i = 0; i < actualPosts; i++) {
      let hour: number

      if (randomization) {
        // Randomiseer tijd binnen voorkeurstijden
        const randomHour = hours[Math.floor(Math.random() * hours.length)]
        const randomMinute = Math.floor(Math.random() * 60)
        hour = randomHour
        const time = setMinutes(setHours(targetDate, hour), randomMinute)
        times.push(zonedTimeToUtc(time, timezone))
      } else {
        // Gebruik vaste tijden
        hour = hours[i % hours.length]
        const time = setMinutes(setHours(targetDate, hour), 0)
        times.push(zonedTimeToUtc(time, timezone))
      }
    }

    postsRemaining -= actualPosts
    dayIndex++
  }

  return times.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * Plant social posts voor een content item op basis van actieve schedules
 */
export async function schedulePostsForContentItem(
  contentItemId: string
): Promise<void> {
  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: {
      company: {
        include: {
          schedules: {
            where: {
              enabled: true,
            },
          },
        },
      },
      socialPosts: true,
    },
  })

  if (!contentItem) {
    throw new Error('Content item niet gevonden')
  }

  // Voor elke actieve schedule, plan posts
  for (const schedule of contentItem.company.schedules) {
    // Vind posts voor dit kanaal die nog niet gepland zijn
    const posts = contentItem.socialPosts.filter(
      (post) =>
        post.channel === schedule.channel &&
        post.status === PostStatus.DRAFT &&
        !post.scheduledFor
    )

    if (posts.length === 0) continue

    // Bereken volgende publicatietijden
    const preferredDays = schedule.preferredDays
      ? JSON.parse(schedule.preferredDays)
      : null
    const preferredHours = schedule.preferredHours
      ? JSON.parse(schedule.preferredHours)
      : null

    const publishTimes = calculateNextPublishTimes(
      schedule.postsPerWeek,
      schedule.randomization,
      preferredDays,
      preferredHours,
      schedule.timezone
    )

    // Plan posts (maximaal aantal beschikbare posts)
    const postsToSchedule = Math.min(posts.length, publishTimes.length)

    for (let i = 0; i < postsToSchedule; i++) {
      await prisma.socialPost.update({
        where: { id: posts[i].id },
        data: {
          scheduledFor: publishTimes[i],
          status: PostStatus.SCHEDULED,
        },
      })
    }
  }
}

/**
 * Haalt geplande posts op die klaar zijn voor publicatie
 */
export async function getPostsReadyToPublish(): Promise<
  Array<{
    id: string
    channel: Channel
    content: string
    ctaText?: string | null
    ctaUrl?: string | null
    contentItem: {
      company: {
        id: string
        name: string
      }
    }
  }>
> {
  const now = new Date()

  const posts = await prisma.socialPost.findMany({
    where: {
      status: PostStatus.SCHEDULED,
      scheduledFor: {
        lte: now, // scheduledFor <= now
      },
    },
    include: {
      contentItem: {
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      scheduledFor: 'asc',
    },
  })

  return posts.map((post) => ({
    id: post.id,
    channel: post.channel,
    content: post.content,
    ctaText: post.ctaText,
    ctaUrl: post.ctaUrl,
    contentItem: {
      company: post.contentItem.company,
    },
  }))
}

/**
 * Markeert een post als gepubliceerd
 */
export async function markPostAsPublished(
  postId: string,
  success: boolean = true
): Promise<void> {
  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      status: success ? PostStatus.PUBLISHED : PostStatus.FAILED,
      publishedAt: success ? new Date() : null,
    },
  })
}

