# Fitness Coach App

Coaches log in, set their weekly availability, and share a booking link. Clients chat with an AI intake assistant (Gemini on Vertex AI), then pick a slot. On the dashboard the coach gets an AI pre-session brief for each booking.

## Setup

1. **Database:** paste `supabase/schema.sql` into the Supabase SQL editor and run it. It creates the tables, row-level security, and a `get_booked_times` function so the public booking page never sees other clients' details.
2. **Env vars** (in `.env.local` and on Vercel):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GOOGLE_VERTEX_PROJECT`, plus Google credentials (`GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY`, or `GOOGLE_APPLICATION_CREDENTIALS`)
3. `npm install && npm run dev`, then open http://localhost:3000

## Flow

- `/`: coach login (Supabase auth)
- `/dashboard`: copy your booking link, set working days and hours, view bookings, generate AI briefs
- `/book/<coachId>`: client intake chat, then slot picker

CI (`.github/workflows/ci.yml`) runs `npm run build` on every push, so lint and type errors show up before a Vercel deploy fails.
