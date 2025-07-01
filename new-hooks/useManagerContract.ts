// hooks/contracts/useManagerContract.ts
import { 
    useWriteContract, 
    useSimulateContract 
  } from 'wagmi';
  import { MANAGER_ABI } from '@/types';
  import { type Address, parseEther } from 'viem';
  
  export function useManagerContract(managerAddress?: Address) {
    const { writeContract, isPending: isWritePending } = useWriteContract();
  
    const useBurnTokens = (tokenAddress?: Address, amount?: string) => {
      const simulation = useSimulateContract({
        address: managerAddress,
        abi: MANAGER_ABI,
        functionName: 'burnTokens',
        args: tokenAddress && amount 
          ? [tokenAddress, parseEther(amount)] 
          : undefined,
        query: {
          enabled: Boolean(managerAddress && tokenAddress && amount),
        }
      });
  
      const write = async () => {
        if (!managerAddress || !tokenAddress || !amount) {
          throw new Error('Manager address, token address and amount are required');
        }
        
        const hash = await writeContract({
          address: managerAddress,
          abi: MANAGER_ABI,
          functionName: 'burnTokens',
          args: [tokenAddress, parseEther(amount)]
        });
  
        return hash;
      };
  
      return {
        simulation,
        write,
        isPending: isWritePending
      };
    };
  
    const usePauseTrading = (tokenAddress?: Address) => {
      const simulation = useSimulateContract({
        address: managerAddress,
        abi: MANAGER_ABI,
        functionName: 'pauseTrading',
        args: tokenAddress ? [tokenAddress] : undefined,
        query: {
          enabled: Boolean(managerAddress && tokenAddress),
        }
      });
  
      const write = async () => {
        if (!managerAddress || !tokenAddress) {
          throw new Error('Manager address and token address are required');
        }
        
        const hash = await writeContract({
          address: managerAddress,
          abi: MANAGER_ABI,
          functionName: 'pauseTrading',
          args: [tokenAddress]
        });
  
        return hash;
      };
  
      return {
        simulation,
        write,
        isPending: isWritePending
      };
    };
  
    const useResumeTrading = (tokenAddress?: Address) => {
      const simulation = useSimulateContract({
        address: managerAddress,
        abi: MANAGER_ABI,
        functionName: 'resumeTrading',
        args: tokenAddress ? [tokenAddress] : undefined,
        query: {
          enabled: Boolean(managerAddress && tokenAddress),
        }
      });
  
      const write = async () => {
        if (!managerAddress || !tokenAddress) {
          throw new Error('Manager address and token address are required');
        }
        
        const hash = await writeContract({
          address: managerAddress,
          abi: MANAGER_ABI,
          functionName: 'resumeTrading',
          args: [tokenAddress]
        });
  
        return hash;
      };
  
      return {
        simulation,
        write,
        isPending: isWritePending
      };
    };
  
    return {
      useBurnTokens,
      usePauseTrading,
      useResumeTrading
    };
  }
  