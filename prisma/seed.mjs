import { PrismaClient, UserRole, StationStatus, BookingStatus, PaymentMethod, PaymentStatus, JobStatus, InvoiceStatus, NotificationPriority } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Cleaning up database...");
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.jobCardService.deleteMany();
  await prisma.jobPhoto.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.serviceReport.deleteMany();
  await prisma.jobCard.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.stationBranding.deleteMany();
  await prisma.stationSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();
  await prisma.region.deleteMany();
  await prisma.country.deleteMany();
  await prisma.businessTemplate.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.subscriptionPlan.deleteMany();

  console.log("Seeding Database for WashDeck India...");
  const defaultPasswordHash = hashPassword("WashDeck123");

  // 1. Subscription Plans
  console.log("Creating Subscription Plans (in INR)...");
  const plans = [
    {
      name: "Starter",
      description: "Ideal for growing detailing studios and quick wash centers",
      price: 1199.00,
      durationDays: 30,
      trialDays: 14,
      staffLimit: 3,
      reportLimit: 50,
      isRecommended: false,
      isActive: true
    },
    {
      name: "Professional",
      description: "Advanced enterprise workflows, custom branding & high volume processing",
      price: 2499.00,
      durationDays: 30,
      trialDays: 14,
      staffLimit: 10,
      reportLimit: 500,
      isRecommended: true,
      isActive: true
    },
    {
      name: "Enterprise",
      description: "Multi-branch capabilities, dedicated SLA & white-label portals",
      price: 4999.00,
      durationDays: 30,
      trialDays: 30,
      staffLimit: 50,
      reportLimit: 5000,
      isRecommended: false,
      isActive: true
    }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.create({ data: plan });
  }

  // 2. Countries & Regions (India Primary)
  console.log("Creating Countries & Regions (India Primary, UAE, Saudi Arabia)...");
  const india = await prisma.country.create({
    data: {
      code: "IN",
      name: "India",
      currencyCode: "INR",
      currencyFormat: "en-IN",
      phonePrefix: "+91",
      defaultLocale: "en-IN",
      supportedLocales: ["en-IN", "en"],
      isRTL: false,
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12h",
      decimalSeparator: ".",
      thousandsSeparator: ",",
      measurementSystem: "metric",
      currencySymbolPosition: "left",
      firstDayOfWeek: 1,
      weekendDays: [0],
      regions: {
        create: [
          { name: "Maharashtra (Mumbai)", timezone: "Asia/Kolkata", taxName: "GST", taxRate: 18.00 },
          { name: "Karnataka (Bengaluru)", timezone: "Asia/Kolkata", taxName: "GST", taxRate: 18.00 },
          { name: "Kerala (Kochi)", timezone: "Asia/Kolkata", taxName: "GST", taxRate: 18.00 },
          { name: "Delhi NCR", timezone: "Asia/Kolkata", taxName: "GST", taxRate: 18.00 }
        ]
      }
    },
    include: { regions: true }
  });

  const uae = await prisma.country.create({
    data: {
      code: "AE",
      name: "United Arab Emirates",
      currencyCode: "AED",
      currencyFormat: "en-AE",
      phonePrefix: "+971",
      defaultLocale: "en-AE",
      supportedLocales: ["en-AE"],
      isRTL: false,
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      decimalSeparator: ".",
      thousandsSeparator: ",",
      measurementSystem: "metric",
      currencySymbolPosition: "left",
      firstDayOfWeek: 1,
      weekendDays: [5, 6],
      regions: {
        create: [
          { name: "Dubai", timezone: "Asia/Dubai", taxName: "VAT", taxRate: 5.00 }
        ]
      }
    },
    include: { regions: true }
  });

  const saudiArabia = await prisma.country.create({
    data: {
      code: "SA",
      name: "Saudi Arabia",
      currencyCode: "SAR",
      currencyFormat: "en-SA",
      phonePrefix: "+966",
      defaultLocale: "en-SA",
      supportedLocales: ["en-SA"],
      isRTL: false,
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      decimalSeparator: ".",
      thousandsSeparator: ",",
      measurementSystem: "metric",
      currencySymbolPosition: "left",
      firstDayOfWeek: 0,
      weekendDays: [5, 6],
      regions: {
        create: [
          { name: "Riyadh Province", timezone: "Asia/Riyadh", taxName: "VAT", taxRate: 15.00 }
        ]
      }
    },
    include: { regions: true }
  });

  // 3. Business Templates
  console.log("Creating Business Templates...");
  const detailingStudioTemplate = await prisma.businessTemplate.create({
    data: {
      name: "Premium Detailing Studio",
      defaultServicesJson: [
        { name: "Graphene 9H Ceramic Coating (5 Yr Warranty)", price: 15000, description: "Multi-layer extreme gloss and scratch protection" },
        { name: "Paint Protection Film (PPF) - Full Body TPU", price: 65000, description: "Self-healing ultra-clear protective shield" },
        { name: "Interior Deep Steam Sanitization & Leather Conditioning", price: 2499, description: "Deep extraction and antimicrobial treatment" },
        { name: "Stage 2 Dual Action Paint Correction & Polishing", price: 4999, description: "Removes 85%+ swirl marks and oxidation" }
      ],
      defaultSettingsJson: {
        autoJobNumberFormat: "DET-{YY}{MM}-{000}",
        invoicePrefix: "DET-INV-",
        bookingIntervalMinutes: 60,
        photoRequirements: ["FRONT", "REAR", "LEFT", "RIGHT", "INTERIOR_DASH", "INTERIOR_SEATS"]
      }
    }
  });

  const expressWashTemplate = await prisma.businessTemplate.create({
    data: {
      name: "Express Auto Wash Center",
      defaultServicesJson: [
        { name: "Express Foam Exterior Wash + Tire Dressing", price: 399, description: "High-pressure touchless pre-wash and pH neutral foam" },
        { name: "Full Body Wash + Interior Vacuum & Dashboard Wipe", price: 699, description: "Comprehensive inside-out cleaning" },
        { name: "Underbody High-Pressure Degreasing", price: 299, description: "Removes road grime and mud buildup" }
      ],
      defaultSettingsJson: {
        autoJobNumberFormat: "WSH-{YY}{MM}-{000}",
        invoicePrefix: "WSH-INV-",
        bookingIntervalMinutes: 30,
        photoRequirements: ["FRONT", "REAR", "LEFT", "RIGHT"]
      }
    }
  });

  // 4. Organization & Stations
  console.log("Creating Enterprise Organization & Indian Stations...");
  const org = await prisma.organization.create({
    data: {
      name: "WashDeck India Group",
      slug: "washdeck-india-group"
    }
  });

  // Mumbai Flagship Studio (Primary Station)
  const mumbaiRegion = india.regions.find(r => r.name.includes("Maharashtra"));
  const stationMumbai = await prisma.station.create({
    data: {
      organizationId: org.id,
      countryId: india.id,
      regionId: mumbaiRegion.id,
      businessTemplateId: detailingStudioTemplate.id,
      branchCode: "MUM001",
      name: "WashDeck Flagship Studio — Mumbai",
      slug: "washdeck-mumbai",
      status: StationStatus.ACTIVE,
      branding: {
        create: {
          squareLogoUrl: "/logo-icon.png",
          horizontalLogoUrl: "/logo-icon.png",
          primaryColor: "#0F172A",
          themeMode: "dark",
          businessPhone: "+91 98765 43210",
          businessEmail: "mumbai@washdeck.in",
          businessAddress: "Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051",
          websiteUrl: "https://wash-deck-india.vercel.app"
        }
      },
      settings: {
        create: {
          autoJobNumberFormat: "MUM-{YY}{MM}-{000}",
          invoicePrefix: "MUM-INV-",
          bookingLeadTime: 120,
          maxDailyBookings: 25,
          businessHoursJson: {
            mon: { open: "09:00", close: "21:00" },
            tue: { open: "09:00", close: "21:00" },
            wed: { open: "09:00", close: "21:00" },
            thu: { open: "09:00", close: "21:00" },
            fri: { open: "09:00", close: "21:00" },
            sat: { open: "09:00", close: "21:00" },
            sun: { open: "10:00", close: "20:00" }
          },
          workingDays: [0, 1, 2, 3, 4, 5, 6],
          photoRequirementsJson: ["FRONT", "REAR", "LEFT", "RIGHT", "INTERIOR_DASH", "ODOMETER"]
        }
      }
    }
  });

  // Kochi Express Wash (Secondary Station)
  const kochiRegion = india.regions.find(r => r.name.includes("Kerala"));
  const stationKochi = await prisma.station.create({
    data: {
      organizationId: org.id,
      countryId: india.id,
      regionId: kochiRegion.id,
      businessTemplateId: expressWashTemplate.id,
      branchCode: "KOC001",
      name: "WashDeck Express — Kochi Marine Drive",
      slug: "washdeck-kochi",
      status: StationStatus.ACTIVE,
      branding: {
        create: {
          primaryColor: "#2563EB",
          themeMode: "light",
          businessPhone: "+91 98460 12345",
          businessEmail: "kochi@washdeck.in",
          businessAddress: "Marine Drive Walkway, Ernakulam, Kochi, Kerala 682031"
        }
      },
      settings: {
        create: {
          autoJobNumberFormat: "KOC-{YY}{MM}-{000}",
          invoicePrefix: "KOC-INV-"
        }
      }
    }
  });

  // 5. Users
  console.log("Creating Super Admin, Owners & Staff...");
  // Super Admin
  await prisma.user.create({
    data: {
      role: UserRole.SUPER_ADMIN,
      name: "System Super Admin",
      email: "admin@washdeck.in",
      passwordHash: defaultPasswordHash,
      status: "ACTIVE"
    }
  });

  // Mumbai Station Owner & Staff
  const mumbaiOwner = await prisma.user.create({
    data: {
      stationId: stationMumbai.id,
      role: UserRole.OWNER,
      name: "Rahul Sharma",
      email: "owner@washdeck.in",
      passwordHash: defaultPasswordHash,
      status: "ACTIVE"
    }
  });

  const mumbaiStaff = await prisma.user.create({
    data: {
      stationId: stationMumbai.id,
      role: UserRole.STAFF,
      name: "Aakash Patel",
      username: "aakash_mum",
      passwordHash: defaultPasswordHash,
      status: "ACTIVE"
    }
  });

  // Kochi Station Owner
  await prisma.user.create({
    data: {
      stationId: stationKochi.id,
      role: UserRole.OWNER,
      name: "Athul Krishna",
      email: "athul@washdeck.in",
      passwordHash: defaultPasswordHash,
      status: "ACTIVE"
    }
  });

  // 6. Services for Mumbai Station
  console.log("Creating Services for Mumbai Station...");
  const serviceCeramic = await prisma.service.create({
    data: {
      stationId: stationMumbai.id,
      name: "Graphene 9H Ceramic Coating (5 Year Warranty)",
      description: "Multi-layer extreme gloss shield with hydrophobic self-cleaning properties."
    }
  });

  const serviceInterior = await prisma.service.create({
    data: {
      stationId: stationMumbai.id,
      name: "Interior Deep Steam Extraction & Sanitization",
      description: "Complete cabin restoration, leather re-nourishment, and antibacterial treatment."
    }
  });

  const serviceWash = await prisma.service.create({
    data: {
      stationId: stationMumbai.id,
      name: "Full Body Foam Wash & Underbody Cleaning",
      description: "pH neutral snow foam, clay bar treatment, and chassis wash."
    }
  });

  // 7. Customers & Vehicles for Mumbai
  console.log("Creating Customers & Vehicles for Mumbai...");
  const custRahul = await prisma.customer.create({
    data: {
      stationId: stationMumbai.id,
      name: "Vikramaditya Verma",
      mobile: "+919876543210"
    }
  });

  const vehicleG63 = await prisma.vehicle.create({
    data: {
      stationId: stationMumbai.id,
      vehicleNumber: "MH-01-AB-1234",
      brand: "Mercedes-AMG",
      model: "G63 Edition 1"
    }
  });

  const custPriya = await prisma.customer.create({
    data: {
      stationId: stationMumbai.id,
      name: "Priya Menon",
      mobile: "+918765432109"
    }
  });

  const vehicleTaycan = await prisma.vehicle.create({
    data: {
      stationId: stationMumbai.id,
      vehicleNumber: "MH-02-CD-9999",
      brand: "Porsche",
      model: "Taycan 4S"
    }
  });

  // 8. Operational Job Cards & Invoices for Mumbai
  console.log("Creating Operational Job Cards & Invoices...");
  const jobActive = await prisma.jobCard.create({
    data: {
      stationId: stationMumbai.id,
      vehicleId: vehicleG63.id,
      customerId: custRahul.id,
      creatorId: mumbaiOwner.id,
      status: JobStatus.IN_PROGRESS,
      expectedCompletionTime: new Date(Date.now() + 7200000)
    }
  });

  await prisma.jobCardService.create({
    data: {
      jobCardId: jobActive.id,
      serviceId: serviceCeramic.id,
      serviceNameSnapshot: serviceCeramic.name,
      priceSnapshot: 15000.00
    }
  });

  const jobCompleted = await prisma.jobCard.create({
    data: {
      stationId: stationMumbai.id,
      vehicleId: vehicleTaycan.id,
      customerId: custPriya.id,
      creatorId: mumbaiOwner.id,
      status: JobStatus.SERVICE_COMPLETED,
      expectedCompletionTime: new Date(Date.now() - 1800000)
    }
  });

  await prisma.jobCardService.create({
    data: {
      jobCardId: jobCompleted.id,
      serviceId: serviceWash.id,
      serviceNameSnapshot: serviceWash.name,
      priceSnapshot: 1499.00
    }
  });

  const invoiceCompleted = await prisma.invoice.create({
    data: {
      stationId: stationMumbai.id,
      jobCardId: jobCompleted.id,
      invoiceNumber: "MUM-INV-1001",
      subtotal: 1499.00,
      discount: 0,
      finalAmount: 1768.82,
      status: InvoiceStatus.PAID
    }
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoiceCompleted.id,
      amount: 1768.82,
      method: PaymentMethod.UPI,
      status: PaymentStatus.COMPLETED,
      transactionRef: "UPI/987654321/MUM"
    }
  });

  // 9. Bookings
  console.log("Creating Bookings...");
  await prisma.booking.create({
    data: {
      stationId: stationMumbai.id,
      customerName: "Ananya Roy",
      mobile: "+919988776655",
      vehicleNumber: "MH-12-PQ-5555",
      vehicleType: "SEDAN",
      scheduledAt: new Date(Date.now() + 86400000),
      serviceName: "Interior Deep Steam Extraction",
      status: BookingStatus.CONFIRMED
    }
  });

  // 10. Notifications
  console.log("Creating Notifications...");
  await prisma.notification.create({
    data: {
      stationId: stationMumbai.id,
      title: "Welcome to WashDeck India",
      message: "Your Mumbai Flagship Studio station is ready. Start managing intake, job cards, and invoices.",
      priority: NotificationPriority.HIGH,
      isRead: false
    }
  });

  console.log("Database Seed Complete! 🚀");
  console.log("=========================================");
  console.log("WashDeck India Credentials:");
  console.log("Super Admin: admin@washdeck.in | WashDeck123");
  console.log("Mumbai Owner: owner@washdeck.in | WashDeck123");
  console.log("Mumbai Staff: (username) aakash_mum | WashDeck123");
  console.log("Kochi Owner: athul@washdeck.in | WashDeck123");
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
