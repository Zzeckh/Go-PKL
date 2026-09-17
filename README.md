# Go-PKL

Go-PKL is a full-stack portal for managing student internships (PKL).
It supports five roles: Student, Teacher, Mentor, Hubin, and Super Admin,
with GPS-based attendance, logbook verification, permission requests,
company mapping with geofencing, and final grading.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Leaflet
- Backend: Node.js, Express, JWT
- Database: SQL via Prisma ORM

## Prerequisites

- Node.js 18 or newer
- npm or pnpm
- A Supabase project (PostgreSQL). The `DATABASE_URL` in `.env` must point to
  Supabase (session/direct connection, port 5432) as documented in `.env.example`.

> Note: local MySQL via `docker-compose.yml` (and Laragon/XAMPP) is optional and
> effectively retired — the backend now targets Supabase PostgreSQL.

## Installation

1. Clone the repository and enter the project folder.

```bash
git clone <repository-url>
cd gopkl
```

2. Install dependencies.

```bash
npm install
# or: pnpm install
```

3. Point the backend at your Supabase database (see `.env.example` for the
   two supported URL forms). Local MySQL via `docker compose up -d` is no
   longer required.

4. Create a `.env` file in the project root.

```env
DATABASE_URL="postgresql://postgres.REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="replace-with-a-strong-secret"
PORT=3000
```

5. Generate the Prisma client, apply migrations, and load the seed data.

```bash
npx prisma generate
npx prisma migrate dev
node prisma/seed.js
```

6. Run the backend and frontend in two separate terminals.

```bash
# Terminal 1 (backend)
node server.js

# Terminal 2 (frontend)
npm run dev
```

7. Open http://localhost:5173 in your browser.

## Default Accounts

The seed script creates one account for each role
(Student, Teacher, Mentor, Hubin, Super Admin).
See `prisma/seed.js` for the email addresses and passwords.

## Notes

- Permission attachments are stored in `uploads/permissions`.
- Map and geofencing features require an internet connection
  (map tiles and address search).