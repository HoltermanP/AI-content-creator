// Channel constants (voor SQLite compatibiliteit)
export const Channel = {
  LINKEDIN: 'LINKEDIN',
  INSTAGRAM: 'INSTAGRAM',
  X_TWITTER: 'X_TWITTER',
  FACEBOOK: 'FACEBOOK',
  TIKTOK: 'TIKTOK',
} as const

export type Channel = typeof Channel[keyof typeof Channel]

// PostStatus constants (voor SQLite compatibiliteit)
export const PostStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
} as const

export type PostStatus = typeof PostStatus[keyof typeof PostStatus]

