// utils/tokenFormatters.ts

interface TokenMetadata {
  name: string;
  symbol: string;
  imageUrl: string;
  creator: string;
  burnManager: string;
  createdAt: string;
  currentState: string;
  blockNumber: number;
  statistics: {
    totalSupply: string;
    currentPrice: string;
    volumeETH: string;
    tradeCount: number;
    uniqueHolders: number;
  };
}

interface TokenStats {
  currentPrice: string;
  collateral: string;
  tokenState: string;
}

export function formatFirestoreData(
  address: string,
  data: TokenMetadata,
  stats: TokenStats
) {
  return {
    address: address.toLowerCase(),
    name: data.name,
    symbol: data.symbol,
    imageUrl: data.imageUrl,
    creator: data.creator.toLowerCase(),
    burnManager: data.burnManager.toLowerCase(),
    createdAt: data.createdAt,
    currentState: stats.tokenState || data.currentState,
    blockNumber: data.blockNumber,
    statistics: {
      totalSupply: data.statistics.totalSupply,
      currentPrice: stats.currentPrice || data.statistics.currentPrice,
      volumeETH: data.statistics.volumeETH,
      tradeCount: data.statistics.tradeCount,
      uniqueHolders: data.statistics.uniqueHolders,
    },
    collateral: stats.collateral || "0",
  };
}
