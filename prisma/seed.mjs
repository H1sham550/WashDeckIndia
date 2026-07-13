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

  console.log("Seeding Database...");
  const defaultPasswordHash = hashPassword("WashDeck123");

  // 1. Subscription Plans
  console.log("Creating Subscription Plans...");
  const plans = [
    {
      name: "Starter",
      description: "Ideal for growing detailing studios and quick wash centers",
      price: 499.00,
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
      price: 1499.00,
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
      price: 3999.00,
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

  // 2. Countries & Regions
  console.log("Creating Countries & Regions (Saudi Arabia, India, UAE)...");
  const saudiArabia = await prisma.country.create({
    data: {
      code: "SA",
      name: "Saudi Arabia",
      currencyCode: "SAR",
      currencyFormat: "ar-SA",
      phonePrefix: "+966",
      defaultLocale: "ar-SA",
      supportedLocales: ["en-SA", "ar-SA"],
      isRTL: true,
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24h",
      decimalSeparator: ".",
      thousandsSeparator: ",",
      measurementSystem: "metric",
      currencySymbolPosition: "right",
      firstDayOfWeek: 0,
      weekendDays: [5, 6],
      regions: {
        create: [
          { name: "Riyadh Province", timezone: "Asia/Riyadh", taxName: "VAT", taxRate: 15.00 },
          { name: "Makkah Province (Jeddah)", timezone: "Asia/Riyadh", taxName: "VAT", taxRate: 15.00 },
          { name: "Eastern Province (Dammam)", timezone: "Asia/Riyadh", taxName: "VAT", taxRate: 15.00 }
        ]
      }
    },
    include: { regions: true }
  });

  const india = await prisma.country.create({
    data: {
      code: "IN",
      name: "India",
      currencyCode: "INR",
      currencyFormat: "en-IN",
      phonePrefix: "+91",
      defaultLocale: "en-IN",
      supportedLocales: ["en-IN"],
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
          { name: "Kerala", timezone: "Asia/Kolkata", taxName: "GST", taxRate: 18.00 },
          { name: "Karnataka (Bangalore)", timezone: "Asia/Kolkata", taxName: "GST", taxRate: 18.00 },
          { name: "Maharashtra (Mumbai)", timezone: "Asia/Kolkata", taxName: "GST", taxRate: 18.00 }
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
      supportedLocales: ["en-AE", "ar-AE"],
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
          { name: "Dubai", timezone: "Asia/Dubai", taxName: "VAT", taxRate: 5.00 },
          { name: "Abu Dhabi", timezone: "Asia/Dubai", taxName: "VAT", taxRate: 5.00 }
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
        { name: "Graphene 9H Ceramic Coating (5 Yr Warranty)", price: 2500, description: "Multi-layer extreme gloss and scratch protection" },
        { name: "Paint Protection Film (PPF) - Full Body TPU", price: 8500, description: "Self-healing ultra-clear protective shield" },
        { name: "Interior Deep Steam Sanitization & Leather Conditioning", price: 450, description: "Deep extraction and antimicrobial treatment" },
        { name: "Stage 2 Dual Action Paint Correction & Polishing", price: 800, description: "Removes 85%+ swirl marks and oxidation" }
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
        { name: "Express Foam Exterior Wash + Tire Dressing", price: 45, description: "High-pressure touchless pre-wash and pH neutral foam" },
        { name: "Full Body Wash + Interior Vacuum & Dashboard Wipe", price: 75, description: "Comprehensive inside-out cleaning" },
        { name: "Underbody High-Pressure Degreasing", price: 30, description: "Removes road grime and salt buildup" }
      ],
      defaultSettingsJson: {
        autoJobNumberFormat: "WSH-{YY}{MM}-{000}",
        invoicePrefix: "WSH-INV-",
        bookingIntervalMinutes: 30,
        photoRequirements: ["FRONT", "REAR", "LEFT", "RIGHT"]
      }
    }
  });

  // 4. Organizations
  console.log("Creating Enterprise Organization & Stations...");
  const org = await prisma.organization.create({
    data: {
      name: "Al-Rajhi Premium Auto Group",
      slug: "alrajhi-auto-group"
    }
  });

  // Riyadh Flagship Studio (Saudi Arabia)
  const riyadhRegion = saudiArabia.regions.find(r => r.name.includes("Riyadh"));
  const stationRiyadh = await prisma.station.create({
    data: {
      organizationId: org.id,
      countryId: saudiArabia.id,
      regionId: riyadhRegion.id,
      businessTemplateId: detailingStudioTemplate.id,
      branchCode: "RYD001",
      name: "Apex Luxury Detailing Studio - Riyadh",
      slug: "apex-riyadh",
      status: StationStatus.ACTIVE,
      branding: {
        create: {
          squareLogoUrl: "/images/logo-square.png",
          horizontalLogoUrl: "/images/logo-horizontal.png",
          primaryColor: "#0F172A",
          themeMode: "dark",
          businessPhone: "+966 50 123 4567",
          businessEmail: "riyadh@apexdetailing.sa",
          businessAddress: "King Fahd Road, Olaya District, Riyadh 12211",
          websiteUrl: "https://apexdetailing.sa"
        }
      },
      settings: {
        create: {
          autoJobNumberFormat: "RYD-{YY}{MM}-{000}",
          invoicePrefix: "RYD-INV-",
          bookingLeadTime: 120,
          maxDailyBookings: 15,
          businessHoursJson: {
            mon: { open: "09:00", close: "21:00" },
            tue: { open: "09:00", close: "21:00" },
            wed: { open: "09:00", close: "21:00" },
            thu: { open: "09:00", close: "21:00" },
            sat: { open: "10:00", close: "22:00" },
            sun: { open: "09:00", close: "21:00" }
          },
          workingDays: [0, 1, 2, 3, 4, 6],
          photoRequirementsJson: ["FRONT", "REAR", "LEFT", "RIGHT", "INTERIOR_DASH", "ODOMETER"]
        }
      }
    }
  });

  // Kochi Express Wash (India)
  const kochiRegion = india.regions.find(r => r.name.includes("Kerala"));
  const stationKochi = await prisma.station.create({
    data: {
      organizationId: org.id,
      countryId: india.id,
      regionId: kochiRegion.id,
      businessTemplateId: expressWashTemplate.id,
      branchCode: "KOC001",
      name: "WashDeck Express - Kochi Marine Drive",
      slug: "washdeck-kochi",
      status: StationStatus.ACTIVE,
      branding: {
        create: {
          primaryColor: "#2563EB",
          themeMode: "light",
          businessPhone: "+91 98460 12345",
          businessEmail: "kochi@washdeck.in",
          businessAddress: "Marine Drive Walkway, Ernakulam, Kochi 682031"
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
      email: "admin@washdeck.com",
      passwordHash: defaultPasswordHash,
      status: "ACTIVE"
    }
  });

  // Riyadh Station Owner & Staff
  const riyadhOwner = await prisma.user.create({
    data: {
      stationId: stationRiyadh.id,
      role: UserRole.OWNER,
      name: "Tariq Al-Mansoor",
      email: "tariq@apexdetailing.sa",
      passwordHash: defaultPasswordHash,
      status: "ACTIVE"
    }
  });

  const riyadhStaff = await prisma.user.create({
    data: {
      stationId: stationRiyadh.id,
      role: UserRole.STAFF,
      name: "Zayn Abbas",
      username: "zayn_ryd",
      passwordHash: defaultPasswordHash,
      status: "ACTIVE"
    }
  });

  // Kochi Station Owner & Staff
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

  // 6. Services for Riyadh Station
  console.log("Creating Services for Riyadh Station...");
  const serviceCeramic = await prisma.service.create({
    data: {
      stationId: stationRiyadh.id,
      name: "Graphene 9H Ceramic Coating (5 Year Warranty)",
      description: "Multi-layer extreme gloss shield with hydrophobic self-cleaning properties."
    }
  });

  const serviceInterior = await prisma.service.create({
    data: {
      stationId: stationRiyadh.id,
      name: "Interior Deep Steam Extraction & Antimicrobial Treatment",
      description: "Complete cabin restoration, leather re-nourishment, and ozone odor elimination."
    }
  });

  const serviceWash = await prisma.service.create({
    data: {
      stationId: stationRiyadh.id,
      name: "Presidential Exterior Wash & Paint Decontamination",
      description: "pH neutral snow foam, clay bar treatment, and spray sealant application."
    }
  });

  // 7. Customers & Vehicles for Riyadh
  console.log("Creating Customers & Vehicles for Riyadh...");
  const custFahad = await prisma.customer.create({
    data: {
      stationId: stationRiyadh.id,
      name: "Prince Fahad Bin Sultan",
      mobile: "+966501112233"
    }
  });

  const vehicleG63 = await prisma.vehicle.create({
    data: {
      stationId: stationRiyadh.id,
      vehicleNumber: "KSA-9999-XYZ",
      brand: "Mercedes-AMG",
      model: "G63 Edition 1"
    }
  });

  const custOmar = await prisma.customer.create({
    data: {
      stationId: stationRiyadh.id,
      name: "Dr. Omar Al-Ghamdi",
      mobile: "+966554445566"
    }
  });

  const vehiclePorsche = await prisma.vehicle.create({
    data: {
      stationId: stationRiyadh.id,
      vehicleNumber: "RYD-777-KSA",
      brand: "Porsche",
      model: "911 GT3 RS"
    }
  });

  // 8. Sample Job Cards, Invoices & Payments
  console.log("Creating Operational Job Cards & Invoices...");
  const jobCard1 = await prisma.jobCard.create({
    data: {
      stationId: stationRiyadh.id,
      vehicleId: vehicleG63.id,
      customerId: custFahad.id,
      creatorId: riyadhStaff.id,
      status: JobStatus.IN_PROGRESS
    }
  });

  await prisma.jobCardService.create({
    data: {
      jobCardId: jobCard1.id,
      serviceId: serviceCeramic.id,
      serviceNameSnapshot: serviceCeramic.name,
      priceSnapshot: 3500.00
    }
  });

  await prisma.jobCardService.create({
    data: {
      jobCardId: jobCard1.id,
      serviceId: serviceInterior.id,
      serviceNameSnapshot: serviceInterior.name,
      priceSnapshot: 650.00
    }
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      stationId: stationRiyadh.id,
      jobCardId: jobCard1.id,
      invoiceNumber: "RYD-INV-1001",
      subtotal: 4150.00,
      discount: 150.00,
      finalAmount: 4000.00,
      status: InvoiceStatus.ISSUED
    }
  });

  // Create partial payment
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 2000.00,
      method: PaymentMethod.CARD,
      status: PaymentStatus.COMPLETED,
      gatewayName: "Mada / Geidea POS",
      transactionRef: "TXN_KSA_9988776655"
    }
  });

  // Completed Job Card with full payment
  const jobCard2 = await prisma.jobCard.create({
    data: {
      stationId: stationRiyadh.id,
      vehicleId: vehiclePorsche.id,
      customerId: custOmar.id,
      creatorId: riyadhOwner.id,
      status: JobStatus.SERVICE_COMPLETED
    }
  });

  await prisma.jobCardService.create({
    data: {
      jobCardId: jobCard2.id,
      serviceId: serviceWash.id,
      serviceNameSnapshot: serviceWash.name,
      priceSnapshot: 450.00
    }
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      stationId: stationRiyadh.id,
      jobCardId: jobCard2.id,
      invoiceNumber: "RYD-INV-1002",
      subtotal: 450.00,
      discount: 0.00,
      finalAmount: 450.00,
      status: InvoiceStatus.PAID
    }
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      amount: 450.00,
      method: PaymentMethod.CARD,
      status: PaymentStatus.COMPLETED,
      gatewayName: "Apple Pay (Mada)",
      transactionRef: "AP_KSA_11223344"
    }
  });

  // 9. Bookings
  console.log("Creating Bookings...");
  await prisma.booking.create({
    data: {
      stationId: stationRiyadh.id,
      customerName: "Khalid Al-Dosari",
      mobile: "+966509988776",
      vehicleNumber: "KSA-1234-ABC",
      scheduledAt: new Date(Date.now() + 3600000 * 4), // 4 hours from now
      status: BookingStatus.CONFIRMED
    }
  });

  await prisma.booking.create({
    data: {
      stationId: stationRiyadh.id,
      customerName: "Nawaf Al-Mutairi",
      mobile: "+966551122334",
      vehicleNumber: "RYD-555-BMW",
      scheduledAt: new Date(Date.now() + 3600000 * 24), // Tomorrow
      status: BookingStatus.PENDING
    }
  });

  // 10. Notifications
  console.log("Creating Notifications...");
  await prisma.notification.create({
    data: {
      stationId: stationRiyadh.id,
      title: "New VIP Customer Booking",
      message: "Prince Fahad scheduled a Ceramic Coating checkup for next Thursday.",
      priority: NotificationPriority.HIGH
    }
  });

  await prisma.notification.create({
    data: {
      stationId: stationRiyadh.id,
      title: "Invoice #RYD-INV-1001 Partially Paid",
      message: "Received SAR 2,000 via Mada POS. Balance SAR 2,000 pending.",
      priority: NotificationPriority.MEDIUM
    }
  });

  console.log("Database Seed Complete! 🚀");
  console.log("=========================================");
  console.log("Demo Credentials:");
  console.log("Super Admin: admin@washdeck.com | WashDeck123");
  console.log("Riyadh Owner: tariq@apexdetailing.sa | WashDeck123");
  console.log("Riyadh Staff: (username) zayn_ryd | WashDeck123");
  console.log("Kochi Owner: athul@washdeck.in | WashDeck123");
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
