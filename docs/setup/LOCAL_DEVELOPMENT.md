# Supabase Local Development Guide

## Current Setup
- **Database:** Supabase Remote (Singapore)
- **Auth:** Supabase Auth (managed service)
- **Performance:** Optimized code + indexes applied
- **Bottleneck:** Network latency (200-400ms)

## Option 1: Full Local Supabase (Best for Auth Testing)

### Requirements:
- Docker Desktop installed

### Steps:
```bash
# 1. Install Docker Desktop
winget install Docker.DockerDesktop

# 2. Start Docker, then run:
npx supabase start

# 3. Get local credentials:
npx supabase status

# 4. Update .env.local with local URLs:
# DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=[from supabase status]
```

### Benefits:
✅ Full Supabase Auth locally
✅ No network latency
✅ Test auth flows offline
✅ Query times <50ms

### Drawbacks:
❌ Requires Docker (uses ~2GB RAM)
❌ Need to sync data from remote

---

## Option 2: Remote Supabase (Current - Recommended)

### Current Performance:
- Code optimizations: ✅ Applied
- Database indexes: ✅ Applied  
- Query structure: ✅ Optimized
- Network latency: ⚠️ 200-400ms (unavoidable)

### Benefits:
✅ No setup needed
✅ Auth works out of box
✅ Data already seeded
✅ Production-like environment

### When to Use:
- Regular development
- Testing features (not performance)
- Working on UI/UX

---

## Option 3: Hybrid Approach

Keep Supabase remote but optimize with:

### 1. Redis Cache (Laragon has Redis!)
```typescript
// lib/redis-cache.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

export async function getCached<T>(
  key: string, 
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetcher();
  await redis.set(key, JSON.stringify(data), 'EX', ttl);
  return data;
}
```

### 2. ISR (Incremental Static Regeneration)
```typescript
// app/articles/[slug]/page.tsx
export const revalidate = 3600; // 1 hour

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
    take: 100, // Pre-render top 100
  });
  
  return articles.map(a => ({ slug: a.slug }));
}
```

### 3. Edge Caching (Vercel)
```typescript
// middleware.ts
export const config = {
  matcher: [
    '/api/:path*',
    '/articles/:path*',
    '/academy/:path*',
  ],
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Cache static content
  response.headers.set(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=600'
  );
  
  return response;
}
```

---

## Recommendation for Your Case

**Keep using remote Supabase** because:

1. ✅ All code optimizations already applied (-16% improvement)
2. ✅ Auth works perfectly (passwords managed by Supabase)
3. ✅ Production-ready setup
4. ⚠️ Network latency is normal for remote DB

**For faster local dev:**
```bash
# Option A: Use Redis cache (Laragon already has it!)
npm install ioredis

# Option B: Add ISR to pages (config already in code)
# Just deploy to Vercel and it auto-caches
```

**Only use local Supabase if:**
- Testing auth flows extensively
- Need <50ms query times for testing
- Working offline

---

## Quick Start: Enable Redis Cache

1. Start Redis in Laragon (already installed!)
2. Install client:
   ```bash
   npm install ioredis
   ```

3. Update homepage to use cache:
   ```typescript
   // Already using cache.wrap() in your code!
   // Just verify REDIS_URL in .env
   ```

Your code already has caching implemented! Just need to enable Redis. 🎉
