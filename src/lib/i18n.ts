import enCommon from "../locales/en/common.json";
import arCommon from "../locales/ar/common.json";

export type SupportedLocale = "en-IN" | "en-SA" | "ar-SA" | "en-AE" | "ar-AE" | "en";

const DICTIONARIES: Record<string, Record<string, any>> = {
  en: enCommon,
  "en-SA": enCommon,
  "en-IN": enCommon,
  "en-AE": enCommon,
  ar: arCommon,
  "ar-SA": arCommon,
  "ar-AE": arCommon
};

/**
 * Retrieves a nested string key from the static locale dictionary.
 * Example: t("dashboard.metrics.activeJobs", "ar-SA")
 */
export function getTranslation(key: string, locale: SupportedLocale | string = "en-IN"): string {
  const langCode = locale.startsWith("ar") ? "ar" : "en";
  const dict = DICTIONARIES[langCode] || DICTIONARIES["en"];
  
  const parts = key.split(".");
  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return key; // Fallback to raw key if missing
    }
  }
  return typeof current === "string" ? current : key;
}

/**
 * Returns RTL ("rtl") or LTR ("ltr") direction string based on locale code.
 */
export function getLocaleDirection(locale: string = "en-IN"): "rtl" | "ltr" {
  return locale.startsWith("ar") ? "rtl" : "ltr";
}

/**
 * Formats monetary amounts using native Intl based on regional currency code and locale.
 */
export function formatCurrency(amount: number | string, currencyCode: string = "INR", locale: string = "en-IN"): string {
  const num = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(num);
  } catch {
    return `${currencyCode} ${num.toFixed(2)}`;
  }
}
