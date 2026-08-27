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
- Docker (recommended), or a local MySQL server such as Laragon/XAMPP

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

3. Start the database.

```bash
docker compose up -d
```

If you use Laragon/XAMPP instead, start MySQL manually and adjust
`DATABASE_URL` in the `.env` file.

4. Create a `.env` file in the project root.

```env
DATABASE_URL="mysql://root:@localhost:3306/gopkl"
JWT_SECRET="replace-with-a-strong-secret"
PORT=3000
```

5. Generate the Prisma client, create the schema, and load the seed data.

```bash
npx prisma generate
npx prisma db push
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