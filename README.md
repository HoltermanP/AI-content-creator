# AI Content Creator

Een volledige webapplicatie voor het creëren en automatisch publiceren van zakelijke social media content op basis van bedrijfsinformatie, producten en relevante webpagina's.

## 🚀 Features

- **Bedrijfsbeheer**: Configureer bedrijfsinformatie, doelgroep en brand voice
- **Productbeheer**: Beheer producten en abonnementen die je wilt promoten
- **AI Content Generatie**: 
  - Deep research op basis van URL's
  - Generatie van lange artikelen met trends en actualiteiten
  - Automatische creatie van social media posts voor meerdere kanalen
- **Content Bibliotheek**: Bekijk en bewerk gegenereerde artikelen en posts
- **Scheduler**: Automatische publicatie met configurable frequentie en randomisatie
- **Multi-kanaal Support**: LinkedIn, Instagram, X (Twitter), Facebook, TikTok

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (ontwikkeling) / PostgreSQL (productie)
- **AI**: OpenAI GPT-4 voor content generatie
- **Scheduling**: Custom scheduler met randomisatie

## 📦 Installatie

1. **Clone en installeer dependencies**:
```bash
npm install
```

2. **Configureer environment variabelen**:
```bash
cp .env.example .env
```

Vul in `.env`:
- `DATABASE_URL`: Database connection string (bijv. `file:./dev.db` voor SQLite)
- `OPENAI_API_KEY`: Je OpenAI API key

3. **Setup database**:
```bash
npm run db:generate
npm run db:push
```

4. **Start development server**:
```bash
npm run dev
```

De applicatie is nu beschikbaar op `http://localhost:3000`

## 📖 Gebruik

### 1. Bedrijf Configureren
- Ga naar de "Bedrijf" tab
- Voer bedrijfsinformatie in (naam, beschrijving, industrie, doelgroep, brand voice)
- Sla op

### 2. Producten Toevoegen
- Ga naar de "Producten" tab
- Selecteer een bedrijf
- Voeg producten/abonnementen toe met CTA's en links

### 3. Content Genereren
- Ga naar de "Content Genereren" tab
- Selecteer bedrijf en (optioneel) product
- Voer een relevante URL in
- Selecteer social media kanalen
- Klik op "Genereer Content"

De AI zal:
- De URL scrapen en analyseren
- Deep research uitvoeren (trends, keywords, insights)
- Een lang artikel genereren dat je product/bedrijf positioneert
- Social posts genereren voor alle geselecteerde kanalen

### 4. Content Bekijken en Bewerken
- Ga naar de "Content Bibliotheek" tab
- Selecteer een bedrijf
- Bekijk gegenereerde artikelen en posts
- Bewerk content indien nodig

### 5. Scheduler Configureren
- Ga naar de "Scheduler" tab
- Selecteer een bedrijf
- Activeer kanalen die je automatisch wilt publiceren
- Configureer:
  - Posts per week
  - Randomisatie (voor natuurlijk patroon)
  - Voorkeursdagen en -tijden (optioneel)

## 🔄 Scheduler Setup

De scheduler werkt via een cron job die regelmatig `/api/scheduler/run` aanroept.

### Optie 1: Vercel Cron Jobs (aanbevolen voor productie)
Voeg toe aan `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/scheduler/run",
    "schedule": "*/5 * * * *"
  }]
}
```

### Optie 2: node-cron (lokaal)
Maak een apart script of gebruik een service zoals EasyCron.

### Optie 3: Handmatig Triggeren
Voor testen kun je handmatig POST requests naar `/api/scheduler/run` sturen.

## 🔐 Beveiliging

Voor productie:
1. Voeg `SCHEDULER_API_KEY` toe aan `.env`
2. Configureer authenticatie voor scheduler endpoint
3. Gebruik PostgreSQL in plaats van SQLite
4. Implementeer rate limiting
5. Voeg user authentication toe

## 📝 API Endpoints

### Bedrijven
- `GET /api/companies` - Alle bedrijven
- `POST /api/companies` - Nieuw bedrijf
- `GET /api/companies/[id]` - Specifiek bedrijf
- `PUT /api/companies/[id]` - Update bedrijf
- `DELETE /api/companies/[id]` - Verwijder bedrijf

### Producten
- `GET /api/products?companyId=...` - Producten (optioneel gefilterd)
- `POST /api/products` - Nieuw product
- `GET /api/products/[id]` - Specifiek product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Verwijder product

### Content
- `POST /api/content/generate` - Genereer artikel en posts
- `GET /api/content/items/[id]` - Specifiek content item
- `PUT /api/content/items/[id]` - Update content item
- `POST /api/content/items/[id]` - Genereer extra posts

### Social Posts
- `GET /api/social-posts/[id]` - Specifieke post
- `PUT /api/social-posts/[id]` - Update post
- `DELETE /api/social-posts/[id]` - Verwijder post

### Scheduler
- `GET /api/schedules?companyId=...` - Schedules
- `POST /api/schedules` - Nieuwe schedule
- `PUT /api/schedules/[id]` - Update schedule
- `POST /api/scheduler/schedule` - Plan posts voor content item
- `POST /api/scheduler/run` - Voer scheduler uit (cron)

## 🚧 Toekomstige Uitbreidingen

- [ ] Daadwerkelijke integratie met social media APIs (LinkedIn, Instagram, X)
- [ ] Image generatie voor posts
- [ ] A/B testing voor posts
- [ ] Analytics dashboard
- [ ] Multi-user support met authenticatie
- [ ] Content templates
- [ ] Export functionaliteit
- [ ] Webhook support

## 📄 Licentie

Private project


