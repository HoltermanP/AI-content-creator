# Neon Database Setup Instructies

## Stap 1: Neon Database Aanmaken

1. Ga naar [https://neon.tech](https://neon.tech)
2. Maak een account aan of log in
3. Klik op "Create a project"
4. Geef je project een naam (bijv. "AI Content Creator")
5. Kies een regio (bijv. "Europe (Frankfurt)" voor beste performance in Nederland)
6. Klik op "Create project"

## Stap 2: Connection String Ophalen

1. In je Neon dashboard, ga naar je project
2. Klik op "Connection Details" of "Connect"
3. Kopieer de connection string (ziet eruit als):
   ```
   postgresql://username:password@ep-xxxx-xxxx.region.aws.neon.tech/database?sslmode=require
   ```

## Stap 3: Lokaal Configureren

1. Maak een `.env` bestand in de root van je project:
   ```bash
   touch .env
   ```

2. Voeg de volgende variabelen toe:
   ```env
   DATABASE_URL="jouw-neon-connection-string-hier"
   OPENAI_API_KEY="jouw-openai-api-key-hier"
   ```

3. Vervang `jouw-neon-connection-string-hier` met de connection string die je hebt gekopieerd

## Stap 4: Database Schema Aanmaken

Voer de volgende commando's uit:

```bash
# Genereer Prisma Client
npm run db:generate

# Push schema naar Neon database
npm run db:push
```

Of gebruik migrations (aanbevolen voor productie):

```bash
# Genereer Prisma Client
npm run db:generate

# Maak eerste migration
npx prisma migrate dev --name init
```

## Stap 5: Verificatie

Test of de connectie werkt:

```bash
# Open Prisma Studio om je database te bekijken
npm run db:studio
```

Dit opent een web interface op http://localhost:5555 waar je je database kunt bekijken.

## Voor Vercel Deployment

1. Ga naar je Vercel project dashboard
2. Ga naar Settings > Environment Variables
3. Voeg `DATABASE_URL` toe met je Neon connection string
4. Voeg `OPENAI_API_KEY` toe met je OpenAI API key
5. Deploy opnieuw

**Belangrijk**: Zorg dat je de connection string met `?sslmode=require` gebruikt voor veilige verbindingen.

