import { PrismaClient, UserRole, StationStatus, VehicleType, JobStatus, PaymentStatus, PaymentMethod, OfferType } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Cleaning up database...");
  await prisma.jobCardService.deleteMany();
  await prisma.jobPhoto.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.serviceReport.deleteMany();
  await prisma.jobCard.deleteMany();
  await prisma.vehicleOfferProgress.deleteMany();
  await prisma.offerVehicle.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.vehicleContact.deleteMany();
  await prisma.vehicleNote.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.servicePrice.deleteMany();
  await prisma.serviceTemplateItem.deleteMany();
  await prisma.serviceTemplate.deleteMany();
  await prisma.service.deleteMany();
  await prisma.stationSubscription.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.otpToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();

  console.log("Seeding database...");
  const defaultPasswordHash = hashPassword("WashDeck123");

  // 1. Seed Station
  const station = await prisma.station.upsert({
    where: { slug: "sparkle-shine" },
    update: {
      vipSpendThreshold: 10000,
      vipVisitThreshold: 5,
    },
    create: {
      name: "Sparkle Shine Car Wash",
      slug: "sparkle-shine",
      email: "owner@example.com",
      phone: "+910000000000",
      primaryColor: "#0f766e",
      upiId: "sparkle@upi",
      status: StationStatus.TRIAL,
      vipSpendThreshold: 10000,
      vipVisitThreshold: 5,
    },
  });

  // 2. Seed Users
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@washdeck.local" },
    update: {
      passwordHash: defaultPasswordHash,
    },
    create: {
      name: "WashDeck Super Admin",
      email: "admin@washdeck.local",
      passwordHash: defaultPasswordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {
      passwordHash: defaultPasswordHash,
    },
    create: {
      stationId: station.id,
      name: "Station Owner",
      email: "owner@example.com",
      mobile: "+910000000000",
      passwordHash: defaultPasswordHash,
      role: UserRole.OWNER,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {
      passwordHash: defaultPasswordHash,
    },
    create: {
      stationId: station.id,
      name: "Front Desk Staff",
      email: "staff@example.com",
      mobile: "+910000000001",
      passwordHash: defaultPasswordHash,
      role: UserRole.STAFF,
    },
  });

  // 3. Seed Services & Service Prices
  const servicesData = [
    {
      name: "Foam Wash",
      description: "Exterior foam wash with pressure wash and tire cleaning.",
      prices: {
        [VehicleType.BIKE]: 150,
        [VehicleType.HATCHBACK]: 350,
        [VehicleType.SEDAN]: 450,
        [VehicleType.SUV]: 550,
        [VehicleType.LUXURY]: 750,
      },
    },
    {
      name: "Interior Detailing",
      description: "Deep vacuuming, dashboard polish, upholstery shampoo.",
      prices: {
        [VehicleType.BIKE]: 300,
        [VehicleType.HATCHBACK]: 1200,
        [VehicleType.SEDAN]: 1500,
        [VehicleType.SUV]: 1800,
        [VehicleType.LUXURY]: 2500,
      },
    },
    {
      name: "Ceramic Coating",
      description: "Premium 9H ceramic coating with multi-year paint protection.",
      prices: {
        [VehicleType.BIKE]: 5000,
        [VehicleType.HATCHBACK]: 15000,
        [VehicleType.SEDAN]: 20000,
        [VehicleType.SUV]: 25000,
        [VehicleType.LUXURY]: 35000,
      },
    },
    {
      name: "Full Spa Wash",
      description: "Foam wash, interior dressing, engine bay dressing, vacuuming.",
      prices: {
        [VehicleType.BIKE]: 500,
        [VehicleType.HATCHBACK]: 800,
        [VehicleType.SEDAN]: 1000,
        [VehicleType.SUV]: 1200,
        [VehicleType.LUXURY]: 1800,
      },
    },
  ];

  const dbServices = [];

  for (const s of servicesData) {
    const service = await prisma.service.create({
      data: {
        stationId: station.id,
        name: s.name,
        description: s.description,
      },
    });

    dbServices.push(service);

    for (const [vehicleType, price] of Object.entries(s.prices)) {
      await prisma.servicePrice.create({
        data: {
          serviceId: service.id,
          vehicleType: vehicleType,
          price: price,
        },
      });
    }
  }

  // 4. Seed Customers & Vehicles
  const customer1 = await prisma.customer.create({
    data: {
      stationId: station.id,
      name: "Amit Kumar",
      mobile: "9876543210",
      email: "amit@example.com",
    },
  });

  const vehicle1 = await prisma.vehicle.create({
    data: {
      stationId: station.id,
      vehicleNumber: "KA03HA1234",
      vehicleType: VehicleType.SUV,
      brand: "Hyundai",
      model: "Creta",
      color: "White",
    },
  });

  await prisma.vehicleContact.create({
    data: {
      vehicleId: vehicle1.id,
      customerId: customer1.id,
      isPrimary: true,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      stationId: station.id,
      name: "Rahul Sharma",
      mobile: "9876543211",
      email: "rahul@example.com",
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      stationId: station.id,
      vehicleNumber: "DL01A5678",
      vehicleType: VehicleType.SEDAN,
      brand: "Honda",
      model: "City",
      color: "Silver",
    },
  });

  await prisma.vehicleContact.create({
    data: {
      vehicleId: vehicle2.id,
      customerId: customer2.id,
      isPrimary: true,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      stationId: station.id,
      name: "Sneha Patel",
      mobile: "9876543212",
      email: "sneha@example.com",
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      stationId: station.id,
      vehicleNumber: "MH12B9012",
      vehicleType: VehicleType.LUXURY,
      brand: "BMW",
      model: "3 Series",
      color: "Black",
    },
  });

  await prisma.vehicleContact.create({
    data: {
      vehicleId: vehicle3.id,
      customerId: customer3.id,
      isPrimary: true,
    },
  });

  // 5. Seed Job Cards, Inspections, Services, and Invoices

  // Job Card 1: In Progress
  const foamWashService = dbServices.find((s) => s.name === "Foam Wash");
  const interiorService = dbServices.find((s) => s.name === "Interior Detailing");
  const spaWashService = dbServices.find((s) => s.name === "Full Spa Wash");
  const ceramicService = dbServices.find((s) => s.name === "Ceramic Coating");

  const job1 = await prisma.jobCard.create({
    data: {
      stationId: station.id,
      vehicleId: vehicle1.id,
      customerId: customer1.id,
      creatorId: staff.id,
      status: JobStatus.IN_PROGRESS,
      expectedCompletionTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    },
  });

  await prisma.inspection.create({
    data: {
      jobCardId: job1.id,
      notes: "Scratches on front left bumper. Rear windshield dirty.",
    },
  });

  await prisma.jobCardService.createMany({
    data: [
      {
        jobCardId: job1.id,
        serviceId: foamWashService.id,
        serviceNameSnapshot: foamWashService.name,
        priceSnapshot: 550, // SUV price
      },
      {
        jobCardId: job1.id,
        serviceId: interiorService.id,
        serviceNameSnapshot: interiorService.name,
        priceSnapshot: 1800, // SUV price
      },
    ],
  });

  // Job Card 2: Payment Pending
  const job2 = await prisma.jobCard.create({
    data: {
      stationId: station.id,
      vehicleId: vehicle2.id,
      customerId: customer2.id,
      creatorId: staff.id,
      status: JobStatus.PAYMENT_PENDING,
    },
  });

  await prisma.inspection.create({
    data: {
      jobCardId: job2.id,
      notes: "No body damages found. Interior neat.",
    },
  });

  await prisma.jobCardService.create({
    data: {
      jobCardId: job2.id,
      serviceId: spaWashService.id,
      serviceNameSnapshot: spaWashService.name,
      priceSnapshot: 1000, // Sedan price
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      jobCardId: job2.id,
      invoiceNumber: "INV-2026-0001",
      subtotal: 1000,
      discount: 100,
      finalAmount: 900,
      paymentStatus: PaymentStatus.PENDING,
    },
  });

  // Job Card 3: Delivered (Completed & Paid)
  const job3 = await prisma.jobCard.create({
    data: {
      stationId: station.id,
      vehicleId: vehicle3.id,
      customerId: customer3.id,
      creatorId: staff.id,
      status: JobStatus.DELIVERED,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  await prisma.inspection.create({
    data: {
      jobCardId: job3.id,
      notes: "Full body clay treatment before coating. Perfect exterior condition.",
    },
  });

  await prisma.jobCardService.create({
    data: {
      jobCardId: job3.id,
      serviceId: ceramicService.id,
      serviceNameSnapshot: ceramicService.name,
      priceSnapshot: 35000, // Luxury price
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      jobCardId: job3.id,
      invoiceNumber: "INV-2026-0002",
      subtotal: 35000,
      discount: 2000,
      finalAmount: 33000,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.UPI,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  // 6. Seed Offers & Loyalty progress
  const offer = await prisma.offer.create({
    data: {
      stationId: station.id,
      name: "5th Wash Free",
      description: "Get a complimentary spa wash after 4 paid spa washes.",
      type: OfferType.ALL_VEHICLES,
      targetCount: 4,
      rewardDescription: "Free Full Spa Wash",
    },
  });

  await prisma.vehicleOfferProgress.create({
    data: {
      vehicleId: vehicle1.id,
      offerId: offer.id,
      currentCount: 3, // Ready for next wash to unlock reward
      rewardEarned: false,
    },
  });

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
