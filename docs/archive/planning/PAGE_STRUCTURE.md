# Page Structure & Routes

## 1. Navigation Structure

### Main Header
`Home` | `News` | `Academy` | `Tools` | `Calendar` | `About`

### Sub-Navigation
- **News**: `/articles` (Latest), `/articles?cat=forex` (Forex)
- **Academy**: `/academy` (Home), `/academy/lesson/[slug]` (Learning)
- **Tools**: `/tools/risk-calculator`

---

## 2. Route Schema (App Router)

### Public Routes `(public)`
- `/` - Homepage
- `/articles` - News Feed
- `/articles/[slug]` - Article Detail
- `/academy` - Academy Roadmap ("The Galaxy")
- `/academy/lesson/[slug]` - Lesson Player
- `/calendar` - Economic Calendar

### Authenticated Routes `(dashboard)`
- `/dashboard` - Overview (Cockpit)
- `/dashboard/academy` - Learning Progress
- `/dashboard/journal` - Trading Journal
- `/dashboard/settings` - Profile & Security

### Admin Routes `(admin)`
- `/admin` - Admin Dashboard
- `/admin/articles` - Content Management
- `/admin/courses` - Course Management
- `/admin/users` - User Management

---

## 3. Key Feature Locations

### Trading Journal
- **Path**: `/dashboard/journal`
- **Access**: User Only
- **Features**: Log Trades, View P/L, Analytics

### Academy
- **Path**: `/academy` (Map) & `/academy/lesson/[slug]` (Player)
- **Access**: Public Map / Restricted Lessons (optional)
- **Features**: 5 Phases, Video Player, Quizzes

---
> Updated: Sprint 5
