# Kealvi Live Q&A

Next.js 16 + Supabase Q&A app with voting, search, and extended features:

| Feature | Description |
|--------|-------------|
| **Mobile app (PWA)** | Install via “Add to Home Screen”; mobile bottom nav + responsive layout |
| **Interests / categories** | Five categories; follow interests; filter feed |
| **Attachments** | Upload images/PDF/docs (max 5MB) via Supabase Storage |
| **Notifications** | Upvotes on your questions; new posts in followed categories |
| **Pin questions** | Pin/unpin; pinned items sort to the top |
| **Summary / reporting** | `/reports` — totals, category breakdown, top questions |
| **Leaderboard** | `/leaderboard` — contributors ranked by score |

## Setup

1. `npm install`
2. Copy `.env.local.example` → `.env.local` and add Supabase credentials.
3. Run `supabase/schema.sql` in the Supabase SQL Editor (fresh project), **or** `supabase/migrations/002_features.sql` if upgrading an existing DB.
4. Create a **public** Storage bucket named `question-attachments`.
5. `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
