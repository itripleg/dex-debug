import { Network } from "alchemy-sdk";

export interface NetworkConfig {
  id: string;
  name: string;
  network: Network;
  color: string;
  icon: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    network: Network.ETH_MAINNET,
    color: "#627EEA",
    icon: "/networks/ethereum.svg",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },
  {
    id: "avalanche",
    name: "Avalanche",
    network: Network.ARB_MAINNET, // We'll need to update this once Alchemy adds AVAX support
    color: "#E84142",
    icon: "/networks/avalanche.svg",
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
  },
  {
    id: "polygon",
    name: "Polygon",
    network: Network.MATIC_MAINNET,
    color: "#8247E5",
    icon: "/networks/polygon.svg",
    nativeCurrency: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  {
    id: "bsc",
    name: "BNB Chain",
    network: Network.ETH_MAINNET, // We'll need to update this once Alchemy adds BSC support
    color: "#F3BA2F",
    icon: "/networks/bsc.svg",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
  },
];
