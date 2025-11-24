'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Channel } from '@/lib/constants'

interface Company {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  companyId: string
}

export function ContentGenerator() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [topic, setTopic] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([])
  const [contentType, setContentType] = useState<'short' | 'blog'>('short')
  const [focusType, setFocusType] = useState<'product' | 'company'>('product')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    contentItemId: string
    title: string
    summary: string
  } | null>(null)

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    if (selectedCompanyId) {
      loadProducts(selectedCompanyId)
    } else {
      setProducts([])
      setSelectedProductId('')
    }
  }, [selectedCompanyId])

  useEffect(() => {
    // Als product-gericht is geselecteerd maar geen product, switch naar bedrijf-gericht
    if (focusType === 'product' && !selectedProductId) {
      setFocusType('company')
    }
  }, [selectedProductId, focusType])

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const loadProducts = async (companyId: string) => {
    try {
      const response = await fetch(`/api/products?companyId=${companyId}`)
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCompanyId) {
      alert('Selecteer een bedrijf')
      return
    }

    if (selectedChannels.length === 0) {
      alert('Selecteer minimaal 1 kanaal')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          productId: selectedProductId || null,
          topic: topic || null,
          channels: selectedChannels,
          contentType,
          focusType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Fout bij genereren content')
        return
      }

      const data = await response.json()
      setResult(data)
      alert('Content succesvol gegenereerd!')
    } catch (error) {
      console.error('Error generating content:', error)
      alert('Fout bij genereren content')
    } finally {
      setLoading(false)
    }
  }

  const toggleChannel = (channel: Channel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    )
  }

  const channelLabels: Record<Channel, string> = {
    LINKEDIN: 'LinkedIn',
    INSTAGRAM: 'Instagram',
    X_TWITTER: 'X (Twitter)',
    FACEBOOK: 'Facebook',
    TIKTOK: 'TikTok',
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Genereren</CardTitle>
          <CardDescription>
            Genereer een artikel en social media posts op basis van een URL en
            je bedrijfsinformatie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <Label htmlFor="company">Bedrijf *</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
                required
              >
                <SelectTrigger id="company">
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

            <div>
              <Label htmlFor="product">Product (optioneel)</Label>
              <Select
                value={selectedProductId || 'none'}
                onValueChange={(value) => setSelectedProductId(value === 'none' ? '' : value)}
                disabled={!selectedCompanyId || products.length === 0}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Geen product (optioneel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen product</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCompanyId && products.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Geen producten beschikbaar voor dit bedrijf
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="contentType">Content Type *</Label>
              <Select
                value={contentType}
                onValueChange={(value) => setContentType(value as 'short' | 'blog')}
                required
              >
                <SelectTrigger id="contentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Korte Social Posts</SelectItem>
                  <SelectItem value="blog">Uitgebreid Blog + Posts</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {contentType === 'short'
                  ? 'Genereert alleen korte social media posts zonder uitgebreid artikel'
                  : 'Genereert een uitgebreid blog artikel plus social media posts'}
              </p>
            </div>

            <div>
              <Label htmlFor="focusType">Focus *</Label>
              <Select
                value={focusType}
                onValueChange={(value) => setFocusType(value as 'product' | 'company')}
                required
                disabled={!selectedProductId && focusType === 'product'}
              >
                <SelectTrigger id="focusType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product" disabled={!selectedProductId}>
                    Product-gericht
                  </SelectItem>
                  <SelectItem value="company">Bedrijf-gericht</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {focusType === 'product'
                  ? 'Content focust op het geselecteerde product als oplossing'
                  : 'Content focust op het bedrijf als oplossing'}
                {!selectedProductId && focusType === 'product' && (
                  <span className="block text-orange-600 mt-1">
                    Selecteer eerst een product om product-gerichte content te genereren
                  </span>
                )}
              </p>
            </div>

            <div>
              <Label htmlFor="topic">Onderwerp/Trend (optioneel)</Label>
              <Input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Bijv. AI in marketing, duurzaamheid, remote work..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                Optioneel: Specificeer een specifiek onderwerp of trend. Laat leeg om automatisch relevante ontwikkelingen te laten vinden op basis van je bedrijf en product.
              </p>
            </div>

            <div>
              <Label>Social Media Kanalen *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {(Object.keys(Channel) as Channel[]).map((channel) => (
                  <div
                    key={channel}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedChannels.includes(channel)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => toggleChannel(channel)}
                  >
                    <div className="font-medium">
                      {channelLabels[channel]}
                    </div>
                  </div>
                ))}
              </div>
              {selectedChannels.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selecteer minimaal 1 kanaal
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Genereren...' : 'Genereer Content'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {contentType === 'blog' ? 'Gegenereerd Artikel' : 'Gegenereerde Posts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{result.title}</h3>
                <p className="text-muted-foreground mt-2">{result.summary}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = `/content/${result.contentItemId}`
                }}
              >
                {contentType === 'blog' ? 'Bekijk Volledige Content' : 'Bekijk Posts'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

