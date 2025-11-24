'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'

interface ContentItem {
  id: string
  title: string
  content: string
  summary?: string | null
  sourceUrl: string
  company: {
    id: string
    name: string
  }
  product?: {
    id: string
    name: string
  } | null
  socialPosts: Array<{
    id: string
    channel: string
    content: string
    status: string
  }>
}

export default function ContentItemPage() {
  const params = useParams()
  const router = useRouter()
  const [contentItem, setContentItem] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    content: '',
    summary: '',
  })

  useEffect(() => {
    if (params.id) {
      loadContentItem(params.id as string)
    }
  }, [params.id])

  const loadContentItem = async (id: string) => {
    try {
      const response = await fetch(`/api/content/items/${id}`)
      if (!response.ok) {
        alert('Content item niet gevonden')
        router.push('/')
        return
      }
      const data = await response.json()
      setContentItem(data)
      setEditData({
        title: data.title,
        content: data.content,
        summary: data.summary || '',
      })
    } catch (error) {
      console.error('Error loading content item:', error)
      alert('Fout bij laden content item')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!contentItem) return

    setSaving(true)
    try {
      const response = await fetch(`/api/content/items/${contentItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        alert('Fout bij opslaan')
        return
      }

      const updated = await response.json()
      setContentItem(updated)
      setIsEditing(false)
      alert('Opgeslagen!')
    } catch (error) {
      console.error('Error saving content item:', error)
      alert('Fout bij opslaan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">Laden...</div>
      </div>
    )
  }

  if (!contentItem) {
    return null
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/')}>
            ← Terug
          </Button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Bewerken</Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={editData.title}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="summary">Samenvatting</Label>
                  <Textarea
                    id="summary"
                    value={editData.summary}
                    onChange={(e) =>
                      setEditData({ ...editData, summary: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <>
                <CardTitle>{contentItem.title}</CardTitle>
                {contentItem.summary && (
                  <CardDescription>{contentItem.summary}</CardDescription>
                )}
              </>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div>
                <Label htmlFor="content">Content (Markdown)</Label>
                <Textarea
                  id="content"
                  value={editData.content}
                  onChange={(e) =>
                    setEditData({ ...editData, content: e.target.value })
                  }
                  rows={30}
                  className="font-mono text-sm"
                />
              </div>
            ) : (
              <div className="prose max-w-none">
                <ReactMarkdown>{contentItem.content}</ReactMarkdown>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Bedrijf:</strong> {contentItem.company.name}
                </p>
                {contentItem.product && (
                  <p>
                    <strong>Product:</strong> {contentItem.product.name}
                  </p>
                )}
                <p>
                  <strong>Bron:</strong>{' '}
                  <a
                    href={contentItem.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {contentItem.sourceUrl}
                  </a>
                </p>
                <p>
                  <strong>Social Posts:</strong> {contentItem.socialPosts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


