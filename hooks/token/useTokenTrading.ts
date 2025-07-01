import { useReadContract } from "wagmi";
import { formatUnits, parseUnits, Address } from "viem";
import { useEffect } from "react";
import { tokenEventEmitter } from "../../components/EventWatcher";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";
// Configuration for data staleness and garbage collection
const CONFIG = {
  // How often data should be refetched
  PRICE_STALE_TIME: 30_000, // 30 seconds
  COLLATERAL_STALE_TIME: 30_000, // 30 seconds
  STATE_STALE_TIME: 60_000, // 1 minute
  CALC_STALE_TIME: 15_000, // 15 seconds

  // How long to keep data in cache
  PRICE_GC_TIME: 60_000, // 1 minute
  COLLATERAL_GC_TIME: 60_000, // 1 minute
  STATE_GC_TIME: 120_000, // 2 minutes
  CALC_GC_TIME: 30_000, // 30 seconds

  // Event refetch delay
  EVENT_REFETCH_DELAY: 2000, // 2 seconds
} as const;

type TokenEventLog = {
  args: {
    token: string;
    buyer?: string;
    seller?: string;
    amount?: bigint;
    tokenAmount?: bigint;
    price?: bigint;
    ethAmount?: bigint;
    eventName: string;
    args: [];
  };
  eventName: string;
};

const useTokenDetails = (tokenAddress: Address, amountInAvax?: string) => {
  // Get price from factory contract
  const {
    data: priceData,
    refetch: refetchPrice,
    isError: isPriceError,
  } = useReadContract({
    abi: FACTORY_ABI,
    address: FACTORY_ADDRESS,
    functionName: "getCurrentPrice",
    args: [tokenAddress],
    query: {
      enabled: Boolean(tokenAddress),
      staleTime: CONFIG.PRICE_STALE_TIME,
      gcTime: CONFIG.PRICE_GC_TIME,
    },
  });

  // Get token's collateral from factory
  const {
    data: collateralData,
    refetch: refetchCollateral,
    isError: isCollateralError,
  } = useReadContract({
    abi: FACTORY_ABI,
    address: FACTORY_ADDRESS,
    functionName: "getCollateral",
    args: [tokenAddress],
    query: {
      enabled: Boolean(tokenAddress),
      staleTime: CONFIG.COLLATERAL_STALE_TIME,
      gcTime: CONFIG.COLLATERAL_GC_TIME,
    },
  });

  // Get token's state from factory
  const { data: tokenStateData, isError: isStateError } = useReadContract({
    abi: FACTORY_ABI,
    address: FACTORY_ADDRESS,
    functionName: "getTokenState",
    args: [tokenAddress],
    query: {
      enabled: Boolean(tokenAddress),
      staleTime: CONFIG.STATE_STALE_TIME,
      gcTime: CONFIG.STATE_GC_TIME,
    },
  });

  // Calculate tokens to receive for a given AVAX amount
  const { data: receiveAmountData } = useReadContract({
    abi: FACTORY_ABI,
    address: FACTORY_ADDRESS,
    functionName: "calculateTokenAmount",
    args: amountInAvax
      ? [tokenAddress, parseUnits(amountInAvax, 18)]
      : undefined,
    query: {
      enabled: Boolean(tokenAddress && amountInAvax),
      staleTime: CONFIG.CALC_STALE_TIME,
      gcTime: CONFIG.CALC_GC_TIME,
    },
  });

  // Subscribe to events using the event emitter
  useEffect(() => {
    if (!tokenAddress) return;

    const handleTokenEvent = (event: any) => {
      if (["TokensPurchased", "TokensSold"].includes(event.eventName)) {
        setTimeout(() => {
          refetchPrice();
          refetchCollateral();
        }, CONFIG.EVENT_REFETCH_DELAY);
      }
    };

    tokenEventEmitter.addEventListener(
      tokenAddress.toLowerCase(),
      handleTokenEvent
    );

    return () => {
      tokenEventEmitter.removeEventListener(
        tokenAddress.toLowerCase(),
        handleTokenEvent
      );
    };
  }, [tokenAddress, refetchPrice, refetchCollateral]);

  // Format the values if they exist
  const formattedPrice = priceData
    ? formatUnits(BigInt(priceData.toString()), 18)
    : "0";
  const formattedCollateral = collateralData
    ? formatUnits(BigInt(collateralData.toString()), 18)
    : "0";
  const formattedReceiveAmount = receiveAmountData
    ? formatUnits(BigInt(receiveAmountData.toString()), 18)
    : "0";

  // Consider loading complete if we either have data or encountered an error
  const isLoading = !(
    (priceData !== undefined || isPriceError) &&
    (collateralData !== undefined || isCollateralError) &&
    (tokenStateData !== undefined || isStateError)
  );

  return {
    price: formattedPrice,
    rawPrice: priceData,
    collateral: formattedCollateral,
    rawCollateral: collateralData,
    tokenState: Number(tokenStateData ?? 0),
    receiveAmount: formattedReceiveAmount,
    rawReceiveAmount: receiveAmountData,
    isLoading,
  };
};

export default useTokenDetails;
