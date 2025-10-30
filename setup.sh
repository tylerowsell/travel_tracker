#!/bin/bash
set -e

echo "🚀 Travel Tracker - One-Command Setup"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Copy environment files if they don't exist
echo -e "\n${BLUE}📝 Setting up environment files...${NC}"
if [ ! -f apps/api/.env ]; then
    cp apps/api/.env.example apps/api/.env
    echo -e "${GREEN}✓ Created apps/api/.env${NC}"
else
    echo -e "${YELLOW}⚠ apps/api/.env already exists, skipping${NC}"
fi

if [ ! -f apps/web/.env.local ]; then
    cp apps/web/.env.example apps/web/.env.local
    echo -e "${GREEN}✓ Created apps/web/.env.local${NC}"
else
    echo -e "${YELLOW}⚠ apps/web/.env.local already exists, skipping${NC}"
fi

# Start Docker Compose
echo -e "\n${BLUE}🐳 Starting Docker containers...${NC}"
docker compose up -d --build

# Wait for database to be ready
echo -e "\n${BLUE}⏳ Waiting for database to be ready...${NC}"
until docker compose exec -T db pg_isready -U tracker > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e "\n${GREEN}✓ Database is ready${NC}"

# Wait a bit more for API to be ready
echo -e "\n${BLUE}⏳ Waiting for API service to be ready...${NC}"
sleep 5

# Run database migrations (optional - tables are auto-created by SQLAlchemy)
echo -e "\n${BLUE}🔄 Running database migrations...${NC}"
if docker compose exec -T api alembic upgrade head 2>/dev/null; then
    echo -e "${GREEN}✓ Migrations complete${NC}"
else
    echo -e "${YELLOW}⚠ No migrations found (tables will be auto-created on first API request)${NC}"
fi

# Seed the database
echo -e "\n${BLUE}🌱 Seeding database with sample data...${NC}"
docker compose exec -T api python scripts/seed.py
echo -e "${GREEN}✓ Database seeded${NC}"

# Final message
echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "\n${BLUE}🌐 Access the application:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   API:      ${GREEN}http://localhost:8000${NC}"
echo -e "   API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "\n${BLUE}📝 Useful commands:${NC}"
echo -e "   View logs:        ${YELLOW}docker compose logs -f${NC}"
echo -e "   Stop services:    ${YELLOW}docker compose down${NC}"
echo -e "   Restart services: ${YELLOW}docker compose restart${NC}"
echo ""
