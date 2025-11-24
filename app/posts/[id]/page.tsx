'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PostStatus, Channel } from '@/lib/constants'

interface SocialPost {
  id: string
  channel: Channel
  content: string
  ctaText?: string | null
  ctaUrl?: string | null
  hashtags?: string | null
  status: PostStatus
  scheduledFor?: string | null
  publishedAt?: string | null
  contentItem: {
    id: string
    title: string
    company: {
      id: string
      name: string
    }
  }
}

const channelLabels: Record<Channel, string> = {
  LINKEDIN: 'LinkedIn',
  INSTAGRAM: 'Instagram',
  X_TWITTER: 'X (Twitter)',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
}

const statusLabels: Record<PostStatus, string> = {
  DRAFT: 'Concept',
  SCHEDULED: 'Gepland',
  PUBLISHED: 'Gepubliceerd',
  FAILED: 'Mislukt',
}

export default function SocialPostPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<SocialPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<{
    content: string
    ctaText: string
    ctaUrl: string
    hashtags: string[]
    status: PostStatus
  }>({
    content: '',
    ctaText: '',
    ctaUrl: '',
    hashtags: [],
    status: PostStatus.DRAFT,
  })

  useEffect(() => {
    if (params.id) {
      loadPost(params.id as string)
    }
  }, [params.id])

  const loadPost = async (id: string) => {
    try {
      const response = await fetch(`/api/social-posts/${id}`)
      if (!response.ok) {
        alert('Post niet gevonden')
        router.push('/')
        return
      }
      const data = await response.json()
      setPost(data)
      setEditData({
        content: data.content,
        ctaText: data.ctaText || '',
        ctaUrl: data.ctaUrl || '',
        hashtags: data.hashtags ? JSON.parse(data.hashtags) : [],
        status: data.status,
      })
    } catch (error) {
      console.error('Error loading post:', error)
      alert('Fout bij laden post')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!post) return

    setSaving(true)
    try {
      const response = await fetch(`/api/social-posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          hashtags: editData.hashtags,
        }),
      })

      if (!response.ok) {
        alert('Fout bij opslaan')
        return
      }

      const updated = await response.json()
      setPost(updated)
      alert('Opgeslagen!')
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Fout bij opslaan')
    } finally {
      setSaving(false)
    }
  }

  const handleHashtagsChange = (value: string) => {
    const hashtags = value
      .split(',')
      .map((h) => h.trim().replace('#', ''))
      .filter((h) => h.length > 0)
    setEditData({ ...editData, hashtags })
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">Laden...</div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/')}>
            ← Terug
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {channelLabels[post.channel]} Post
            </CardTitle>
            <CardDescription>
              {post.contentItem.title} - {post.contentItem.company.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editData.status}
                onValueChange={(value) => {
                  if (Object.values(PostStatus).includes(value as PostStatus)) {
                    setEditData({ ...editData, status: value as PostStatus })
                  }
                }}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PostStatus) as PostStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editData.content}
                onChange={(e) =>
                  setEditData({ ...editData, content: e.target.value })
                }
                rows={10}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {editData.content.length} karakters
              </p>
            </div>

            <div>
              <Label htmlFor="ctaText">CTA Tekst</Label>
              <Input
                id="ctaText"
                value={editData.ctaText}
                onChange={(e) =>
                  setEditData({ ...editData, ctaText: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="ctaUrl">CTA URL</Label>
              <Input
                id="ctaUrl"
                type="url"
                value={editData.ctaUrl}
                onChange={(e) =>
                  setEditData({ ...editData, ctaUrl: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="hashtags">Hashtags (gescheiden door komma's)</Label>
              <Input
                id="hashtags"
                value={editData.hashtags.map((h) => `#${h}`).join(', ')}
                onChange={(e) => handleHashtagsChange(e.target.value)}
                placeholder="#marketing #business #growth"
              />
            </div>

            {post.scheduledFor && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm">
                  <strong>Gepland voor:</strong>{' '}
                  {new Date(post.scheduledFor).toLocaleString('nl-NL')}
                </p>
              </div>
            )}

            {post.publishedAt && (
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-sm">
                  <strong>Gepubliceerd op:</strong>{' '}
                  {new Date(post.publishedAt).toLocaleString('nl-NL')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

