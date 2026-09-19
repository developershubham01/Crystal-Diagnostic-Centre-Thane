# Crystal Diagnostic Centre — Thane

A modern, high-performance web platform for **Crystal Diagnostic Centre**, located at Uthalsar Naka, Thane West. Designed for precision, accessibility, and ease of use for patients and healthcare administrators.

---

## Key Features

- **Comprehensive Service Catalog**: Detailed diagnostic test listings with turnaround times, sample requirements, and patient preparation guidelines.
- **Preventive Health Packages**: Curated wellness packages with interactive test breakdowns and instant booking capabilities.
- **Online Appointment Requests**: Fast online booking with home collection request options, date validation, and immediate reference code generation.
- **Request Tracking**: Real-time tracking of appointment status using unique reference codes (e.g. `CDC-7K2M9Q`) and mobile verification.
- **Patient Reports Portal**: Information portal and secure access guidance for laboratory test results.
- **Admin Management Dashboard**: Fully functional management suite for updating services, health packages, appointments, site settings, FAQs, and audit logs.
- **Responsive Dark Aesthetic**: High-contrast, accessibility-focused user interface.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Library**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) / Radix Primitives
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with [SQLite](https://www.sqlite.org/)
- **Icons & Animation**: [Lucide React](https://lucide.dev/) & [Framer Motion](https://framer.com/motion)

---

## Getting Started

### Prerequisites

- **Node.js**: v18.x or later
- **npm**: v9.x or later

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/crystal-diagnostic-centre.git
   cd crystal-diagnostic-centre
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Initialize Database**:
   Generate Prisma client and push database schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

- `npm run dev`: Starts the Next.js development server on port 3000.
- `npm run build`: Compiles TypeScript, runs Next.js production build, and copies standalone assets.
- `npm start`: Starts the production server using the Next.js build.
- `npm run lint`: Runs ESLint to verify code quality.
- `npm run db:generate`: Generates Prisma Client types.
- `npm run db:push`: Applies database schema changes.

---

## Project Structure

```text
├── prisma/               # Database schema & migrations
├── public/               # Static assets & public images
├── scripts/              # Build helper scripts
├── src/
│   ├── app/              # Next.js App Router pages & API routes
│   │   ├── api/          # REST API endpoints (appointments, services, packages, admin)
│   │   └── [[...slug]]/  # Catch-all client routing handler
│   ├── components/       # UI components (pages, brand, admin, site controls)
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Database client, auth, utilities & Zustand stores
├── .env.example          # Environment variables template
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

---

## Contact & Location

**Crystal Diagnostic Centre**  
1 & 2, Shrikrishna Bhavan CHS, Opp. Varad Hospital, Uthalsar Naka, Thane West, Maharashtra 400601  
**Phone**: +91 88283 93955  
**Email**: info@crystaldiagnosticcentre.com  
