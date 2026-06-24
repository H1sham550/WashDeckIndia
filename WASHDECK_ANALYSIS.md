# WashDeck Planning Analysis

Source documents reviewed:

- `PRISMA_SCHEMA_PLAN.md.pdf`
- `WashDeck Master Build Prompt.pdf`
- `WashDeck MVP Build Roadmap.pdf`
- `WashDeck System Architecture.pdf`
- `WashDeck MVP User Flows.pdf`
- `WashDeck Final Database ERD.pdf`
- `WashDeck MVP Development Plan.pdf`

## Product Thesis

WashDeck is a vehicle-first operations and retention platform for car wash, auto spa, detailing, and ceramic coating businesses.

The product should not feel like generic billing software. The central loop is:

```text
Search vehicle -> Open Vehicle Passport -> Create job card -> Track service -> Generate invoice -> Generate service report -> Collect payment -> Deliver vehicle
```

The signature feature is the Vehicle Passport, generated from operational history rather than stored as a static profile.

## Scope Lock

MVP includes:

- Authentication and station-based multi-tenancy
- Station branding
- Vehicle search and registration
- Vehicle Passport
- Vehicle notes and service timeline
- Services and vehicle-type pricing
- Job cards and operations board
- Inspection notes and before/after photos
- Invoices, payment status, and dynamic UPI QR
- Service report PDFs and shareable links
- Simple WhatsApp share action
- Offers and loyalty tracking
- Revenue recovery dashboard
- Super Admin station/subscription/feature flag management

MVP excludes:

- Inventory
- Attendance/payroll/leave
- Native Android app
- Customer portal
- WhatsApp API automation
- Membership packages
- Multi-branch support
- Advanced analytics/offline mode/AI features

## Architecture Direction

Required stack:

- Next.js 15 App Router
- TypeScript
- TailwindCSS
- ShadCN UI
- Lucide React
- React Hook Form and Zod
- Next.js Route Handlers
- Auth.js / NextAuth
- PostgreSQL on Neon
- Prisma
- Cloudinary
- Vercel

Backend shape:

```text
Route handler -> Service -> Repository -> Prisma
```

Prisma access should stay out of UI components. Every business query must enforce `station_id` filtering and validate authenticated station ownership.

## Data Model Backbone

Core relationship:

```text
Station -> Vehicle -> JobCard -> Invoice -> ServiceReport
```

Important modeling decisions:

- Vehicles are primary; customers are secondary contacts.
- `vehicle_contacts` supports many customers per vehicle and many vehicles per customer.
- Vehicle notes are append-only historical records.
- Job card services store service name and price snapshots.
- Vehicle Passport metrics are calculated from jobs, invoices, offers, notes, and reports.
- One inspection, one invoice, and one service report per job card for MVP.
- Media files live in Cloudinary; database stores URLs only.
- Soft deletes apply to users, customers, vehicles, services, and offers.

## Recommended Build Sequence

The docs agree that this should be built in working slices, not as one big platform drop.

1. Project foundation: Next.js, Tailwind, ShadCN, Prisma, Auth.js, base folders, env setup.
2. Authentication and multi-tenant access control.
3. Station branding.
4. Vehicle management: search by vehicle number/mobile, create vehicle/customer/contact.
5. Vehicle Passport: profile, notes, visit history, calculated metrics.
6. Services management: services, vehicle-type prices, templates.
7. Job cards: create intake, services, inspection notes, before photos, ETA.
8. Operations board and job status workflow.
9. Invoices and payment tracking.
10. Reports and share links.
11. Offers and loyalty progress.
12. Revenue recovery.
13. Super Admin.
14. Hardening: validation, empty states, loading states, mobile polish, security review.

For implementation, each phase should end with a demoable flow, tests where risk justifies them, and a commit.

## UX Priorities

- Mobile-first phone browser experience.
- Operations before analytics.
- Station brand should be prominent; WashDeck branding should be subtle.
- Homepage should become the Operations Center once job tracking exists.
- Optimize the primary flow to complete in under two minutes.
- Staff should have large touch targets and minimal navigation during intake/status updates.

## Key Ambiguities To Discuss

1. Authentication identifier: resolved for station users as Gmail/email OTP login. Car wash admins log in with the Gmail address provided to them and an OTP sent to that mailbox. Password login is not the primary MVP path.
2. Super Admin tenancy: `SUPER_ADMIN` appears in roles, but `users.station_id` is listed as required. Need decide whether platform admins belong to a special station, have nullable `station_id`, or use a separate admin table.
3. WhatsApp scope: resolved as WhatsApp sharing only. MVP should generate a share message/link for the owner/admin to send manually, not use WhatsApp API automation.
4. Report storage: architecture says generate PDF and store/share, but stack only names Cloudinary for images/logos. Need decide whether PDFs also go to Cloudinary or another object store.
5. Revenue recovery timing: MVP should include revenue recovery. Need still decide whether the first implementation is on-demand query based or scheduled through Vercel Cron.
6. Subscription enforcement: expired stations enter read-only mode. Need define exactly which routes are blocked and which remain readable.
7. Feature flags: determine whether flags are enforced in middleware, service layer, UI navigation, or all three.
8. Dynamic UPI QR: need confirm expected UPI payload fields and whether station UPI ID is sufficient for MVP.
9. Retention score and richer Vehicle Passport intelligence are approved directionally. Keep the first version operational and calculated from real history; avoid storing derived metrics.
10. Owner dashboard should include an operations-first layout plus a compact business health strip.
11. Super Admin is required in the MVP, not deferred.

## Confirmed Product Decisions

- Station admins use Gmail/email OTP login.
- WhatsApp support means manual WhatsApp sharing through generated links/messages.
- Vehicle Passport can include richer intelligence, but it should remain generated from operational data.
- Owner dashboard should show operations first, with business health metrics included.
- Loyalty/offers should be part of the MVP.
- Super Admin is required for launch.

## Implementation Notes

- Start from schema only as needed for each phase, but create enough primitives early for auth and station isolation.
- Use generated Prisma enums for roles, statuses, payment methods, offer types, note types, and vehicle types.
- Add repository helpers that require `stationId` as an explicit argument.
- Prefer calculated passport/read-model functions over stored aggregate columns.
- Use audit logs for critical operational events from the start if it is cheap to include.
- Keep WhatsApp as a client-side share URL in MVP.

## First Practical Next Step

Scaffold the Next.js application and implement Phase 0 plus Phase 1:

- Project setup
- Prisma schema foundation
- Auth.js configuration
- Role-aware session typing
- Protected route middleware
- Login screen
- Station ownership guard helpers
- Minimal seed data for one station owner, one staff user, and one super admin

After that, build Station Branding before moving into Vehicle Management.
