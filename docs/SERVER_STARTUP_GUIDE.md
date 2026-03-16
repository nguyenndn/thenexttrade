# Server Startup Guide

Hướng dẫn chi tiết cách start server TheNextTrade trên các môi trường khác nhau.

---

## 🚀 Quick Reference

| Môi Trường | Command | Database | Performance |
|------------|---------|----------|-------------|
| **Local Development** | `npm run dev:local` | ServBay (localhost) | ⚡ Fast (~100ms) |
| **Production Test** | `npm run dev:prod` | Supabase (remote) | 🌐 Slow (~1200ms) |
| **Production Build** | `npm run build:prod` + `npm start` | Supabase | 🚀 Optimized |
| **Local Build** | `npm run build:local` + `npm start` | ServBay | ⚡ Optimized + Fast |

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Testing](#production-testing)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
```bash
# Check versions
node --version     # Should be 18.x or higher
npm --version      # Should be 9.x or higher
```

### Database Options
- **Local:** ServBay PostgreSQL (port 5432)
- **Remote:** Supabase PostgreSQL

### Optional
- Redis (for caching) - port 6379
- Docker (for containerized deployment)

---

## Local Development

### Option 1: Quick Start (Recommended) ⭐

```bash
# One command - auto switch environment + start
npm run dev:local
```

**What it does:**
1. ✅ Switch to `.env.local` (ServBay database)
2. ✅ Backup current `.env`
3. ✅ Start Next.js dev server on port 3000

**Access:** http://localhost:3000

---

### Option 2: Manual Setup

```bash
# Step 1: Switch environment
npm run env:local

# Step 2: Verify environment
cat .env | Select-String "DATABASE_URL"
# Should show: postgresql://postgres:ServBay.dev@localhost:5432/gsn_crm

# Step 3: Start server
npm run dev
```

---

### Option 3: Custom Port

```bash
# Start on different port
npm run dev:local -- -p 3001

# Or manually
npm run env:local
PORT=3001 npm run dev
```

---

### Local Development Workflow

```bash
# Morning - First start
npm run dev:local

# Code changes...
# Server auto-reloads

# Database changes
npm run db:migrate
npm run db:seed

# Performance testing
npm run perf:test

# Stop server: Ctrl + C
```

---

## Production Testing

### Option 1: Production Environment Locally

```bash
# Start with production database
npm run dev:prod
```

**Use cases:**
- Testing with production data
- Debugging production issues
- Verifying remote database connectivity

**Note:** Slower due to network latency (200-400ms per query)

---

### Option 2: Production Build Locally

```bash
# Build for production
npm run build:prod

# Start production server
npm start

# Access: http://localhost:3000
```

**Differences from dev mode:**
- ✅ Optimized bundle
- ✅ SSR/SSG rendering
- ✅ Production error handling
- ❌ No hot reload
- ❌ Slower restarts

---

## Production Deployment

### Vercel (Recommended) 🌐

#### Option 1: Automatic Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Option 2: GitHub Integration

1. **Connect Repository:**
   - Go to https://vercel.com
   - Import GitHub repository
   - Configure build settings

2. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   REDIS_URL=redis://... (optional)
   SENTRY_DSN=https://... (optional)
   ```

3. **Auto Deploy:**
   - Push to `main` branch → auto deploy
   - Pull requests → preview deployments

**See:** [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

---

### VPS / Cloud Server

#### Ubuntu/Debian Server

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 (Process Manager)
npm install -g pm2

# 3. Clone repository
git clone <repository-url>
cd gsn-crm

# 4. Install dependencies
npm install

# 5. Setup environment
cp .env.production .env
nano .env  # Edit with production values

# 6. Build
npm run build

# 7. Start with PM2
pm2 start npm --name "gsn-crm" -- start

# 8. Setup auto-restart on reboot
pm2 startup
pm2 save

# 9. Monitor
pm2 logs gsn-crm
pm2 status
```

#### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/gsn-crm
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gsn-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Docker Deployment

### Development Mode

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev:local"]
```

```bash
# Build
docker build -f Dockerfile.dev -t gsn-crm:dev .

# Run
docker run -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --name gsn-crm-dev \
  gsn-crm:dev
```

---

### Production Mode

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

```bash
# Build
docker build -t gsn-crm:latest .

# Run
docker run -p 3000:3000 \
  --env-file .env.production \
  --name gsn-crm \
  gsn-crm:latest
```

---

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gsn_crm
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## Environment Variables by Deployment

### Local Development (.env.local)
```env
DATABASE_URL="postgresql://postgres:ServBay.dev@localhost:5432/gsn_crm"
DIRECT_URL="postgresql://postgres:ServBay.dev@localhost:5432/gsn_crm"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
REDIS_URL="redis://localhost:6379"
NODE_ENV="development"
```

### Production (.env.production)
```env
DATABASE_URL="postgresql://postgres.xxx@aws-xxx.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.xxx@aws-xxx.pooler.supabase.com:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
REDIS_URL="redis://username:password@redis-host:6379"
NODE_ENV="production"
SENTRY_DSN="https://xxx@sentry.io/xxx"
```

---

## Troubleshooting

### Issue 1: Port Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
npm run dev:local -- -p 3001
```

---

### Issue 2: Database Connection Failed

```bash
# Check database is running
# For ServBay: Open ServBay GUI
# For Supabase: Check dashboard

# Verify connection string
cat .env | Select-String "DATABASE_URL"

# Test connection
npx prisma db execute --stdin <<< "SELECT 1"
```

---

### Issue 3: Environment Not Switching

```bash
# Manual verification
cat .env

# Force re-switch
npm run env:local
cat .env  # Verify again

# Clear Next.js cache
Remove-Item -Recurse -Force .next
npm run dev:local
```

---

### Issue 4: Build Errors

```bash
# Clear cache
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
npm install

# Type check
npm run type-check

# Try build again
npm run build:local
```

---

### Issue 5: Slow Performance

**Local Dev:**
```bash
# Verify using local database
cat .env | Select-String "DATABASE_URL"
# Should be localhost, not remote

# Switch if needed
npm run dev:local
```

**Production:**
```bash
# Check Redis is running
redis-cli ping

# Enable caching
# Set REDIS_URL in .env

# Check database indexes
npx prisma db execute --stdin <<< "
  SELECT tablename, indexname 
  FROM pg_indexes 
  WHERE schemaname = 'public'
"
```

---

## Monitoring & Logs

### Development

```bash
# Terminal logs (default)
npm run dev:local

# Detailed logs
DEBUG=* npm run dev:local

# Performance testing
npm run perf:test
```

---

### Production (PM2)

```bash
# Real-time logs
pm2 logs gsn-crm

# Last 100 lines
pm2 logs gsn-crm --lines 100

# Error logs only
pm2 logs gsn-crm --err

# Monitor resources
pm2 monit
```

---

### Production (Docker)

```bash
# Container logs
docker logs -f gsn-crm

# Last 100 lines
docker logs --tail 100 gsn-crm

# docker-compose
docker-compose logs -f app
```

---

## Performance Comparison

| Environment | Startup Time | Query Speed | Hot Reload | Build Time |
|-------------|--------------|-------------|------------|------------|
| **Local Dev** | ~5s | ~100ms | ✅ Yes | ~30s |
| **Local Prod** | ~3s | ~100ms | ❌ No | ~2min |
| **Remote Dev** | ~5s | ~1200ms | ✅ Yes | ~30s |
| **Remote Prod** | ~3s | ~1200ms | ❌ No | ~2min |
| **Docker Dev** | ~10s | ~100ms | ✅ Yes | ~1min |
| **Docker Prod** | ~5s | ~100ms | ❌ No | ~3min |

---

## Best Practices

### Development
1. ✅ Always use `npm run dev:local` for daily work
2. ✅ Enable Redis for caching
3. ✅ Use local database (ServBay)
4. ✅ Keep `.env` file backed up
5. ✅ Run `npm run perf:test` periodically

### Production
1. ✅ Use environment variables (never commit `.env`)
2. ✅ Enable error tracking (Sentry)
3. ✅ Setup monitoring (PM2, Vercel Analytics)
4. ✅ Use production build (`npm run build`)
5. ✅ Setup SSL/HTTPS
6. ✅ Regular database backups
7. ✅ Use CDN for static assets

---

## Quick Commands Reference

```bash
# Development
npm run dev:local              # Local dev (recommended)
npm run dev:prod               # Production test
npm run dev                    # Current environment

# Build
npm run build:local            # Build with local env
npm run build:prod             # Build with production env
npm run build                  # Build with current env

# Environment
npm run env:local              # Switch to local
npm run env:prod               # Switch to production

# Database
npm run db:migrate             # Run migrations
npm run db:seed                # Seed data
npx prisma studio              # Open database GUI

# Testing
npm run perf:test              # Performance test
npm test                       # Unit tests
npm run type-check             # TypeScript check

# Production
npm start                      # Start production build
pm2 start npm -- start         # Start with PM2
```

---

## Support

### Issues?
1. Check [Troubleshooting](#troubleshooting) section
2. Verify environment: `cat .env`
3. Check logs for errors
4. Review [docs/README.md](docs/README.md)

### Need Help?
- 📖 [QUICK_START.md](docs/QUICK_START.md) - Quick reference
- ⚙️ [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) - Environment config
- 🚀 [PERFORMANCE_OPTIMIZATION_SPEC.md](docs/performance/PERFORMANCE_OPTIMIZATION_SPEC.md) - Performance tuning

---

**Last Updated:** January 23, 2026  
**Version:** 1.0.0
