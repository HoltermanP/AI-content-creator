'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Channel, PostStatus } from '@/lib/constants'

interface ContentItem {
  id: string
  title: string
  summary?: string | null
  sourceUrl: string
  createdAt: string
  company: {
    id: string
    name: string
  }
  product?: {
    id: string
    name: string
  } | null
  socialPosts: SocialPost[]
}

interface SocialPost {
  id: string
  channel: Channel
  content: string
  status: PostStatus
  scheduledFor?: string | null
}

export function ContentLibrary() {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    if (selectedCompanyId) {
      loadContentItems(selectedCompanyId)
    } else {
      setContentItems([])
    }
  }, [selectedCompanyId])

  useEffect(() => {
    if (selectedItem) {
      loadContentItemDetails(selectedItem.id)
    }
  }, [selectedItem])

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const loadContentItems = async (companyId: string) => {
    try {
      const company = await fetch(`/api/companies/${companyId}`)
      const companyData = await company.json()
      setContentItems(companyData.contentItems || [])
    } catch (error) {
      console.error('Error loading content items:', error)
    }
  }

  const loadContentItemDetails = async (contentItemId: string) => {
    try {
      const response = await fetch(`/api/content/items/${contentItemId}`)
      const data = await response.json()
      setSelectedItem(data)
    } catch (error) {
      console.error('Error loading content item details:', error)
    }
  }

  const channelLabels: Record<Channel, string> = {
    LINKEDIN: 'LinkedIn',
    INSTAGRAM: 'Instagram',
    X_TWITTER: 'X',
    FACEBOOK: 'Facebook',
    TIKTOK: 'TikTok',
  }

  const statusLabels: Record<PostStatus, string> = {
    DRAFT: 'Concept',
    SCHEDULED: 'Gepland',
    PUBLISHED: 'Gepubliceerd',
    FAILED: 'Mislukt',
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Content Bibliotheek</CardTitle>
          <CardDescription>
            Bekijk en beheer gegenereerde artikelen en posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer bedrijf" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {contentItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {selectedCompanyId
                  ? 'Geen content items gevonden'
                  : 'Selecteer een bedrijf om content te bekijken'}
              </p>
            ) : (
              contentItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedItem?.id === item.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.socialPosts.length} posts
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedItem ? selectedItem.title : 'Selecteer Content Item'}
          </CardTitle>
          <CardDescription>
            {selectedItem && (
              <a
                href={selectedItem.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Bron: {selectedItem.sourceUrl}
              </a>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedItem ? (
            <div className="space-y-4">
              {selectedItem.summary && (
                <div>
                  <h4 className="font-semibold mb-2">Samenvatting</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.summary}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Social Posts</h4>
                <div className="space-y-3">
                  {selectedItem.socialPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Geen posts beschikbaar
                    </p>
                  ) : (
                    selectedItem.socialPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-3 rounded-md border bg-muted/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {channelLabels[post.channel]}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              post.status === PostStatus.PUBLISHED
                                ? 'bg-green-100 text-green-800'
                                : post.status === PostStatus.SCHEDULED
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {statusLabels[post.status]}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {post.content.substring(0, 200)}
                          {post.content.length > 200 && '...'}
                        </p>
                        {post.scheduledFor && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Gepland voor:{' '}
                            {new Date(post.scheduledFor).toLocaleString('nl-NL')}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            window.location.href = `/posts/${post.id}`
                          }}
                        >
                          Bewerken
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.href = `/content/${selectedItem.id}`
                }}
              >
                Volledig Artikel Bekijken
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecteer een content item om details te bekijken
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

