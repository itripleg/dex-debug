// /new-hooks/useFactoryContract.ts

import { useEffect } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";
import { type Address, formatEther, parseEther } from "viem";
import { formatFactoryValue } from "@/utils/tokenPriceFormatter";

// A custom hook that wraps useReadContract to add polling for live updates
function useLiveReadContract(hookParameters: any) {
  const { data, refetch, ...rest } = useReadContract(hookParameters);

  useEffect(() => {
    // Only set up the interval if the query is enabled
    if (hookParameters.query?.enabled === false) {
      return;
    }

    // Set up an interval to call the 'refetch' function every 4 seconds
    const intervalId = setInterval(() => {
      refetch();
    }, 4000); // 4000ms = 4 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [refetch, hookParameters.query?.enabled]);

  return { data, ...rest };
}

export function useFactoryContract() {
  const {
    writeContract,
    isPending: isWritePending,
    data: hash,
    ...writeRest
  } = useWriteContract();

  // Centralized formatter using the unified formatting function
  const formatValue = (
    value: bigint | undefined,
    precision: number = 6
  ): string => {
    return formatFactoryValue(value, precision);
  };

  // --- Read Operations now use the useLiveReadContract hook ---

  const useTokenState = (tokenAddress?: Address) => {
    return useLiveReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "getTokenState",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: !!tokenAddress,
      },
    });
  };

  const useCollateral = (tokenAddress?: Address) => {
    const { data, ...rest } = useLiveReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "collateral",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: !!tokenAddress,
      },
    });
    return {
      data: data as bigint | undefined,
      formatted: formatValue(data as bigint | undefined, 2),
      ...rest,
    };
  };

  const useCurrentPrice = (tokenAddress?: Address) => {
    const { data, ...rest } = useLiveReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "lastPrice",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: !!tokenAddress,
      },
    });
    return {
      data: data as bigint | undefined,
      formatted: formatValue(data as bigint | undefined, 6),
      ...rest,
    };
  };

  // --- Write Operations remain the same ---

  const createToken = (
    name: string,
    symbol: string,
    imageUrl: string,
    burnManager: Address
  ) => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "createToken",
      args: [name, symbol, imageUrl, burnManager],
    });
  };

  const buyTokens = (tokenAddress: Address, amount: string) => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "buy",
      args: [tokenAddress],
      value: parseEther(amount),
    });
  };

  const sellTokens = (tokenAddress: Address, amount: string) => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "sell",
      args: [tokenAddress, parseEther(amount)],
    });
  };

  // --- Final returned object ---

  return {
    useTokenState,
    useCollateral,
    useCurrentPrice,
    createToken,
    buyTokens,
    sellTokens,
    formatValue,
    isWritePending,
    writeHash: hash,
    ...writeRest,
  };
}
