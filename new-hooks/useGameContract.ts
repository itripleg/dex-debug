// new-hooks/useGameContract.ts

import { useEffect, useState } from "react";
import {
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
  useAccount,
} from "wagmi";
import { type Address, formatUnits, parseUnits } from "viem";
// import { formatFactoryValue } from "@/utils/tokenPriceFormatter";

// Game contract address
const GAME_CONTRACT_ADDRESS =
  "0xD8DbDFC6542CD1929803e655742EBC573ffC884A" as Address;

// BBT Token address
const BBT_TOKEN_ADDRESS =
  "0x03F86069C82762110ABeb60CaF6Bc31e7d1C1506" as Address;

// Game contract ABI (extracted from your smart contract)
const GAME_CONTRACT_ABI = [
  // Read functions
  {
    inputs: [{ name: "gameId", type: "uint256" }],
    name: "getGame",
    outputs: [
      {
        components: [
          { name: "gameId", type: "uint256" },
          { name: "player", type: "address" },
          { name: "token", type: "address" },
          { name: "burnedAmount", type: "uint256" },
          { name: "gameType", type: "uint8" },
          { name: "outcome", type: "uint8" },
          { name: "rewardAmount", type: "uint256" },
          { name: "aiMessage", type: "string" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "completed", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "player", type: "address" }],
    name: "getPlayerGames",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "player", type: "address" }],
    name: "getPlayerActiveGames",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGameStats",
    outputs: [
      { name: "totalGames", type: "uint256" },
      { name: "completedGames", type: "uint256" },
      { name: "activeGames", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getRewardPool",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "gameType", type: "uint8" }],
    name: "getGameConfig",
    outputs: [
      {
        components: [
          { name: "minBurnAmount", type: "uint256" },
          { name: "maxRewardMultiplier", type: "uint256" },
          { name: "winProbability", type: "uint256" },
          { name: "enabled", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [
      { name: "gameId", type: "uint256" },
      { name: "outcome", type: "uint8" },
      { name: "aiMessage", type: "string" },
    ],
    name: "completeGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "gameId", type: "uint256" },
      { indexed: true, name: "player", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { name: "burnedAmount", type: "uint256" },
      { name: "gameType", type: "uint8" },
      { name: "timestamp", type: "uint256" },
    ],
    name: "GameStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "gameId", type: "uint256" },
      { indexed: true, name: "player", type: "address" },
      { name: "outcome", type: "uint8" },
      { name: "rewardAmount", type: "uint256" },
      { name: "aiMessage", type: "string" },
      { name: "timestamp", type: "uint256" },
    ],
    name: "GameCompleted",
    type: "event",
  },
] as const;

// BBT Token ABI (just what we need)
const BBT_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Game types enum
export enum GameType {
  QUICK_BATTLE = 0,
  ARENA_FIGHT = 1,
  BOSS_BATTLE = 2,
}

export enum GameOutcome {
  PLAYER_VICTORY = 0,
  AI_VICTORY = 1,
  DRAW = 2,
  EPIC_VICTORY = 3,
}

// Interfaces
export interface GameSession {
  gameId: number;
  player: Address;
  token: Address;
  burnedAmount: string;
  gameType: GameType;
  outcome: GameOutcome;
  rewardAmount: string;
  aiMessage: string;
  startTime: number;
  endTime: number;
  completed: boolean;
}

export interface GameConfig {
  minBurnAmount: string;
  maxRewardMultiplier: number;
  winProbability: number;
  enabled: boolean;
}

export interface GameStats {
  totalGames: number;
  completedGames: number;
  activeGames: number;
}

export function useGameContract() {
  const { address } = useAccount();
  const { writeContract, isPending: isWritePending } = useWriteContract();
  const [lastEventUpdate, setLastEventUpdate] = useState(0);

  // Contract configuration
  const gameContract = {
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
  } as const;

  const bbtContract = {
    address: BBT_TOKEN_ADDRESS,
    abi: BBT_TOKEN_ABI,
  } as const;

  // Read BBT Balance (much less frequent)
  const {
    data: bbtBalanceData,
    refetch: refetchBalance,
    isLoading: isBalanceLoading,
  } = useReadContract({
    ...bbtContract,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      refetchInterval: 60000, // Reduced to 1 minute
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
  });

  // Read Game Stats (less frequent)
  const {
    data: gameStatsData,
    refetch: refetchGameStats,
    isLoading: isGameStatsLoading,
  } = useReadContract({
    ...gameContract,
    functionName: "getGameStats",
    query: {
      refetchInterval: 45000, // Reduced to 45 seconds
      staleTime: 30000,
    },
  });

  // Read Player Games (less frequent)
  const {
    data: playerGamesData,
    refetch: refetchPlayerGames,
    isLoading: isPlayerGamesLoading,
  } = useReadContract({
    ...gameContract,
    functionName: "getPlayerGames",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      refetchInterval: 60000, // Reduced to 1 minute
      staleTime: 45000,
    },
  });

  // Read Player Active Games (moderate frequency, most important)
  const {
    data: activeGamesData,
    refetch: refetchActiveGames,
    isLoading: isActiveGamesLoading,
  } = useReadContract({
    ...gameContract,
    functionName: "getPlayerActiveGames",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      refetchInterval: 30000, // Reduced to 30 seconds (only critical data)
      staleTime: 20000,
    },
  });

  // Read Game Configurations (cache heavily since they rarely change)
  const useGameConfig = (gameType: GameType) => {
    return useReadContract({
      ...gameContract,
      functionName: "getGameConfig",
      args: [gameType],
      query: {
        staleTime: 600000, // 10 minutes - configs rarely change
        gcTime: 1800000, // 30 minutes in cache
      },
    });
  };

  // Read Individual Game (conservative refresh)
  const useGame = (gameId?: number) => {
    return useReadContract({
      ...gameContract,
      functionName: "getGame",
      args: gameId ? [BigInt(gameId)] : undefined,
      query: {
        enabled: Boolean(gameId),
        refetchInterval: false, // Don't auto-refresh, only on demand
        staleTime: 60000, // Consider fresh for 1 minute
      },
    });
  };

  // Watch for game events (rely on events instead of polling)
  useWatchContractEvent({
    ...gameContract,
    eventName: "GameStarted",
    onLogs: (logs) => {
      console.log("🎮 New game started:", logs);
      setLastEventUpdate(Date.now());

      // Only refetch if this user started a game
      const userEvents = logs.filter(
        (log) => log.args.player?.toLowerCase() === address?.toLowerCase()
      );

      if (userEvents.length > 0) {
        // Delay slightly to let blockchain state settle
        setTimeout(() => {
          refetchActiveGames();
          refetchPlayerGames();
          refetchGameStats();
        }, 2000);
      }
    },
  });

  useWatchContractEvent({
    ...gameContract,
    eventName: "GameCompleted",
    onLogs: (logs) => {
      console.log("🏆 Game completed:", logs);
      setLastEventUpdate(Date.now());

      // Only refetch if this user's game completed
      const userEvents = logs.filter(
        (log) => log.args.player?.toLowerCase() === address?.toLowerCase()
      );

      if (userEvents.length > 0) {
        // Delay slightly to let blockchain state settle
        setTimeout(() => {
          refetchActiveGames();
          refetchPlayerGames();
          refetchGameStats();
          refetchBalance(); // Balance might have changed due to rewards
        }, 2000);
      }
    },
  });

  // Write function: Burn tokens to start game
  const burnTokens = async (amount: string) => {
    if (!address) throw new Error("Wallet not connected");

    const amountWei = parseUnits(amount, 18);

    return writeContract({
      ...bbtContract,
      functionName: "burn",
      args: [amountWei],
    });
  };

  // Write function: Complete game (owner only)
  const completeGame = async (
    gameId: number,
    outcome: GameOutcome,
    message: string
  ) => {
    if (!address) throw new Error("Wallet not connected");

    return writeContract({
      ...gameContract,
      functionName: "completeGame",
      args: [BigInt(gameId), outcome, message],
    });
  };

  // Helper function to format BBT balance
  const formatBalance = (balance: bigint | undefined): string => {
    if (!balance) return "0";
    return formatUnits(balance, 18);
  };

  // Helper function to get game type name
  const getGameTypeName = (gameType: GameType): string => {
    switch (gameType) {
      case GameType.QUICK_BATTLE:
        return "Quick Battle";
      case GameType.ARENA_FIGHT:
        return "Arena Fight";
      case GameType.BOSS_BATTLE:
        return "Boss Battle";
      default:
        return "Unknown";
    }
  };

  // Helper function to get outcome name
  const getOutcomeName = (outcome: GameOutcome): string => {
    switch (outcome) {
      case GameOutcome.PLAYER_VICTORY:
        return "Victory";
      case GameOutcome.AI_VICTORY:
        return "Defeat";
      case GameOutcome.DRAW:
        return "Draw";
      case GameOutcome.EPIC_VICTORY:
        return "Epic Victory";
      default:
        return "Unknown";
    }
  };

  // Computed values
  const bbtBalance = formatBalance(bbtBalanceData);

  const gameStats: GameStats = gameStatsData
    ? {
        totalGames: Number(gameStatsData[0]),
        completedGames: Number(gameStatsData[1]),
        activeGames: Number(gameStatsData[2]),
      }
    : { totalGames: 0, completedGames: 0, activeGames: 0 };

  const playerGameIds = playerGamesData
    ? playerGamesData.map((id) => Number(id))
    : [];
  const activeGameIds = activeGamesData
    ? activeGamesData.map((id) => Number(id))
    : [];

  // Manual refresh function
  const refreshAllData = async () => {
    await Promise.all([
      refetchBalance(),
      refetchGameStats(),
      refetchPlayerGames(),
      refetchActiveGames(),
    ]);
  };

  return {
    // Contract addresses
    gameContractAddress: GAME_CONTRACT_ADDRESS,
    bbtTokenAddress: BBT_TOKEN_ADDRESS,

    // Read data
    bbtBalance,
    gameStats,
    playerGameIds,
    activeGameIds,

    // Loading states
    isBalanceLoading,
    isGameStatsLoading,
    isPlayerGamesLoading,
    isActiveGamesLoading,

    // Write functions
    burnTokens,
    completeGame,
    isWritePending,

    // Hooks for specific data
    useGameConfig,
    useGame,

    // Helper functions
    formatBalance,
    getGameTypeName,
    getOutcomeName,

    // Manual refresh
    refreshAllData,
    lastEventUpdate,

    // Enums for external use
    GameType,
    GameOutcome,
  };
}
