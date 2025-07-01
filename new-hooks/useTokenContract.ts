// hooks/contracts/useTokenContract.ts
import { useReadContract } from 'wagmi';
import { TOKEN_ABI } from '@/types';
import { type Address, formatEther } from 'viem';

export function useTokenContract(tokenAddress?: Address) {
  const useName = () => {
    return useReadContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'name',
      query: {
        enabled: Boolean(tokenAddress),
      }
    });
  };

  const useSymbol = () => {
    return useReadContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'symbol',
      query: {
        enabled: Boolean(tokenAddress),
      }
    });
  };

  const useTotalSupply = () => {
    const { data, ...rest } = useReadContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'totalSupply',
      query: {
        enabled: Boolean(tokenAddress),
      }
    });

    return {
      data: data ? formatEther(data as bigint) : undefined,
      ...rest
    };
  };

  const useDecimals = () => {
    return useReadContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'decimals',
      query: {
        enabled: Boolean(tokenAddress),
      }
    });
  };

  return {
    useName,
    useSymbol,
    useTotalSupply,
    useDecimals
  };
}
