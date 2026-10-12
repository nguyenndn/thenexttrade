---
name: context7
description: Up-to-date documentation and code examples retrieval for modern libraries (Next.js 15, React 19, Tailwind v4, Prisma, Supabase, Recharts, Framer Motion) via Context7.
---

# /context7 — Up-to-Date Library Documentation

## Purpose
Provides the AI assistant with real-time, version-specific documentation and code examples directly from official library docs. Eliminates hallucinations and outdated API usage for fast-moving libraries.

## When to Use
- Implementing features with newer frameworks (Next.js 15 App Router, React 19 Server Actions, Tailwind CSS v4, Prisma 6+).
- Verifying exact method signatures, breaking changes, or deprecation warnings.
- User explicitly specifies `use context7` or `/context7`.

## Available MCP Tools
When the Context7 MCP server is connected, the agent can call:
1. `resolve-library-id`: Searches and resolves the canonical library name/ID (e.g. `nextjs`, `prisma`, `tailwindcss`, `supabase`).
2. `query-docs`: Queries the latest documentation and code examples for that library version.

## CLI Fallback
If MCP is initializing or offline, documentation can also be inspected via:
```bash
npx -y ctx7 query "<library-name>" "<search-topic>"
```

## Best Practices
- Always check the library version matching `package.json` before querying.
- Query targeted topics (e.g. "Next.js 15 Server Actions with revalidatePath" rather than generic "Next.js").
- Incorporate returned official code patterns directly into implementations.
