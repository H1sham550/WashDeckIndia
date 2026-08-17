import { describe, it, expect } from "vitest";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";

describe("Currency Utilities", () => {
  it("formats standard INR amounts with rupee symbol and thousands separator", () => {
    expect(formatCurrency(0)).toBe("₹0");
    expect(formatCurrency(500)).toBe("₹500");
    expect(formatCurrency(1500)).toBe("₹1,500");
    expect(formatCurrency(250000)).toBe("₹2,50,000");
  });

  it("handles decimal values properly without trailing float artifacts", () => {
    expect(formatCurrency(499.5)).toBe("₹499.5");
    expect(formatCurrency(1200.0)).toBe("₹1,200");
  });

  it("formats compact currency abbreviations correctly", () => {
    expect(formatCurrencyCompact(500)).toBe("₹500");
    expect(formatCurrencyCompact(1500)).toBe("₹1.5K");
    expect(formatCurrencyCompact(150000)).toBe("₹1.5L");
  });
});
