import { prisma } from "@/lib/prisma";
import { cache } from "react";

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
    onboardingStatus: string;
    logoUrl: string | null;
    primaryColor: string | null;
    dueForVisitThreshold: number;
    country?: string;
    currency?: string;
    timezone?: string;
  };
};

// Memory cache to hold entitlement results with a 60-second TTL
const entitlementCache = new Map<string, { data: StationEntitlements; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

const FEATURE_KEY_MAPPING: Record<string, string> = {
  offers: "LOYALTY_PROGRAMS",
  reports: "SERVICE_REPORTS",
  recovery: "REVENUE_RECOVERY",
  analytics: "ANALYTICS",
  finance: "SERVICE_REPORTS", // finance/expenses is mapped to SERVICE_REPORTS so Starter+ gets it
  staff: "STAFF_MANAGEMENT",
  branding: "CUSTOM_BRANDING",
};

/**
 * Normalizes and resolves a feature key to its standard uppercase representation.
 */
export function normalizeFeatureKey(featureKey: string): string {
  const key = featureKey.toLowerCase();
  if (FEATURE_KEY_MAPPING[key]) {
    return FEATURE_KEY_MAPPING[key];
  }
  return featureKey.toUpperCase();
}

/**
 * High-Performance Batched Entitlement Resolver.
 * Resolves station status, subscription plan details, feature flags, and overrides
 * in a single, unified database query. Prevents N+1 database queries.
 * Caches the result in server memory for 60 seconds to make page loads instant.
 */
export const getStationEntitlements = cache(async (stationId: string): Promise<StationEntitlements> => {
  const now = Date.now();
  const cached = entitlementCache.get(stationId);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const station = await prisma.station.findUnique({
    where: { id: stationId },
    include: {
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

  if (!station) {
    return {
      lifecycle: "EXPIRED",
      features: { staff: false, offers: false, analytics: false, recovery: false, finance: false, branding: false },
      staffLimit: 1,
      reportLimit: 10,
      currentPlanName: "None",
    };
  }

  // 1. Resolve Subscription Lifecycle State
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
        lifecycle = sub.status as SubscriptionLifecycleState;
      }
    }
  }

  // 2. Resolve Plan limits & info
  const activeSub = station.stationSubscriptions[0];
  const plan = activeSub?.subscription;
  const currentPlanName = plan?.name || "Trial Plan";
  const staffLimit = plan?.staffLimit ?? 1;
  const reportLimit = plan?.reportLimit ?? 10;

  // 3. Resolve Feature Flags
  const features: Record<string, boolean> = {
    staff: false,
    offers: false,
    analytics: false,
    recovery: false,
    finance: false,
    branding: false,
  };

  // If the station is suspended, no features are enabled
  if (lifecycle !== "SUSPENDED") {
    // 3a. Populate plan default features
    if (plan?.planFeatures) {
      plan.planFeatures.forEach((pf) => {
        features[pf.featureKey.toLowerCase()] = pf.enabled;
        features[pf.featureKey.toUpperCase()] = pf.enabled;
      });
    }

    // 3b. Apply standard mappings for legacy compatibility
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

    // 3c. Apply station overrides (takes absolute precedence)
    station.featureOverrides.forEach((override) => {
      const key = override.featureKey;
      const isEnabled = override.isEnabled;
      
      features[key.toLowerCase()] = isEnabled;
      features[key.toUpperCase()] = isEnabled;

      // Map overrides accurately
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
      onboardingStatus: station.onboardingStatus,
      logoUrl: station.logoUrl,
      primaryColor: station.primaryColor,
      dueForVisitThreshold: station.dueForVisitThreshold ?? 30,
      country: station.country || "IND",
      currency: station.currency || "INR",
      timezone: station.timezone || "Asia/Kolkata",
    },
  };

  entitlementCache.set(stationId, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
});

// Memory cache for user station memberships with 60s TTL
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

/**
 * Check if a specific feature is enabled for a station.
 * Optimized to use the high-performance batched resolver.
 */
export async function isFeatureEnabled(stationId: string, featureKey: string): Promise<boolean> {
  const entitlements = await getStationEntitlements(stationId);
  const normalizedKey = normalizeFeatureKey(featureKey);
  return entitlements.features[normalizedKey] || entitlements.features[featureKey.toLowerCase()] || false;
}

/**
 * Returns the current lifecycle state of a station's subscription.
 * Optimized to use the high-performance batched resolver.
 */
export async function checkSubscription(stationId: string): Promise<SubscriptionLifecycleState> {
  const entitlements = await getStationEntitlements(stationId);
  return entitlements.lifecycle;
}

// Memory cache for subscription plans with 60s TTL
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
