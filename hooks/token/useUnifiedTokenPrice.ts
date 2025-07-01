// hooks/token/useUnifiedTokenPrice.ts
import { useMemo } from "react";
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { formatUnits } from "viem";
import { Address } from "viem";

interface UnifiedPriceData {
  raw: string; // Raw price as string (e.g., "0.000123")
  formatted: string; // Formatted for display (e.g., "0.000123")
  wei: bigint | undefined; // Raw wei value from contract
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

/**
 * Unified hook for token prices that all components should use.
 * This ensures consistent price data across TokenCard, TokenHeader, and Charts.
 * Now uses lastPrice (actual price from last trade) instead of calculated prices.
 */
export function useUnifiedTokenPrice(tokenAddress?: Address): UnifiedPriceData {
  const { useCurrentPrice } = useFactoryContract();

  // Get last price from factory contract (single source of truth)
  // Note: useCurrentPrice actually calls lastPrice under the hood now
  const {
    data: priceWei,
    isLoading,
    isError,
    error,
  } = useCurrentPrice(tokenAddress);

  const result = useMemo(() => {
    let rawPrice = "0";
    let formattedPrice = "0.000000";

    if (priceWei && priceWei > 0n) {
      try {
        rawPrice = formatUnits(priceWei, 18);
        formattedPrice = formatTokenPrice(rawPrice);
      } catch (error) {
        console.error("Error formatting price:", error);
      }
    }

    return {
      raw: rawPrice,
      formatted: formattedPrice,
      wei: priceWei,
      isLoading,
      error: error?.message || (isError ? "Failed to fetch price" : null),
      lastUpdated: Date.now(),
    };
  }, [priceWei, isLoading, isError, error]);

  return result;
}

/**
 * Hook for multiple token prices at once
 */
export function useUnifiedTokenPrices(tokenAddresses: Address[]) {
  const prices = tokenAddresses.reduce((acc, address) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    acc[address.toLowerCase()] = useUnifiedTokenPrice(address);
    return acc;
  }, {} as Record<string, UnifiedPriceData>);

  const isLoading = Object.values(prices).some((p) => p.isLoading);
  const hasError = Object.values(prices).some((p) => p.error);

  return {
    prices,
    isLoading,
    hasError,
    getPrice: (address: Address) =>
      prices[address.toLowerCase()] || {
        raw: "0",
        formatted: "0.000000",
        wei: undefined,
        isLoading: false,
        error: "Price not found",
        lastUpdated: 0,
      },
  };
}
