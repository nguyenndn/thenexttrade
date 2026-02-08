# Authentication System

## Overview
Authentication is handled by **Supabase Auth**, providing secure email/password login and OAuth providers (Google). User sessions are managed via JWTs stored in secure HTTP-only cookies.

## Features

### 1. Sign Up / Sign In
- **Email/Password**: Standard flow with email verification (optional in dev).
- **OAuth**: Google Login integration.
- **Onboarding**: New users are redirected to an onboarding flow to set up their `Profile` (username, bio).

### 2. Role-Based Access Control (RBAC)
We differentiate users by `role` stored in the `Profile` model.

| Role | Access Level |
|------|--------------|
| `USER` | Default. Access to Dashboard, Journal, Academy. |
| `ADMIN` | Full access. Can access `/admin` to manage users and content. |

### 3. Protected Routes
Next.js Middleware (`middleware.ts`) protects routes:
- `/dashboard/*`: Requires valid session. Redirects to `/auth/login` if missing.
- `/admin/*`: Requires valid session AND `role === 'ADMIN'`.

## Implementation Details
- **Client Side**: `useAuth` hook uses Supabase Client SDK to check session state.
- **Server Side**: `createClient` (server component) reads cookies to validate session in API routes and Server Actions.
