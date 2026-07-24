# WashDeck Saudi — Vehicle-First Operations & Spa Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)

**WashDeck** is an enterprise vehicle-first operations, customer relationship management (CRM), and revenue retention platform engineered specifically for car wash, auto spa, detailing, and ceramic coating centers in Saudi Arabia and the GCC region.

Unlike generic POS or simple invoicing applications, WashDeck's core philosophy centers around the **Vehicle Passport** — tracking each car's full service history, inspection notes, before/after media, and detailing timeline across all visits.

---

## 🌟 Key Features & Architecture

### 1. Store Header Banner & Store Branding
- **Custom Store Banner**: Upload custom header banner images or logo/store title headers.
- **Visual Identity**: Tailor primary brand colors, branch codes, and store badges.
- **Top Action Bar**: Unified notification center, universal quick search, and multi-branch selectors embedded cleanly below the store banner.

### 2. Visual Vehicle Type Reference Selector
- **Interactive Reference Guides**: Visual selection cards featuring car body-type illustrations, door counts, badges, and descriptions for:
  - **Sedan** (4 doors + rear trunk)
  - **SUV / Crossover** (High roof, 5-7 seats, high ground clearance)
  - **Hatchback** (Compact 2-box design)
  - **Motorcycle / Bike** (2-wheeler)
  - **Luxury / Supercar** (Sports car, exotic, limousine)
- Integrated into **Job Intake Wizards**, **Vehicle Registration Modals**, and **Public Online Booking**.

### 3. Owner Profit & Loss (P&L) & Analyzing Chart
- **Real-Time Financial Metrics**: Instant breakdown of Gross Inflow, Operational Expenses, Net Profit (+/-), and Profit Margin %.
- **Daily Cashflow Chart**: SVG bar chart analyzing daily revenue vs. operational expenses over 7-day and 30-day windows.
- **Expense Logging Ledger**: Categorize operational costs (Supplies, Rent, Salaries, Utilities, Equipment Repairs) with invoice linking.

### 4. Single-Handed Mobile UX & App Movement
- **Thumb-Friendly Controls**: Single-handed Close button positioned at the bottom right of search overlay modals.
- **Edge Swipe Gesture Navigation**: Built-in touch gesture listeners (`SwipeBackProvider`) for edge-swiping right to go back seamlessly on mobile devices.
- **Streamlined Mobile Bottom Bar**: Central floating `+` FAB for instant job card intake without redundant screen buttons.

### 5. Team & Staff Management
- **Role-Based Controls**: Distinct views for Store **Owner**, **Staff / Operator**, and **Super Admin**.
- **Team Hub**: Direct navigation to Staff Members (`/dashboard/staff`), Add New Staff Modal (`?action=add`), and Attendance Logs (`/dashboard/attendance`).

### 6. Universal Spotlight Search (Ctrl+K / Cmd+K)
- Search across registration numbers, customer mobile numbers, customer names, job cards, and actions.
- Text & icon padding protection preventing overflow or overlapping.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15.5 (App Router, Server Components & Route Handlers) |
| **Language** | TypeScript 5.6 |
| **UI & Styling** | TailwindCSS 3.4, Lucide React Icons, Custom SVG Visualizations |
| **Database** | PostgreSQL (Neon Cloud DB) |
| **ORM** | Prisma ORM 6.19.3 |
| **Authentication** | Jose JWT / Role-Aware Session Cookies & Middleware Guards |
| **Mobile App Wrapper** | Expo / React Native WebView with hardware-accelerated gestures |
| **Deployment** | Vercel Serverless CDN |

---

## 📂 Project Directory Structure

```text
WashDeskKod/
├── src/
│   ├── app/                        # Next.js App Router Pages & API Routes
│   │   ├── admin/                  # Super Admin management panel
│   │   ├── api/                    # Serverless API route handlers
│   │   ├── dashboard/              # Store Owner & Staff operations hub
│   │   │   ├── attendance/         # Staff attendance logs
│   │   │   ├── bookings/           # Appointment scheduler
│   │   │   ├── finance/            # Profit & Loss ledger
│   │   │   ├── inventory/          # Detailing supplies inventory
│   │   │   ├── jobs/               # Job card intake & details
│   │   │   ├── queue/              # Live bay queue
│   │   │   ├── settings/           # Store settings & branding
│   │   │   └── staff/              # Team management
│   │   ├── globals.css             # Core design system tokens & styles
│   │   └── layout.tsx              # Main dashboard shell & Store Header
│   ├── components/
│   │   ├── admin/                  # Notification center, customers 360
│   │   ├── brand/                  # WashDeck brand assets
│   │   ├── dashboard/              # VehicleTypeSelector, OwnerProfitLossCard, etc.
│   │   └── layout/                 # MobileBottomNav, AppSidebar, SwipeBackProvider
│   ├── lib/                        # Auth, Prisma client, entitlement & helpers
│   ├── locales/                    # English & Arabic i18n dictionaries
│   ├── repositories/               # Data access layer
│   └── services/                   # Business logic layer
├── prisma/
│   ├── schema.prisma               # Database model schema
│   └── migrations/                 # PostgreSQL database migrations
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL Database**: Neon DB connection string or local PostgreSQL instance

### Setup Instructions

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
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@ep-blue-dawn.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://user:password@ep-blue-dawn.neon.tech/neondb?sslmode=require"
   JWT_SECRET="your-secure-jwt-secret"
   NEXTAUTH_SECRET="your-secure-nextauth-secret"
   ```

4. **Generate Prisma Client & Apply Database Schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Local Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📱 Mobile App Wrapper Integration

The mobile application (`/App`) wraps the Next.js production web application using **React Native WebView**.

- **Instant Cloud Sync**: Any update pushed to the web app automatically reflects inside the mobile app immediately without needing a new APK/IPA build.
- **Hardware Back Handler**: Integrates Android hardware back button listener and iOS edge-swipe gestures.

---

## 🔒 Security & Multi-Tenancy

- **Station Isolation**: All queries pass through `station_id` filters to enforce strict multi-tenant data privacy.
- **Role Guards**: Middleware and service wrappers restrict routes based on `SUPER_ADMIN`, `OWNER`, and `STAFF` roles.
- **Audit Logs**: Critical operational actions (job creation, status transitions, expense edits, password resets) generate immutable audit records.

---

## 📝 License

Proprietary — All rights reserved by WashDeck Saudi Arabia.
