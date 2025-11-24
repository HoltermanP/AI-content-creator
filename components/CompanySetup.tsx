'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Company {
  id: string
  name: string
  description?: string | null
  website?: string | null
  industry?: string | null
  targetAudience?: string | null
  brandVoice?: string | null
}

export function CompanySetup() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
    targetAudience: '',
    brandVoice: '',
  })

  // Laad bedrijven bij mount
  useEffect(() => {
    loadCompanies()
  }, [])

  // Update form data wanneer company geselecteerd wordt
  useEffect(() => {
    if (selectedCompany) {
      setFormData({
        name: selectedCompany.name || '',
        description: selectedCompany.description || '',
        website: selectedCompany.website || '',
        industry: selectedCompany.industry || '',
        targetAudience: selectedCompany.targetAudience || '',
        brandVoice: selectedCompany.brandVoice || '',
      })
    }
  }, [selectedCompany])

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setCompanies(data)
      if (data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0])
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = selectedCompany
        ? `/api/companies/${selectedCompany.id}`
        : '/api/companies'
      const method = selectedCompany ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Fout bij opslaan')
        return
      }

      await loadCompanies()
      const data = await response.json()
      setSelectedCompany(data)
      alert(selectedCompany ? 'Bedrijf bijgewerkt' : 'Bedrijf aangemaakt')
    } catch (error) {
      console.error('Error saving company:', error)
      alert('Fout bij opslaan bedrijf')
    } finally {
      setLoading(false)
    }
  }

  const handleNewCompany = () => {
    setSelectedCompany(null)
    setFormData({
      name: '',
      description: '',
      website: '',
      industry: '',
      targetAudience: '',
      brandVoice: '',
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Bedrijfsinformatie</CardTitle>
          <CardDescription>
            Configureer je bedrijfsgegevens voor content generatie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Bedrijfsnaam *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="industry">Industrie</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                placeholder="Bijv. SaaS, E-commerce, Consultancy"
              />
            </div>

            <div>
              <Label htmlFor="targetAudience">Doelgroep</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value })
                }
                placeholder="Bijv. MKB ondernemers, Marketing managers"
              />
            </div>

            <div>
              <Label htmlFor="brandVoice">Brand Voice / Tone</Label>
              <Textarea
                id="brandVoice"
                value={formData.brandVoice}
                onChange={(e) =>
                  setFormData({ ...formData, brandVoice: e.target.value })
                }
                rows={2}
                placeholder="Bijv. Professioneel maar toegankelijk, vriendelijk, autoritair"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {selectedCompany ? 'Bijwerken' : 'Aanmaken'}
              </Button>
              {selectedCompany && (
                <Button type="button" variant="outline" onClick={handleNewCompany}>
                  Nieuw Bedrijf
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bestaande Bedrijven</CardTitle>
          <CardDescription>Selecteer een bedrijf om te bewerken</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nog geen bedrijven. Maak er een aan!
              </p>
            ) : (
              companies.map((company) => (
                <div
                  key={company.id}
                  className={`p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedCompany?.id === company.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedCompany(company)}
                >
                  <div className="font-medium">{company.name}</div>
                  {company.industry && (
                    <div className="text-sm text-muted-foreground">
                      {company.industry}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


