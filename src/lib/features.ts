export type FeatureCategory = "OPERATIONS" | "FINANCE" | "CRM" | "MARKETING" | "INTEGRATIONS" | "ENTERPRISE";
export type SubscriptionTier = "Starter" | "Professional" | "Enterprise";

export interface FeatureDefinition {
  key: string;
  displayName: string;
  description: string;
  category: FeatureCategory;
  navigationGroup: string;
  iconName: string; // Lucide icon name string representation for universal mapping
  isComingSoon: boolean;
  minSubscriptionPlan: SubscriptionTier;
  defaultEnabled: boolean;
}

export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
  JOB_CARDS: {
    key: "JOB_CARDS",
    displayName: "Job Cards & Intake",
    description: "Zero-friction vehicle registration, service selection, and digital inspection tracking.",
    category: "OPERATIONS",
    navigationGroup: "Operations",
    iconName: "ClipboardList",
    isComingSoon: false,
    minSubscriptionPlan: "Starter",
    defaultEnabled: true
  },
  VEHICLE_HISTORY: {
    key: "VEHICLE_HISTORY",
    displayName: "Vehicle History & Tracking",
    description: "Instant access to past visits, service records, and VIP notes upon registration lookup.",
    category: "OPERATIONS",
    navigationGroup: "Operations",
    iconName: "Car",
    isComingSoon: false,
    minSubscriptionPlan: "Starter",
    defaultEnabled: true
  },
  BOOKINGS: {
    key: "BOOKINGS",
    displayName: "Appointments & Queue",
    description: "Online booking intake, lead time management, and live bay queue tracking.",
    category: "OPERATIONS",
    navigationGroup: "Operations",
    iconName: "Calendar",
    isComingSoon: false,
    minSubscriptionPlan: "Starter",
    defaultEnabled: true
  },
  PHOTO_DOCUMENTATION: {
    key: "PHOTO_DOCUMENTATION",
    displayName: "Mandatory Job Photo Capture",
    description: "Enforce multi-angle vehicle photo documentation with audit-logged owner bypass overrides.",
    category: "OPERATIONS",
    navigationGroup: "Operations",
    iconName: "Camera",
    isComingSoon: false,
    minSubscriptionPlan: "Starter",
    defaultEnabled: true
  },
  INVOICING: {
    key: "INVOICING",
    displayName: "Invoices & Billing",
    description: "Structured multi-stage invoices (Draft, Issued, Paid, Cancelled, Refunded) with tax compliance.",
    category: "FINANCE",
    navigationGroup: "Finance",
    iconName: "Receipt",
    isComingSoon: false,
    minSubscriptionPlan: "Starter",
    defaultEnabled: true
  },
  PAYMENTS_ONLINE: {
    key: "PAYMENTS_ONLINE",
    displayName: "Online Payment Gateways",
    description: "Direct POS, UPI, Mada, Apple Pay, and payment gateway checkout links.",
    category: "FINANCE",
    navigationGroup: "Finance",
    iconName: "CreditCard",
    isComingSoon: false,
    minSubscriptionPlan: "Professional",
    defaultEnabled: true
  },
  EXPENSE_TRACKING: {
    key: "EXPENSE_TRACKING",
    displayName: "Expense & Cost Control",
    description: "Track station operational expenses, salaries, supply replenishment, and net profitability.",
    category: "FINANCE",
    navigationGroup: "Finance",
    iconName: "Wallet",
    isComingSoon: false,
    minSubscriptionPlan: "Professional",
    defaultEnabled: true
  },
  CUSTOMER_CRM: {
    key: "CUSTOMER_CRM",
    displayName: "Customer Directory & CRM",
    description: "Manage vehicle owners, visit thresholds, VIP spend tags, and contact records.",
    category: "CRM",
    navigationGroup: "Customers",
    iconName: "Users",
    isComingSoon: false,
    minSubscriptionPlan: "Starter",
    defaultEnabled: true
  },
  LOYALTY_OFFERS: {
    key: "LOYALTY_OFFERS",
    displayName: "Loyalty & Automated Offers",
    description: "Configurable visit-based rewards, vehicle-specific promotions, and automatic redemption checks.",
    category: "MARKETING",
    navigationGroup: "Marketing",
    iconName: "Gift",
    isComingSoon: false,
    minSubscriptionPlan: "Professional",
    defaultEnabled: true
  },
  WHATSAPP_AUTOMATION: {
    key: "WHATSAPP_AUTOMATION",
    displayName: "WhatsApp Automated Alerts",
    description: "Automated inspection report delivery, ready-for-pickup notifications, and invoice links via WhatsApp.",
    category: "MARKETING",
    navigationGroup: "Marketing",
    iconName: "MessageSquare",
    isComingSoon: false,
    minSubscriptionPlan: "Professional",
    defaultEnabled: true
  },
  INVENTORY_MANAGEMENT: {
    key: "INVENTORY_MANAGEMENT",
    displayName: "Supplies & Inventory",
    description: "Stock tracking for chemical drums, microfiber towels, ceramic bottles, and restock alerts.",
    category: "OPERATIONS",
    navigationGroup: "Operations",
    iconName: "Boxes",
    isComingSoon: false,
    minSubscriptionPlan: "Professional",
    defaultEnabled: true
  },
  STAFF_ATTENDANCE: {
    key: "STAFF_ATTENDANCE",
    displayName: "Staff Attendance & Logs",
    description: "Daily check-in/check-out tracking, shift status, and labor assignment monitoring.",
    category: "OPERATIONS",
    navigationGroup: "Team",
    iconName: "UserCheck",
    isComingSoon: false,
    minSubscriptionPlan: "Professional",
    defaultEnabled: true
  },
  WHITE_LABEL_PORTAL: {
    key: "WHITE_LABEL_PORTAL",
    displayName: "Custom Domain & White Label",
    description: "Custom booking domains, personalized email senders, and bespoke theme styling.",
    category: "ENTERPRISE",
    navigationGroup: "Settings",
    iconName: "Globe",
    isComingSoon: false,
    minSubscriptionPlan: "Enterprise",
    defaultEnabled: true
  },
  MULTI_BRANCH_ANALYTICS: {
    key: "MULTI_BRANCH_ANALYTICS",
    displayName: "Multi-Branch Consolidated BI",
    description: "Cross-station group comparisons, regional revenue rollups, and corporate performance dashboards.",
    category: "ENTERPRISE",
    navigationGroup: "Analytics",
    iconName: "BarChart3",
    isComingSoon: false,
    minSubscriptionPlan: "Enterprise",
    defaultEnabled: true
  },
  AI_DAMAGE_DETECTION: {
    key: "AI_DAMAGE_DETECTION",
    displayName: "AI Vision Damage Assessment",
    description: "Automated scratch, dent, and existing wear detection via computer vision intake analysis.",
    category: "INTEGRATIONS",
    navigationGroup: "Operations",
    iconName: "Sparkles",
    isComingSoon: true,
    minSubscriptionPlan: "Enterprise",
    defaultEnabled: false
  }
};

/**
 * Checks if a feature key is accessible based on station subscription tier and local overrides.
 */
export function hasFeatureAccess(
  featureKey: string,
  stationSubscriptionPlanName: string = "Professional",
  overrides: Record<string, boolean> = {}
): boolean {
  const def = FEATURE_REGISTRY[featureKey];
  if (!def) return false;
  if (def.isComingSoon) return false;

  if (featureKey in overrides) {
    return overrides[featureKey];
  }

  const tierHierarchy: Record<SubscriptionTier, number> = {
    Starter: 1,
    Professional: 2,
    Enterprise: 3
  };

  const userTierWeight = tierHierarchy[stationSubscriptionPlanName as SubscriptionTier] || 2;
  const reqTierWeight = tierHierarchy[def.minSubscriptionPlan] || 1;

  return userTierWeight >= reqTierWeight;
}

export function getGroupedFeatures() {
  const groups: Record<string, FeatureDefinition[]> = {};
  Object.values(FEATURE_REGISTRY).forEach((feature) => {
    if (!groups[feature.navigationGroup]) {
      groups[feature.navigationGroup] = [];
    }
    groups[feature.navigationGroup].push(feature);
  });
  return groups;
}
