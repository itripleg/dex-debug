// /utils/tokenUtils.tsx
import { getContract } from "viem";
import { formatEther, type PublicClient } from "viem";
import { TokenData, TokenState, FACTORY_ADDRESS } from "@/types";
import { usePublicClient } from "wagmi";

// Contract config
const factoryContract = {
  address: FACTORY_ADDRESS,
  abi: [
    {
      inputs: [
        { internalType: "address", name: "tokenAddress", type: "address" },
      ],
      name: "getTokenMetadata",
      outputs: [
        { internalType: "string", name: "name", type: "string" },
        { internalType: "string", name: "symbol", type: "string" },
        { internalType: "string", name: "imageUrl", type: "string" },
        { internalType: "uint256", name: "fundingGoal", type: "uint256" },
        { internalType: "uint256", name: "createdAt", type: "uint256" },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
} as const;

interface TokenMetadata {
  name: string;
  symbol: string;
  imageUrl: string;
  fundingGoal: string;
  createdAt: string;
}

interface RealTimeStats {
  currentPrice?: string;
  volumeAVAX?: string;
  tradeCount?: number;
  uniqueHolders?: number;
  tokenState: TokenState;
  collateral?: string;
}

// Helper function to serialize BigInt
function serializeBigInt(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// Modified to accept publicClient as parameter
export async function getTokenMetadata(
  tokenAddress: string,
  publicClient: PublicClient
): Promise<TokenMetadata> {
  try {
    const contract = getContract({
      ...factoryContract,
      client: publicClient,
    });

    const result = await contract.read.getTokenMetadata([
      tokenAddress as `0x${string}`,
    ]);

    const [name, symbol, imageUrl, fundingGoal, createdAt] = result;

    return {
      name,
      symbol,
      imageUrl,
      fundingGoal: fundingGoal.toString(),
      createdAt: createdAt.toString(),
    };
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    throw error;
  }
}

export function formatTokenData(
  firestoreData: any,
  id: string,
  metadata: TokenMetadata,
  realtimeStats: RealTimeStats
): TokenData {
  return {
    // Basic info
    id,
    name: metadata.name,
    symbol: metadata.symbol,
    address: firestoreData.address,
    description: firestoreData.description,
    imageUrl: metadata.imageUrl,
    creator: firestoreData.creator,
    creationBlock: firestoreData.creationBlock,
    transactionHash: firestoreData.transactionHash,
    createdAt: new Date(Number(metadata.createdAt) * 1000).toISOString(),

    // State and funding
    currentState: realtimeStats.tokenState || TokenState.TRADING,
    fundingGoal: formatEther(BigInt(metadata.fundingGoal)),
    collateral: realtimeStats.collateral || firestoreData.collateral || "0",

    // Contract constants
    initialPrice: firestoreData.initialPrice || "0.001",
    maxSupply: firestoreData.maxSupply || "1000000000",
    priceRate: firestoreData.priceRate || "2000",
    tradeCooldown: firestoreData.tradeCooldown || 60,
    maxWalletPercentage: firestoreData.maxWalletPercentage || 5,

    // Statistics
    statistics: {
      totalSupply: firestoreData.statistics?.totalSupply || "0",
      currentPrice: realtimeStats.currentPrice || "0",
      volumeETH: realtimeStats.volumeAVAX || "0",
      tradeCount: realtimeStats.tradeCount || 0,
      uniqueHolders: realtimeStats.uniqueHolders || 0,
      lastTradeTimestamp: firestoreData.statistics?.lastTradeTimestamp,
    },
  };
}

export async function getFormattedTokenData(
  tokenAddress: string,
  firestoreData: any,
  realtimeStats: RealTimeStats,
  publicClient: PublicClient
): Promise<TokenData> {
  const metadata = await getTokenMetadata(tokenAddress, publicClient);
  return formatTokenData(firestoreData, tokenAddress, metadata, realtimeStats);
}

export const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getExplorerUrl = (network: string, address: string) => {
  switch (network) {
    case "Ethereum":
      return `https://etherscan.io/token/${address}`;
    case "Polygon":
      return `https://polygonscan.com/token/${address}`;
    case "Avalanche":
      return `https://snowtrace.io/token/${address}`;
    case "Avalanche Fuji":
      return `https://testnet.snowtrace.io/token/${address}`;
    case "BSC":
      return `https://bscscan.com/token/${address}`;
    default:
      return "#";
  }
};
