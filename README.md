# WashDeck Saudi — Vehicle-First Operations, Detailing & Expense Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

**WashDeck** is an enterprise vehicle-first operations platform, customer relationship management (CRM) suite, and financial cash-flow intelligence system engineered specifically for car washes, auto spas, detailing centers, and ceramic coating studios in Saudi Arabia and the GCC region.

Unlike generic point-of-sale (POS) systems, WashDeck places the **Vehicle Passport** at the core — tracking every car's full service history, inspection notes, before/after media, and detailing timeline across all station visits.

---

## 🌟 Core Features & Modules

### 1. Expense Tracker & Cash Flow System
- **Real-Time Cash Flow Metrics**: Monitor Gross Cash Inflow (paid service invoices), Cash Outflow (operational expenses), Net Cash Flow / Profit (Loss), Profit Margin %, and Expense Ratio %.
- **Category Spending Distribution**: Interactive category breakdown cards with percentage bars for *Supplies & Chemicals*, *Utilities*, *Rent & Lease*, *Staff Salaries*, *Marketing*, *Equipment Repairs*, and *Miscellaneous*.
- **Interactive Dual Trend Chart**: Responsive SVG graph analyzing daily revenue inflows versus operational expense outflows over 7-day and 30-day windows.
- **Unified Ledger & CRUD Dialogs**: Full transaction ledger with instant search, date range selectors (Today, 7D, 30D, All Time, Custom), type filters, payment method badges, and real-time expense creation/edit dialogs with audit logging.

### 2. 1-Handed Mobile Navigation & Bottom Bar
- **Operational Bottom Bar**: Optimized 5-item mobile bottom navigation bar featuring **Dashboard**, **Customers**, **Expenses** (Expense Tracker), central **+ (New Job Card)** intake button, and **Menu**.
- **Operations Slide-Up Drawer**: Access live **Queue Management** and **Bookings** inside the slide-up store navigation drawer.
- **Touch Gestures & RTL**: Built-in edge-swipe right gesture support (`SwipeBackProvider`) and automatic Right-to-Left (RTL) orientation for Saudi Arabia stations.

### 3. Store Branding & Header Customization
- **Branding Suite**: Upload custom square logos, horizontal header banners, invoice logos, and set primary brand color accents across all station panels.
- **Top Utility Header**: Multi-branch station switcher, universal spotlight search (`Ctrl+K` / `Cmd+K`), and notification popover center.

### 4. Visual Vehicle Type Reference Selector
- **Interactive 2D Reference Cards**: Visual vehicle selection cards featuring body-type illustrations, door counts, badges, and descriptions for:
  - **Sedan** (4 doors + trunk)
  - **SUV / Crossover** (High roof, 5-7 seats)
  - **Hatchback** (Compact 2-box design)
  - **Motorcycle / Bike** (2-wheeler)
  - **Luxury / Supercar** (Exotic, sports car)
- Embedded in **Job Card Intake Wizard**, **Vehicle Registration Modals**, and **Public Online Booking**.

### 5. Multi-Tenant Role & Subscription Controls
- **Role Hierarchy**: Strict role separation between **Super Admin**, **Store Owner**, and **Front Desk Staff**.
- **Feature Flags & Entitlements**: Plan-based feature access (Offers & Loyalty, Revenue Recovery, Analytics, Staff Management, Custom Branding).
- **Super Admin Portal**: Platform-wide metrics (MRR/ARR), customer 360-degree view, subscription plan switcher, and station impersonation.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15.5 (App Router, Server Components & Server Actions) |
| **Language** | TypeScript 5.6 |
| **Styling** | TailwindCSS 3.4, Lucide React Icons, Custom SVG Visualizations |
| **Database** | PostgreSQL (Neon Serverless Cloud DB) |
| **ORM** | Prisma ORM 6.19.3 |
| **Security & Auth** | Jose JWT, Role-Aware Session Cookies, In-Memory Rate Limiting |
| **Storage Provider** | Extensible Disk & Cloud Storage Provider (`LocalOrCloudStorageProvider`) |
| **Deployment** | Vercel Serverless Platform |

---

## 📂 Repository Structure

```text
WashDeskKod/
├── src/
│   ├── app/                        # App Router Pages & API Routes
│   │   ├── admin/                  # Super Admin management portal
│   │   ├── api/                    # Serverless API endpoints (Auth, Expenses, Vehicles, Jobs)
│   │   ├── dashboard/              # Store Owner & Staff operational dashboard
│   │   │   ├── attendance/         # Staff attendance logs
│   │   │   ├── bookings/           # Appointment scheduler
│   │   │   ├── finance/            # Expense Tracker & Cash Flow
│   │   │   ├── inventory/          # Detailing inventory management
│   │   │   ├── jobs/               # Job card intake wizard & details
│   │   │   ├── queue/              # Live bay queue
│   │   │   ├── settings/           # Store settings & custom branding
│   │   │   └── staff/              # Team management
│   │   ├── globals.css             # Design tokens & core styles
│   │   └── layout.tsx              # Root app layout
│   ├── components/
│   │   ├── admin/                  # Customer 360 view, plan switcher, notification center
│   │   ├── brand/                  # Official WashDeck logos & marks
│   │   ├── dashboard/              # FinancePanel, OwnerProfitLossCard, VehicleTypeSelector, etc.
│   │   ├── layout/                 # MobileBottomNav, AppSidebar, SwipeBackProvider
│   │   └── ui/                     # Reusable UI primitives
│   ├── lib/                        # Auth, Prisma client, Rate Limiter, Storage, Entitlements
│   ├── repositories/               # Data access layer
│   └── services/                   # Business logic layer
├── prisma/
│   ├── schema.prisma               # Database model schema
│   └── migrations/                 # PostgreSQL database migrations
└── package.json
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Neon DB connection string or local PostgreSQL server

### Step-by-Step Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Athulkvs04/WashDeskKod.git
   cd WashDeskKod
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   DATABASE_URL="postgresql://user:password@host:port/neondb?sslmode=require"
   DIRECT_URL="postgresql://user:password@host:port/neondb?sslmode=require"
   SESSION_SECRET="your-long-random-secret-key"
   APP_URL="http://localhost:3000"
   ```

4. **Generate Prisma Client & Apply Database Schema**:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Access the dashboard at [http://localhost:3000](http://localhost:3000).

6. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🛡️ Security & Multi-Tenancy

- **Tenant Data Isolation**: Every operational query enforces station-level filtering (`where: { stationId }`).
- **Production Session Guards**: Next.js middleware and `session.ts` enforce `SESSION_SECRET` configuration in production mode.
- **API Rate Limiting**: In-memory rate limiting applied to sensitive endpoints (`/api/auth/login`, `/api/public/book`).
- **Immutable Audit Trails**: Actions like job creation, expense edits, password resets, and plan modifications generate structured `AuditLog` records.

---

## 📝 License

Proprietary — All rights reserved by WashDeck Saudi Arabia.
