/**
 * WashDeck V3.1 — Currency & Date Formatting Utilities
 *
 * All monetary and date values must be formatted using these helpers.
 * No hardcoded currency symbols (₹, $, etc.) anywhere in the codebase.
 * Supports multi-currency, multi-timezone, and multi-date-format international stations.
 */

// ─── Supported Currencies ────────────────────────────────────────────────────

export const SUPPORTED_CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee",         locale: "en-IN" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham",          locale: "ar-AE" },
  { code: "USD", symbol: "$", name: "US Dollar",             locale: "en-US" },
  { code: "GBP", symbol: "£", name: "British Pound",         locale: "en-GB" },
  { code: "EUR", symbol: "€", name: "Euro",                  locale: "de-DE" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal",           locale: "ar-SA" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar",     locale: "en-SG" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit",    locale: "ms-MY" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal",         locale: "ar-QA" },
  { code: "OMR", symbol: "﷼", name: "Omani Rial",           locale: "ar-OM" },
  { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar",    locale: "ar-BH" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar",      locale: "ar-KW" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

// ─── Currency Formatting ─────────────────────────────────────────────────────

/**
 * Format a monetary amount using the station's configured currency.
 *
 * @param amount    - Numeric amount (can be string from Prisma Decimal)
 * @param currency  - ISO 4217 currency code (e.g. "INR", "AED", "USD")
 * @param options   - Optional Intl.NumberFormat options override
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = "INR",
  options?: Intl.NumberFormatOptions
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return "—";

  const currencyDef = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  const locale = currencyDef?.locale ?? "en-IN";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(num);
  } catch {
    // Fallback: prepend symbol manually
    const symbol = currencyDef?.symbol ?? currency;
    return `${symbol}${num.toLocaleString()}`;
  }
}

/**
 * Format a compact monetary amount (e.g. ₹1.2L, $12K, AED 1.5M).
 */
export function formatCurrencyCompact(
  amount: number | string | null | undefined,
  currency: string = "INR"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return "—";

  const currencyDef = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  const locale = currencyDef?.locale ?? "en-IN";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      compactDisplay: "short",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(num);
  } catch {
    return formatCurrency(num, currency);
  }
}

// ─── Supported Timezones ─────────────────────────────────────────────────────

export const SUPPORTED_TIMEZONES = [
  { tz: "Asia/Kolkata",    label: "India Standard Time (IST, UTC+5:30)" },
  { tz: "Asia/Dubai",      label: "Gulf Standard Time (GST, UTC+4)" },
  { tz: "America/New_York", label: "Eastern Time (ET, UTC-5/-4)" },
  { tz: "America/Los_Angeles", label: "Pacific Time (PT, UTC-8/-7)" },
  { tz: "Europe/London",   label: "Greenwich Mean Time (GMT, UTC+0/+1)" },
  { tz: "Europe/Berlin",   label: "Central European Time (CET, UTC+1/+2)" },
  { tz: "Asia/Singapore",  label: "Singapore Standard Time (SGT, UTC+8)" },
  { tz: "Asia/Kuala_Lumpur", label: "Malaysia Time (MYT, UTC+8)" },
  { tz: "Asia/Riyadh",     label: "Arabia Standard Time (AST, UTC+3)" },
  { tz: "Asia/Qatar",      label: "Arabia Standard Time (AST, UTC+3)" },
  { tz: "Asia/Kuwait",     label: "Arabia Standard Time (AST, UTC+3)" },
  { tz: "Asia/Muscat",     label: "Gulf Standard Time (GST, UTC+4)" },
  { tz: "Asia/Bahrain",    label: "Arabia Standard Time (AST, UTC+3)" },
  { tz: "UTC",             label: "Coordinated Universal Time (UTC)" },
] as const;

// ─── Date Formatting ─────────────────────────────────────────────────────────

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "DD MMM YYYY";

/**
 * Format a date using the station's configured date format and timezone.
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: DateFormat = "DD/MM/YYYY",
  timezone: string = "Asia/Kolkata"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(d);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const day = get("day");
    const month = get("month");
    const year = get("year");
    const monthName = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      month: "short",
    }).format(d);

    switch (format) {
      case "DD/MM/YYYY": return `${day}/${month}/${year}`;
      case "MM/DD/YYYY": return `${month}/${day}/${year}`;
      case "YYYY-MM-DD": return `${year}-${month}-${day}`;
      case "DD MMM YYYY": return `${day} ${monthName} ${year}`;
      default: return `${day}/${month}/${year}`;
    }
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Format a date with time.
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  timezone: string = "Asia/Kolkata"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Format time only.
 */
export function formatTime(
  date: Date | string | null | undefined,
  timezone: string = "Asia/Kolkata"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

/**
 * Get a human-readable relative time string (e.g. "3 days ago", "in 5 hours").
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const now = Date.now();
  const diff = d.getTime() - now;
  const absDiff = Math.abs(diff);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year",   365 * 24 * 60 * 60 * 1000],
    ["month",  30  * 24 * 60 * 60 * 1000],
    ["week",   7   * 24 * 60 * 60 * 1000],
    ["day",    24  * 60 * 60 * 1000],
    ["hour",   60  * 60 * 1000],
    ["minute", 60  * 1000],
    ["second", 1000],
  ];

  for (const [unit, ms] of units) {
    if (absDiff >= ms) {
      const value = Math.round(diff / ms);
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(value, unit);
    }
  }
  return "just now";
}

/**
 * Get days remaining until a date (positive = future, negative = past).
 */
export function daysRemaining(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Get a styled label for days remaining (used in subscription expiry display).
 */
export function getDaysRemainingLabel(days: number | null): {
  label: string;
  colorClass: string;
} {
  if (days === null) return { label: "Unknown", colorClass: "text-slate-400" };
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, colorClass: "text-red-600" };
  if (days === 0) return { label: "Expires today", colorClass: "text-red-600" };
  if (days <= 7) return { label: `${days}d left`, colorClass: "text-red-600" };
  if (days <= 30) return { label: `${days}d left`, colorClass: "text-amber-600" };
  return { label: `${days}d left`, colorClass: "text-emerald-600" };
}

// ─── Supported Countries ─────────────────────────────────────────────────────

export const SUPPORTED_COUNTRIES = [
  { code: "IN", name: "India",               currency: "INR", timezone: "Asia/Kolkata",     flag: "🇮🇳", phoneFormat: "+91" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", timezone: "Asia/Dubai",       flag: "🇦🇪", phoneFormat: "+971" },
  { code: "SA", name: "Saudi Arabia",        currency: "SAR", timezone: "Asia/Riyadh",      flag: "🇸🇦", phoneFormat: "+966" },
  { code: "QA", name: "Qatar",               currency: "QAR", timezone: "Asia/Qatar",        flag: "🇶🇦", phoneFormat: "+974" },
  { code: "KW", name: "Kuwait",              currency: "KWD", timezone: "Asia/Kuwait",       flag: "🇰🇼", phoneFormat: "+965" },
  { code: "OM", name: "Oman",                currency: "OMR", timezone: "Asia/Muscat",       flag: "🇴🇲", phoneFormat: "+968" },
  { code: "BH", name: "Bahrain",             currency: "BHD", timezone: "Asia/Bahrain",      flag: "🇧🇭", phoneFormat: "+973" },
  { code: "SG", name: "Singapore",           currency: "SGD", timezone: "Asia/Singapore",    flag: "🇸🇬", phoneFormat: "+65" },
  { code: "MY", name: "Malaysia",            currency: "MYR", timezone: "Asia/Kuala_Lumpur", flag: "🇲🇾", phoneFormat: "+60" },
  { code: "US", name: "United States",       currency: "USD", timezone: "America/New_York",  flag: "🇺🇸", phoneFormat: "+1" },
  { code: "GB", name: "United Kingdom",      currency: "GBP", timezone: "Europe/London",     flag: "🇬🇧", phoneFormat: "+44" },
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]["code"];

export function getCountryByCode(code: string) {
  return SUPPORTED_COUNTRIES.find((c) => c.code === code);
}

export function getDefaultsForCountry(countryCode: string) {
  const country = getCountryByCode(countryCode);
  return {
    currency: country?.currency ?? "INR",
    timezone: country?.timezone ?? "Asia/Kolkata",
    phoneFormat: country?.phoneFormat ?? "+91",
    flag: country?.flag ?? "🌍",
  };
}
