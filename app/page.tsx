'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompanySetup } from '@/components/CompanySetup'
import { ProductManagement } from '@/components/ProductManagement'
import { ContentGenerator } from '@/components/ContentGenerator'
import { ContentLibrary } from '@/components/ContentLibrary'
import { SchedulerSettings } from '@/components/SchedulerSettings'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Content Creator</h1>
          <p className="text-muted-foreground">
            Creëer en publiceer zakelijke social media content automatisch
          </p>
        </div>

        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="company">Bedrijf</TabsTrigger>
            <TabsTrigger value="products">Producten</TabsTrigger>
            <TabsTrigger value="generate">Content Genereren</TabsTrigger>
            <TabsTrigger value="library">Content Bibliotheek</TabsTrigger>
            <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-6">
            <CompanySetup />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="generate" className="mt-6">
            <ContentGenerator />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <ContentLibrary />
          </TabsContent>

          <TabsContent value="scheduler" className="mt-6">
            <SchedulerSettings />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
