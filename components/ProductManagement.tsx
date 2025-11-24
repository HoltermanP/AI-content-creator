'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Company {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string
  price?: string | null
  features?: string | null
  ctaText?: string | null
  ctaUrl?: string | null
  company: Company
}

export function ProductManagement() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyId: '',
    name: '',
    description: '',
    price: '',
    features: '',
    ctaText: '',
    ctaUrl: '',
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    if (selectedCompanyId) {
      loadProducts(selectedCompanyId)
      setFormData((prev) => ({ ...prev, companyId: selectedCompanyId }))
    } else {
      loadProducts()
    }
  }, [selectedCompanyId])

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        companyId: selectedProduct.company.id,
        name: selectedProduct.name,
        description: selectedProduct.description,
        price: selectedProduct.price || '',
        features: selectedProduct.features || '',
        ctaText: selectedProduct.ctaText || '',
        ctaUrl: selectedProduct.ctaUrl || '',
      })
      setSelectedCompanyId(selectedProduct.company.id)
    }
  }, [selectedProduct])

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const loadProducts = async (companyId?: string) => {
    try {
      const url = companyId
        ? `/api/products?companyId=${companyId}`
        : '/api/products'
      const response = await fetch(url)
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.companyId) {
      alert('Selecteer eerst een bedrijf')
      return
    }

    setLoading(true)

    try {
      const url = selectedProduct
        ? `/api/products/${selectedProduct.id}`
        : '/api/products'
      const method = selectedProduct ? 'PUT' : 'POST'

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

      await loadProducts(formData.companyId)
      const data = await response.json()
      setSelectedProduct(data)
      alert(selectedProduct ? 'Product bijgewerkt' : 'Product aangemaakt')
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Fout bij opslaan product')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProduct || !confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Fout bij verwijderen')
        return
      }

      await loadProducts(selectedProduct.company.id)
      setSelectedProduct(null)
      setFormData({
        companyId: selectedProduct.company.id,
        name: '',
        description: '',
        price: '',
        features: '',
        ctaText: '',
        ctaUrl: '',
      })
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Fout bij verwijderen product')
    }
  }

  const handleNewProduct = () => {
    setSelectedProduct(null)
    setFormData({
      companyId: selectedCompanyId || '',
      name: '',
      description: '',
      price: '',
      features: '',
      ctaText: '',
      ctaUrl: '',
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Productbeheer</CardTitle>
          <CardDescription>
            Beheer producten en abonnementen die je wilt promoten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="filter-company">Filter op bedrijf</Label>
            <Select
              value={selectedCompanyId || 'all'}
              onValueChange={(value) => setSelectedCompanyId(value === 'all' ? '' : value)}
            >
              <SelectTrigger id="filter-company">
                <SelectValue placeholder="Alle bedrijven" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle bedrijven</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="companyId">Bedrijf *</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) =>
                  setFormData({ ...formData, companyId: value })
                }
                required
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

            <div>
              <Label htmlFor="name">Productnaam *</Label>
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
              <Label htmlFor="description">Beschrijving *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Prijs</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="Bijv. €29/maand, Gratis proefperiode"
              />
            </div>

            <div>
              <Label htmlFor="features">Features (één per regel)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) =>
                  setFormData({ ...formData, features: e.target.value })
                }
                rows={3}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              />
            </div>

            <div>
              <Label htmlFor="ctaText">CTA Tekst</Label>
              <Input
                id="ctaText"
                value={formData.ctaText}
                onChange={(e) =>
                  setFormData({ ...formData, ctaText: e.target.value })
                }
                placeholder="Bijv. Start gratis proefperiode"
              />
            </div>

            <div>
              <Label htmlFor="ctaUrl">CTA URL</Label>
              <Input
                id="ctaUrl"
                type="url"
                value={formData.ctaUrl}
                onChange={(e) =>
                  setFormData({ ...formData, ctaUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {selectedProduct ? 'Bijwerken' : 'Aanmaken'}
              </Button>
              {selectedProduct && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNewProduct}
                  >
                    Nieuw
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Verwijderen
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bestaande Producten</CardTitle>
          <CardDescription>
            {selectedCompanyId
              ? `Producten voor ${companies.find((c) => c.id === selectedCompanyId)?.name || 'geselecteerd bedrijf'}`
              : 'Alle producten'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nog geen producten. Maak er een aan!
              </p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {product.company.name}
                  </div>
                  {product.price && (
                    <div className="text-sm font-medium mt-1">
                      {product.price}
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

