-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'SERVICE_COMPLETED', 'PAYMENT_PENDING', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CONVERTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'BANK', 'ONLINE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'HATCHBACK', 'SEDAN', 'SUV', 'LUXURY');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('ALL_VEHICLES', 'SELECTED_VEHICLES', 'FIRST_N_VEHICLES', 'SERVICE_BASED', 'VEHICLE_TYPE_BASED');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('GENERAL', 'WARNING', 'PREFERENCE', 'VIP');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SUPPLIES', 'UTILITIES', 'RENT', 'SALARIES', 'MARKETING', 'REPAIRS', 'OTHER');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "currencyFormat" TEXT NOT NULL,
    "phonePrefix" TEXT NOT NULL,
    "defaultLocale" TEXT NOT NULL,
    "supportedLocales" TEXT[],
    "isRTL" BOOLEAN NOT NULL DEFAULT false,
    "dateFormat" TEXT NOT NULL,
    "timeFormat" TEXT NOT NULL,
    "decimalSeparator" TEXT NOT NULL DEFAULT '.',
    "thousandsSeparator" TEXT NOT NULL DEFAULT ',',
    "measurementSystem" TEXT NOT NULL DEFAULT 'metric',
    "vehicleRegistrationFormat" TEXT,
    "currencySymbolPosition" TEXT NOT NULL DEFAULT 'left',
    "firstDayOfWeek" INTEGER NOT NULL DEFAULT 1,
    "weekendDays" INTEGER[] DEFAULT ARRAY[0, 6]::INTEGER[],
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "taxName" TEXT NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultServicesJson" JSONB NOT NULL,
    "defaultSettingsJson" JSONB NOT NULL,

    CONSTRAINT "business_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "countryId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "businessTemplateId" TEXT,
    "branchCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "StationStatus" NOT NULL DEFAULT 'TRIAL',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station_branding" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "squareLogoUrl" TEXT,
    "horizontalLogoUrl" TEXT,
    "invoiceLogoUrl" TEXT,
    "emailLogoUrl" TEXT,
    "faviconUrl" TEXT,
    "bookingCoverUrl" TEXT,
    "primaryColor" TEXT,
    "themeMode" TEXT DEFAULT 'light',
    "defaultInvoiceTheme" TEXT DEFAULT 'standard',
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "businessAddress" TEXT,
    "websiteUrl" TEXT,
    "bookingDomain" TEXT,
    "customDomain" TEXT,
    "emailSenderName" TEXT,

    CONSTRAINT "station_branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station_settings" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "queueDisplayPreferencesJson" JSONB,
    "defaultDashboardLayout" TEXT,
    "bookingLeadTime" INTEGER,
    "maxDailyBookings" INTEGER,
    "autoJobNumberFormat" TEXT,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-',
    "defaultCurrencyOverride" TEXT,
    "timezoneOverride" TEXT,
    "cameraQualityPreference" TEXT,
    "imageCompressionQuality" INTEGER,
    "businessHoursJson" JSONB,
    "workingDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6]::INTEGER[],
    "photoRequirementsJson" JSONB,
    "offlineModeSettingsJson" JSONB,
    "notificationPreferencesJson" JSONB,

    CONSTRAINT "station_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "staffLimit" INTEGER NOT NULL DEFAULT 1,
    "reportLimit" INTEGER NOT NULL DEFAULT 10,
    "description" TEXT,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station_subscriptions" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "grace_until" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "station_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station_feature_overrides" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "station_feature_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "stationId" TEXT,
    "role" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isTempPassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'SEDAN',
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_contacts" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT DEFAULT 'Owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_notes" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "NoteType" NOT NULL DEFAULT 'GENERAL',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_prices" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_templates" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_template_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleType" TEXT DEFAULT 'SEDAN',
    "serviceName" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "convertedToJobCardId" TEXT,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_cards" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'RECEIVED',
    "cancellationReason" TEXT,
    "cancellationNotes" TEXT,
    "expectedCompletionTime" TIMESTAMP(3),
    "photoBypassReason" TEXT,
    "photoBypassedById" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_card_services" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceNameSnapshot" TEXT NOT NULL,
    "priceSnapshot" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_card_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_photos" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayName" TEXT,
    "transactionRef" TEXT,
    "gatewayResponse" JSONB,
    "refundStatus" TEXT,
    "paymentTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_reports" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "secureSlug" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "OfferType" NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "rewardDescription" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rulesJson" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_vehicles" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_offer_progress" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "rewardEarned" BOOLEAN NOT NULL DEFAULT false,
    "rewardRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_offer_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'LOW',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Supplies',
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'Liters',
    "minThreshold" DECIMAL(10,2) NOT NULL DEFAULT 5,
    "costPerUnit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "lastRestocked" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "stationId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE INDEX "regions_countryId_idx" ON "regions"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "stations_branchCode_key" ON "stations"("branchCode");

-- CreateIndex
CREATE UNIQUE INDEX "stations_slug_key" ON "stations"("slug");

-- CreateIndex
CREATE INDEX "stations_organizationId_idx" ON "stations"("organizationId");

-- CreateIndex
CREATE INDEX "stations_countryId_idx" ON "stations"("countryId");

-- CreateIndex
CREATE INDEX "stations_regionId_idx" ON "stations"("regionId");

-- CreateIndex
CREATE INDEX "stations_status_idx" ON "stations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "station_branding_stationId_key" ON "station_branding"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "station_settings_stationId_key" ON "station_settings"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_planId_featureKey_key" ON "plan_features"("planId", "featureKey");

-- CreateIndex
CREATE INDEX "station_subscriptions_stationId_idx" ON "station_subscriptions"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "station_feature_overrides_stationId_featureKey_key" ON "station_feature_overrides"("stationId", "featureKey");

-- CreateIndex
CREATE INDEX "users_stationId_idx" ON "users"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "users_stationId_email_key" ON "users"("stationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stationId_username_key" ON "users"("stationId", "username");

-- CreateIndex
CREATE INDEX "otp_tokens_email_idx" ON "otp_tokens"("email");

-- CreateIndex
CREATE INDEX "otp_tokens_expiresAt_idx" ON "otp_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "customers_stationId_createdAt_idx" ON "customers"("stationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "customers_stationId_mobile_key" ON "customers"("stationId", "mobile");

-- CreateIndex
CREATE INDEX "vehicles_stationId_vehicleNumber_idx" ON "vehicles"("stationId", "vehicleNumber");

-- CreateIndex
CREATE INDEX "vehicles_vehicleNumber_idx" ON "vehicles"("vehicleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_stationId_vehicleNumber_key" ON "vehicles"("stationId", "vehicleNumber");

-- CreateIndex
CREATE INDEX "vehicle_contacts_vehicleId_idx" ON "vehicle_contacts"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_contacts_customerId_idx" ON "vehicle_contacts"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_contacts_vehicleId_customerId_key" ON "vehicle_contacts"("vehicleId", "customerId");

-- CreateIndex
CREATE INDEX "vehicle_notes_vehicleId_idx" ON "vehicle_notes"("vehicleId");

-- CreateIndex
CREATE INDEX "services_stationId_idx" ON "services"("stationId");

-- CreateIndex
CREATE INDEX "service_prices_serviceId_idx" ON "service_prices"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "service_prices_serviceId_vehicleType_key" ON "service_prices"("serviceId", "vehicleType");

-- CreateIndex
CREATE INDEX "service_templates_stationId_idx" ON "service_templates"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "service_template_items_templateId_serviceId_key" ON "service_template_items"("templateId", "serviceId");

-- CreateIndex
CREATE INDEX "bookings_stationId_scheduledAt_status_idx" ON "bookings"("stationId", "scheduledAt", "status");

-- CreateIndex
CREATE INDEX "job_cards_stationId_status_createdAt_idx" ON "job_cards"("stationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "job_cards_vehicleId_idx" ON "job_cards"("vehicleId");

-- CreateIndex
CREATE INDEX "job_cards_customerId_idx" ON "job_cards"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "inspections_jobCardId_key" ON "inspections"("jobCardId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_jobCardId_key" ON "invoices"("jobCardId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_stationId_status_createdAt_idx" ON "invoices"("stationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "service_reports_jobCardId_key" ON "service_reports"("jobCardId");

-- CreateIndex
CREATE UNIQUE INDEX "service_reports_secureSlug_key" ON "service_reports"("secureSlug");

-- CreateIndex
CREATE INDEX "offers_stationId_idx" ON "offers"("stationId");

-- CreateIndex
CREATE INDEX "offers_isActive_idx" ON "offers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "offer_vehicles_offerId_vehicleId_key" ON "offer_vehicles"("offerId", "vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_offer_progress_vehicleId_idx" ON "vehicle_offer_progress"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_offer_progress_vehicleId_offerId_key" ON "vehicle_offer_progress"("vehicleId", "offerId");

-- CreateIndex
CREATE INDEX "notifications_stationId_isRead_createdAt_idx" ON "notifications"("stationId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "expenses_stationId_idx" ON "expenses"("stationId");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "attendance_logs_stationId_date_idx" ON "attendance_logs"("stationId", "date");

-- CreateIndex
CREATE INDEX "attendance_logs_staffId_idx" ON "attendance_logs"("staffId");

-- CreateIndex
CREATE INDEX "inventory_items_stationId_idx" ON "inventory_items"("stationId");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_idx" ON "audit_logs"("organizationId");

-- CreateIndex
CREATE INDEX "audit_logs_stationId_createdAt_idx" ON "audit_logs"("stationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_businessTemplateId_fkey" FOREIGN KEY ("businessTemplateId") REFERENCES "business_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_branding" ADD CONSTRAINT "station_branding_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_settings" ADD CONSTRAINT "station_settings_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_subscriptions" ADD CONSTRAINT "station_subscriptions_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_subscriptions" ADD CONSTRAINT "station_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_feature_overrides" ADD CONSTRAINT "station_feature_overrides_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_contacts" ADD CONSTRAINT "vehicle_contacts_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_contacts" ADD CONSTRAINT "vehicle_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_notes" ADD CONSTRAINT "vehicle_notes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_notes" ADD CONSTRAINT "vehicle_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_prices" ADD CONSTRAINT "service_prices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_template_items" ADD CONSTRAINT "service_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "service_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_template_items" ADD CONSTRAINT "service_template_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_photoBypassedById_fkey" FOREIGN KEY ("photoBypassedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_card_services" ADD CONSTRAINT "job_card_services_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reports" ADD CONSTRAINT "service_reports_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "job_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_vehicles" ADD CONSTRAINT "offer_vehicles_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_vehicles" ADD CONSTRAINT "offer_vehicles_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_offer_progress" ADD CONSTRAINT "vehicle_offer_progress_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_offer_progress" ADD CONSTRAINT "vehicle_offer_progress_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
