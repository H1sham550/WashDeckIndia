import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";
import { createSession } from "@/lib/session";
import { StationStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ownerName,
      stationName,
      identity,
      password,
      selectedPlan,
      prices,
    } = body;

    if (!ownerName?.trim() || !stationName?.trim() || !identity?.trim() || !password?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Please fill in all required account fields." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const inputIdentity = identity.toLowerCase().trim();
    const isEmail = inputIdentity.includes("@");
    const email = isEmail ? inputIdentity : `${inputIdentity.replace(/[^a-z0-9]/gi, "")}@station.washdeck.com`;
    const username = isEmail ? inputIdentity.split("@")[0] : inputIdentity;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
        isDeleted: false,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "An account with this email or mobile number already exists. Please log in instead." },
        { status: 400 }
      );
    }

    // Generate unique slug & branch code
    const slugBase = stationName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "station";
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${slugBase}-${randomSuffix}`;
    const branchCode = `RYD-${randomSuffix}`;

    // Calculate 30-day free trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Get default plan or create
    let plan = await prisma.subscriptionPlan.findFirst({
      where: { name: { contains: selectedPlan === "STARTER" ? "Starter" : selectedPlan === "ENTERPRISE" ? "Enterprise" : "Pro", mode: "insensitive" } },
    });

    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst();
    }

    // Fetch default country & region (Saudi Arabia)
    let country = await prisma.country.findFirst({ where: { code: "SA" } });
    if (!country) country = await prisma.country.findFirst();

    let region = await prisma.region.findFirst();

    if (!country || !region) {
      return NextResponse.json(
        { ok: false, error: "System initialization error: Default country/region missing." },
        { status: 500 }
      );
    }

    // Create Station
    const station = await prisma.station.create({
      data: {
        name: stationName.trim(),
        slug,
        branchCode,
        countryId: country.id,
        regionId: region.id,
        status: StationStatus.TRIAL,
        branding: {
          create: {
            squareLogoUrl: null,
            primaryColor: "#0f766e", // Default Emerald Teal
            businessEmail: isEmail ? email : null,
            businessPhone: !isEmail ? inputIdentity : null,
          },
        },
        settings: {
          create: {
            invoicePrefix: "INV-",
          },
        },
      },
    });

    // Attach Station Subscription with 30-day Free Trial
    if (plan) {
      await prisma.stationSubscription.create({
        data: {
          stationId: station.id,
          subscriptionId: plan.id,
          status: "TRIAL",
          startDate: new Date(),
          endDate: trialEndsAt,
        },
      });
    }

    // Create Owner User
    const user = await prisma.user.create({
      data: {
        stationId: station.id,
        name: ownerName.trim(),
        email: isEmail ? email : null,
        username,
        passwordHash: hashPassword(password),
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    // Initialize Default Services with Owner's Custom Prices
    const bikePrice = Number(prices?.BIKE) || 20;
    const hatchbackPrice = Number(prices?.HATCHBACK) || 35;
    const sedanPrice = Number(prices?.SEDAN) || 45;
    const suvPrice = Number(prices?.SUV) || 65;
    const luxuryPrice = Number(prices?.LUXURY) || 95;

    await prisma.service.create({
      data: {
        stationId: station.id,
        name: "Express Body Wash & Interior Detailing",
        description: "Pressure water rinse, foam soap, wheel rim cleaning, tire dressing, and interior vacuum.",
        prices: {
          create: [
            { vehicleType: "BIKE", price: bikePrice },
            { vehicleType: "HATCHBACK", price: hatchbackPrice },
            { vehicleType: "SEDAN", price: sedanPrice },
            { vehicleType: "SUV", price: suvPrice },
            { vehicleType: "LUXURY", price: luxuryPrice },
          ],
        },
      },
    });

    // Establish JWT Session
    await createSession({
      id: user.id,
      email: user.email || user.username || email,
      name: user.name,
      role: user.role,
      stationId: station.id,
    });

    return NextResponse.json({
      ok: true,
      redirectTo: "/dashboard",
      message: "Store account created successfully! Enjoy your 1-Month Free Trial.",
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to create store account." },
      { status: 500 }
    );
  }
}
