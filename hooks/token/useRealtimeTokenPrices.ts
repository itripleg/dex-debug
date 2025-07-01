// Save this as: hooks/token/useRealtimeTokenPrices.ts

import { useState, useEffect, useMemo } from "react";
import { useReadContracts } from "wagmi";
import { formatUnits, type Abi, type Address } from "viem";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";
import { tokenEventEmitter } from "@/components/EventWatcher";

interface PriceData {
  raw: string;
  formatted: string;
  lastUpdated: number;
}

interface UseRealtimeTokenPricesOptions {
  refreshInterval?: number; // How often to poll for updates (ms)
  eventRefreshDelay?: number; // Delay after trade events before refetching (ms)
  enableEventListening?: boolean; // Whether to listen for trade events
}

const DEFAULT_OPTIONS: Required<UseRealtimeTokenPricesOptions> = {
  refreshInterval: 15000, // 15 seconds
  eventRefreshDelay: 2000, // 2 seconds
  enableEventListening: true,
};

// Enhanced price formatter
export const formatTokenPrice = (priceString: string): string => {
  try {
    const price = parseFloat(priceString);

    if (price === 0) return "0.000000";

    // For very small numbers, use scientific notation
    if (price < 0.000001) {
      return price.toExponential(2);
    } else if (price < 0.001) {
      return price.toFixed(8);
    } else if (price < 1) {
      return price.toFixed(6);
    } else if (price < 1000) {
      return price.toFixed(4);
    } else {
      return price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
    }
  } catch {
    return "0.000000";
  }
};

export function useRealtimeTokenPrices(
  tokenAddresses: Address[],
  options: UseRealtimeTokenPricesOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [lastEventUpdate, setLastEventUpdate] = useState(0);

  // Contract configuration
  const factoryContract = {
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI as Abi,
  } as const;

  // Fetch prices from contract
  const {
    data: pricesData,
    refetch,
    isLoading,
    error,
  } = useReadContracts({
    contracts: tokenAddresses.map((address) => ({
      ...factoryContract,
      functionName: "lastPrice" as const,
      args: [address] as const,
    })),
    query: {
      refetchInterval: opts.refreshInterval,
      staleTime: opts.refreshInterval / 3, // Consider data stale after 1/3 of refresh interval
      enabled: tokenAddresses.length > 0,
    },
  });

  // Listen for trade events if enabled
  useEffect(() => {
    if (!opts.enableEventListening || tokenAddresses.length === 0) return;

    const handleTradeEvent = (event: any) => {
      if (["TokensPurchased", "TokensSold"].includes(event.eventName)) {
        console.log(
          `🔄 Trade detected for ${event.tokenAddress}, refreshing prices...`
        );

        // Trigger a refresh after a delay to allow backend processing
        setTimeout(() => {
          refetch();
          setLastEventUpdate(Date.now());
        }, opts.eventRefreshDelay);
      }
    };

    // Listen to events for all tokens
    tokenAddresses.forEach((address) => {
      tokenEventEmitter.addEventListener(
        address.toLowerCase(),
        handleTradeEvent
      );
    });

    return () => {
      tokenAddresses.forEach((address) => {
        tokenEventEmitter.removeEventListener(
          address.toLowerCase(),
          handleTradeEvent
        );
      });
    };
  }, [
    tokenAddresses,
    opts.enableEventListening,
    opts.eventRefreshDelay,
    refetch,
  ]);

  // Process prices into a lookup object
  const prices = useMemo(() => {
    const result: Record<string, PriceData> = {};

    tokenAddresses.forEach((address, index) => {
      const priceResult = pricesData?.[index]?.result;
      let rawPrice = "0";

      try {
        rawPrice = priceResult
          ? formatUnits(BigInt(priceResult.toString()), 18)
          : "0";
      } catch (error) {
        console.warn(`Failed to format price for ${address}:`, error);
        rawPrice = "0";
      }

      result[address.toLowerCase()] = {
        raw: rawPrice,
        formatted: formatTokenPrice(rawPrice),
        lastUpdated: Date.now(),
      };
    });

    return result;
  }, [pricesData, tokenAddresses, lastEventUpdate]); // Include lastEventUpdate to trigger updates

  // Helper function to get price for a specific token
  const getPrice = (address: Address): PriceData => {
    return (
      prices[address.toLowerCase()] || {
        raw: "0",
        formatted: "0.000000",
        lastUpdated: 0,
      }
    );
  };

  // Manual refresh function
  const refreshPrices = () => {
    refetch();
  };

  return {
    prices,
    getPrice,
    refreshPrices,
    isLoading,
    error: error?.message || null,
    lastUpdate: Math.max(...Object.values(prices).map((p) => p.lastUpdated)),
  };
}

// Simplified hook for a single token
export function useRealtimeTokenPrice(
  tokenAddress?: Address,
  options: UseRealtimeTokenPricesOptions = {}
) {
  const addresses = tokenAddress ? [tokenAddress] : [];
  const { getPrice, isLoading, error, refreshPrices } = useRealtimeTokenPrices(
    addresses,
    options
  );

  const price = tokenAddress
    ? getPrice(tokenAddress)
    : {
        raw: "0",
        formatted: "0.000000",
        lastUpdated: 0,
      };

  return {
    price,
    isLoading,
    error,
    refreshPrice: refreshPrices,
  };
}
