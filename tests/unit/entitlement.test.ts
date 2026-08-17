import { describe, it, expect } from "vitest";
import { normalizeFeatureKey } from "@/lib/entitlement";
import { hasFeatureAccess, FEATURE_REGISTRY } from "@/lib/features";

describe("Entitlements & Feature Access", () => {
  it("normalizes lowercase and mapped feature keys", () => {
    expect(normalizeFeatureKey("offers")).toBe("LOYALTY_PROGRAMS");
    expect(normalizeFeatureKey("staff")).toBe("STAFF_MANAGEMENT");
    expect(normalizeFeatureKey("branding")).toBe("CUSTOM_BRANDING");
    expect(normalizeFeatureKey("CUSTOM_KEY")).toBe("CUSTOM_KEY");
  });

  it("grants Starter plan access to foundational operations", () => {
    expect(hasFeatureAccess("JOB_CARDS", "Starter")).toBe(true);
    expect(hasFeatureAccess("VEHICLE_HISTORY", "Starter")).toBe(true);
    expect(hasFeatureAccess("BOOKINGS", "Starter")).toBe(true);
  });

  it("restricts Professional features for Starter plans unless overridden", () => {
    expect(hasFeatureAccess("EXPENSE_TRACKING", "Starter")).toBe(false);
    expect(hasFeatureAccess("LOYALTY_OFFERS", "Starter")).toBe(false);

    // With explicit station override
    expect(hasFeatureAccess("EXPENSE_TRACKING", "Starter", { EXPENSE_TRACKING: true })).toBe(true);
  });

  it("grants Professional and Enterprise tiers access to advanced features", () => {
    expect(hasFeatureAccess("EXPENSE_TRACKING", "Professional")).toBe(true);
    expect(hasFeatureAccess("LOYALTY_OFFERS", "Professional")).toBe(true);
    expect(hasFeatureAccess("WHITE_LABEL_PORTAL", "Enterprise")).toBe(true);
  });

  it("blocks coming-soon features across all tiers", () => {
    expect(hasFeatureAccess("AI_DAMAGE_DETECTION", "Enterprise")).toBe(false);
  });
});
