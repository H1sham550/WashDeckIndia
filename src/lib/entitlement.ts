import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { FEATURE_REGISTRY, hasFeatureAccess } from "@/lib/features";

export type SubscriptionLifecycleState = "ACTIVE" | "TRIAL" | "GRACE" | "EXPIRED" | "SUSPENDED";

export type StationEntitlements = {
  lifecycle: SubscriptionLifecycleState;
  features: {
    staff: boolean;
    offers: boolean;
    analytics: boolean;
    recovery: boolean;
    finance: boolean;
    branding: boolean;
    [key: string]: boolean;
  };
  staffLimit: number;
  reportLimit: number;
  currentPlanName: string;
  stationMetadata?: {
    id: string;
    name: string;
    slug: string;
    branchCode: string;
    onboardingStatus: string;
    logoUrl: string | null;
    primaryColor: string | null;
    dueForVisitThreshold: number;
    country?: string;
    currency?: string;
    timezone?: string;
    locale?: string;
    isRTL?: boolean;
    vipSpendThreshold?: number;
    vipVisitThreshold?: number;
  };
};

const entitlementCache = new Map<string, { data: StationEntitlements; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

const FEATURE_KEY_MAPPING: Record<string, string> = {
  offers: "LOYALTY_PROGRAMS",
  reports: "SERVICE_REPORTS",
  recovery: "REVENUE_RECOVERY",
  analytics: "ANALYTICS",
  finance: "SERVICE_REPORTS",
  staff: "STAFF_MANAGEMENT",
  branding: "CUSTOM_BRANDING",
};

export function normalizeFeatureKey(featureKey: string): string {
  const key = featureKey.toLowerCase();
  if (FEATURE_KEY_MAPPING[key]) {
    return FEATURE_KEY_MAPPING[key];
  }
  return featureKey.toUpperCase();
}

export const getStationEntitlements = cache(async (stationId: string): Promise<StationEntitlements> => {
  const now = Date.now();
  const cached = entitlementCache.get(stationId);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  let station = await prisma.station.findUnique({
    where: { id: stationId },
    include: {
      branding: true,
      settings: true,
      featureOverrides: true,
      stationSubscriptions: {
        include: {
          subscription: {
            include: {
              planFeatures: true,
            },
          },
        },
        orderBy: { endDate: "desc" },
      },
    },
  });

  if (!station && stationId && stationId !== "station" && stationId.length >= 8) {
    try {
      let country = await prisma.country.findFirst({ where: { code: "SA" } });
      if (!country) country = await prisma.country.findFirst();
      if (!country) {
        country = await prisma.country.create({
          data: {
            code: "SA",
            name: "Saudi Arabia",
            currencyCode: "SAR",
            currencyFormat: "SAR {amount}",
            phonePrefix: "+966",
            defaultLocale: "en-SA",
            supportedLocales: ["en-SA", "ar-SA"],
            dateFormat: "DD/MM/YYYY",
            timeFormat: "12h",
          },
        });
      }

      let region = await prisma.region.findFirst({ where: { countryId: country.id } });
      if (!region) {
        region = await prisma.region.create({
          data: { countryId: country.id, name: "Riyadh", timezone: "Asia/Riyadh", taxName: "VAT", taxRate: 15 },
        });
      }

      station = await prisma.station.create({
        data: {
          id: stationId,
          name: "WashDeck Station",
          slug: stationId,
          branchCode: `WD-${stationId.slice(0, 4).toUpperCase()}`,
          countryId: country.id,
          regionId: region.id,
          status: "TRIAL",
          isDeleted: false,
          branding: {
            create: {
              primaryColor: "#0F172A",
            },
          },
          settings: {
            create: {
              defaultCurrencyOverride: country.currencyCode || "SAR",
              timezoneOverride: region.timezone || "Asia/Riyadh",
            },
          },
        },
        include: {
          branding: true,
          settings: true,
          featureOverrides: true,
          stationSubscriptions: {
            include: {
              subscription: {
                include: {
                  planFeatures: true,
                },
              },
            },
            orderBy: { endDate: "desc" },
          },
        },
      });
    } catch (createErr) {
      console.error("Self-healing missing station creation error:", createErr);
    }
  }

  if (!station) {
    return {
      lifecycle: "EXPIRED",
      features: { staff: false, offers: false, analytics: false, recovery: false, finance: false, branding: false },
      staffLimit: 1,
      reportLimit: 10,
      currentPlanName: "None",
      stationMetadata: {
        id: stationId,
        name: "WashDeck Station",
        slug: "station",
        branchCode: "WD001",
        onboardingStatus: "COMPLETED",
        logoUrl: null,
        primaryColor: "#0F172A",
        dueForVisitThreshold: 30,
        country: "SA",
        currency: "SAR",
        timezone: "Asia/Riyadh",
        locale: "en-SA",
        isRTL: false,
        vipSpendThreshold: 10000,
        vipVisitThreshold: 5,
      },
    };
  }

  if (station.isDeleted) {
    try {
      await prisma.station.update({
        where: { id: stationId },
        data: { isDeleted: false },
      });
      station.isDeleted = false;
    } catch (e) {
      // ignore self-heal errors
    }
  }

  const [country, region] = await Promise.all([
    station.countryId ? prisma.country.findUnique({ where: { id: station.countryId } }).catch(() => null) : Promise.resolve(null),
    station.regionId ? prisma.region.findUnique({ where: { id: station.regionId } }).catch(() => null) : Promise.resolve(null),
  ]);

  let lifecycle: SubscriptionLifecycleState = "EXPIRED";
  if (station.status === "SUSPENDED") {
    lifecycle = "SUSPENDED";
  } else {
    const sub = station.stationSubscriptions[0];
    if (!sub) {
      if (station.status === "TRIAL") lifecycle = "TRIAL";
      else if (station.status === "EXPIRED") lifecycle = "EXPIRED";
      else lifecycle = "EXPIRED";
    } else if (sub.status === "SUSPENDED") {
      lifecycle = "SUSPENDED";
    } else {
      const now = new Date();
      if (sub.endDate < now) {
        if (sub.graceUntil && sub.graceUntil > now) {
          lifecycle = "GRACE";
        } else {
          lifecycle = "EXPIRED";
        }
      } else {
        lifecycle = "ACTIVE";
      }
    }
  }

  const sub = station.stationSubscriptions[0];
  const plan = sub?.subscription;
  const currentPlanName = plan?.name ?? (station.status === "TRIAL" ? "Trial" : "None");
  const staffLimit = plan?.staffLimit ?? 3;
  const reportLimit = plan?.reportLimit ?? 50;

  const features: Record<string, boolean> = {
    staff: false,
    offers: false,
    analytics: false,
    recovery: false,
    finance: false,
    branding: false,
  };

  if (lifecycle !== "SUSPENDED") {
    if (plan?.planFeatures) {
      plan.planFeatures.forEach((pf) => {
        features[pf.featureKey.toLowerCase()] = pf.enabled;
        features[pf.featureKey.toUpperCase()] = pf.enabled;
      });
    }

    const offersVal = features["loyalty_programs"] || features["LOYALTY_PROGRAMS"] || false;
    features["offers"] = offersVal;
    features["OFFERS"] = offersVal;

    const reportsVal = features["service_reports"] || features["SERVICE_REPORTS"] || false;
    features["reports"] = reportsVal;
    features["REPORTS"] = reportsVal;
    features["finance"] = reportsVal;
    features["FINANCE"] = reportsVal;

    const recoveryVal = features["revenue_recovery"] || features["REVENUE_RECOVERY"] || false;
    features["recovery"] = recoveryVal;
    features["RECOVERY"] = recoveryVal;

    const analyticsVal = features["analytics"] || features["ANALYTICS"] || false;
    features["analytics"] = analyticsVal;
    features["ANALYTICS"] = analyticsVal;

    const staffVal = features["staff_management"] || features["STAFF_MANAGEMENT"] || false;
    features["staff"] = staffVal;
    features["STAFF"] = staffVal;

    const brandingVal = features["custom_branding"] || features["CUSTOM_BRANDING"] || false;
    features["branding"] = brandingVal;
    features["BRANDING"] = brandingVal;

    station.featureOverrides.forEach((override) => {
      const key = override.featureKey;
      const isEnabled = override.isEnabled;
      
      features[key.toLowerCase()] = isEnabled;
      features[key.toUpperCase()] = isEnabled;

      if (key === "LOYALTY_PROGRAMS") {
        features["offers"] = isEnabled;
        features["OFFERS"] = isEnabled;
      }
      if (key === "SERVICE_REPORTS") {
        features["reports"] = isEnabled;
        features["REPORTS"] = isEnabled;
        features["finance"] = isEnabled;
        features["FINANCE"] = isEnabled;
      }
      if (key === "REVENUE_RECOVERY") {
        features["recovery"] = isEnabled;
        features["RECOVERY"] = isEnabled;
      }
      if (key === "ANALYTICS") {
        features["analytics"] = isEnabled;
        features["ANALYTICS"] = isEnabled;
      }
      if (key === "STAFF_MANAGEMENT") {
        features["staff"] = isEnabled;
        features["STAFF"] = isEnabled;
      }
      if (key === "CUSTOM_BRANDING") {
        features["branding"] = isEnabled;
        features["BRANDING"] = isEnabled;
      }
    });

    // Evaluate full FEATURE_REGISTRY against plan and overrides
    const overridesMap: Record<string, boolean> = {};
    station.featureOverrides.forEach((override) => {
      overridesMap[override.featureKey] = override.isEnabled;
    });
    Object.keys(FEATURE_REGISTRY).forEach((fKey) => {
      const isAccessible = hasFeatureAccess(fKey, currentPlanName, overridesMap);
      features[fKey] = isAccessible;
      features[fKey.toLowerCase()] = isAccessible;
    });
  }

  const result: StationEntitlements = {
    lifecycle,
    features: features as any,
    staffLimit,
    reportLimit,
    currentPlanName,
    stationMetadata: {
      id: station.id,
      name: station.name,
      slug: station.slug,
      branchCode: station.branchCode,
      onboardingStatus: "COMPLETED",
      logoUrl: station.branding?.squareLogoUrl || null,
      primaryColor: station.branding?.primaryColor || "#0F172A",
      dueForVisitThreshold: 30,
      country: country?.code || "SA",
      currency: country?.currencyCode || "SAR",
      timezone: region?.timezone || "Asia/Riyadh",
      locale: country?.defaultLocale || "en-SA",
      isRTL: country?.isRTL || false,
      vipSpendThreshold: 10000,
      vipVisitThreshold: 5,
    },
  };

  entitlementCache.set(stationId, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
});

const userStationsCache = new Map<string, { data: { id: string; name: string; slug: string }[]; expiresAt: number }>();

export const getUserStations = cache(async (email: string, role: string): Promise<{ id: string; name: string; slug: string }[]> => {
  if (role !== "OWNER") return [];
  const now = Date.now();
  const cached = userStationsCache.get(email);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const memberships = await prisma.user.findMany({
    where: { email, role: "OWNER", isDeleted: false },
    select: { station: { select: { id: true, name: true, slug: true } } },
  });
  const data = memberships.map((m) => m.station).filter(Boolean) as { id: string; name: string; slug: string }[];
  userStationsCache.set(email, { data, expiresAt: now + CACHE_TTL_MS });
  return data;
});

export async function isFeatureEnabled(stationId: string, featureKey: string): Promise<boolean> {
  const entitlements = await getStationEntitlements(stationId);
  const normalizedKey = normalizeFeatureKey(featureKey);
  return entitlements.features[normalizedKey] || entitlements.features[featureKey.toLowerCase()] || false;
}

export async function checkSubscription(stationId: string): Promise<SubscriptionLifecycleState> {
  const entitlements = await getStationEntitlements(stationId);
  return entitlements.lifecycle;
}

let cachedPlans: { data: any[]; expiresAt: number } | null = null;

export const getCachedSubscriptionPlans = cache(async () => {
  const now = Date.now();
  if (cachedPlans && cachedPlans.expiresAt > now) {
    return cachedPlans.data;
  }
  const allPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
    include: { planFeatures: true },
  });
  cachedPlans = { data: allPlans, expiresAt: now + CACHE_TTL_MS };
  return allPlans;
});
