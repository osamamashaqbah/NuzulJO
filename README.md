# NuzulJO

Hotel booking platform for the Jordanian market — connects customers directly with small/independent hotels (replacing phone/WhatsApp booking) with three roles: Customer, Hotel Owner, Admin.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS, React Three Fiber / Three.js / drei, Framer Motion, GSAP
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (access + refresh tokens, httpOnly cookies)
- **Uploads**: Multer (+ sharp compression)
- **Email**: Nodemailer (Gmail SMTP)
- **PDF**: pdfkit
- **Maps**: Leaflet + OpenStreetMap tiles
- **Seed data**: real Jordanian hotels pulled from OpenStreetMap Overpass API

All tools/services used are free (open-source or free-tier, no card required).

## Structure

```
frontend/   React + Vite + TS client
backend/    Express + TS API + Prisma schema
```

## Status

Phase 1 in progress: repo + project scaffolding.
