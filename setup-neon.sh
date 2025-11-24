#!/bin/bash

echo "🚀 Neon Database Setup"
echo ""
echo "Stap 1: Maak een Neon database aan op https://neon.tech"
echo "Stap 2: Kopieer je connection string"
echo ""
read -p "Plak hier je Neon connection string: " DATABASE_URL

# Maak .env bestand
cat > .env << ENVEOF
DATABASE_URL="${DATABASE_URL}"
OPENAI_API_KEY=""
ENVEOF

echo ""
echo "✅ .env bestand aangemaakt!"
echo ""
echo "⚠️  Vergeet niet om je OPENAI_API_KEY toe te voegen aan .env"
echo ""
read -p "Wil je nu het database schema aanmaken? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "📦 Genereer Prisma Client..."
    npm run db:generate
    
    echo ""
    echo "🗄️  Push schema naar database..."
    npm run db:push
    
    echo ""
    echo "✅ Database setup voltooid!"
fi
