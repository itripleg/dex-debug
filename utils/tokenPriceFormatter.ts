// utils/tokenPriceFormatter.ts
import { formatUnits } from "viem";

/**
 * UNIFIED PRICE FORMATTING SYSTEM
 *
 * This file contains all price formatting functions to ensure consistency
 * across the entire application. All components should use these functions.
 */

// --- CORE FORMATTING FUNCTION ---

/**
 * The main price formatting function that all others should use
 * Handles very small numbers with appropriate precision
 */
export function formatTokenPrice(
  priceString: string | number,
  options?: {
    maxDecimals?: number;
    minDecimals?: number;
    useScientific?: boolean;
  }
): string {
  const {
    maxDecimals = 8,
    minDecimals = 6,
    useScientific = true,
  } = options || {};

  try {
    const price =
      typeof priceString === "string" ? parseFloat(priceString) : priceString;

    if (price === 0 || !Number.isFinite(price)) {
      return "0.000000";
    }

    // For very small numbers, use scientific notation
    if (useScientific && price < 0.000001) {
      return price.toExponential(2);
    }

    // For small numbers, use high precision
    if (price < 0.001) {
      return price.toFixed(maxDecimals);
    }

    // For normal numbers, use standard precision
    if (price < 1) {
      return price.toFixed(minDecimals);
    }

    // For larger numbers, use fewer decimals
    if (price < 1000) {
      return price.toFixed(4);
    }

    // For very large numbers, use localized formatting
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  } catch (error) {
    console.error("Error formatting price:", error);
    return "0.000000";
  }
}

// --- SPECIALIZED FORMATTERS (all use core function) ---

/**
 * For chart displays - slightly less precision for cleaner charts
 */
export function formatChartPrice(price: number): string {
  return formatTokenPrice(price, {
    maxDecimals: 6,
    minDecimals: 4,
    useScientific: false, // Charts work better without scientific notation
  });
}

/**
 * For factory contract values (collateral, etc.) - uses core formatter
 */
export function formatFactoryValue(
  value: bigint | undefined,
  precision: number = 6
): string {
  if (!value) return "0.000000";

  try {
    const formattedString = formatUnits(value, 18);
    return formatTokenPrice(formattedString, {
      maxDecimals: precision,
      minDecimals: Math.min(precision, 6),
    });
  } catch (error) {
    console.error("Error formatting factory value:", error);
    return "0.000000";
  }
}

/**
 * Convert bigint wei to number for chart calculations
 */
export function priceToNumber(priceWei: bigint): number {
  try {
    const formattedString = formatUnits(priceWei, 18);
    return parseFloat(formattedString);
  } catch (error) {
    console.error("Error converting price to number:", error);
    return 0;
  }
}

// --- VALIDATION AND UTILITIES ---

/**
 * Check if a price string is valid
 */
export function isValidPrice(price: string | number): boolean {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return Number.isFinite(num) && num >= 0;
}

/**
 * Compare two prices for equality within a tolerance
 */
export function pricesAreEqual(
  price1: string | number,
  price2: string | number,
  tolerance: number = 0.000001
): boolean {
  const p1 = typeof price1 === "string" ? parseFloat(price1) : price1;
  const p2 = typeof price2 === "string" ? parseFloat(price2) : price2;

  if (!isValidPrice(p1) || !isValidPrice(p2)) return false;

  return Math.abs(p1 - p2) <= tolerance;
}

/**
 * Format price with currency symbol
 */
export function formatPriceWithCurrency(
  price: string | number,
  currency: string = "AVAX"
): string {
  return `${formatTokenPrice(price)} ${currency}`;
}

// --- EXPORT ALL FOR EASY MIGRATION ---

// For components still using old names, provide aliases
export const formatPrice = formatTokenPrice; // Alias for migration
export const formatContractValue = formatFactoryValue; // Alias for migration

// Default export is the main formatter
export default formatTokenPrice;

/**
 * MIGRATION GUIDE:
 *
 * Replace these old calls:
 * - formatFactoryValue(value, precision) → formatTokenPrice(formatUnits(value, 18))
 * - formatChartPrice(price) → formatChartPrice(price) (no change)
 * - formatTokenPrice(price) → formatTokenPrice(price) (no change)
 *
 * All formatters now use the same core logic for consistency.
 */
