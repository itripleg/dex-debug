// types/contracts.ts
import { Abi, Address } from "viem";

// Import directly from Remix-generated metadata files
import TokenFactoryMetadata from "@/contracts/nu-nu/artifacts/TokenFactory_metadata.json";
import TokenMetadata from "@/contracts/nu-nu/artifacts/Token_metadata.json";
import YmirMetadata from "@/contracts/nu-nu/artifacts/Ymir_metadata.json";

// Extract ABIs from metadata
export const FACTORY_ABI = TokenFactoryMetadata.output.abi as Abi;
export const TOKEN_ABI = TokenMetadata.output.abi as Abi;
export const MANAGER_ABI = YmirMetadata.output.abi as Abi;

// Address configuration
export const ADDRESSES = {
  MAINNET: {
    FACTORY: "0x0000000000000000000000000000000000000000" as Address,
  },
  TESTNET: {
    FACTORY: process.env.NEXT_PUBLIC_TESTNET_FACTORY_ADDRESS as Address, // Fixed: was "Factory"
  },
} as const;

export const FACTORY_ADDRESS: Address =
  process.env.NEXT_PUBLIC_NETWORK === "testnet"
    ? ADDRESSES.TESTNET.FACTORY
    : ADDRESSES.MAINNET.FACTORY;

// Additional constants
export const FAUCET_ADDRESS = "0x0B50C987D357a8000FCD88f7eC6D35A88775AfD2";

// Network info
export const CURRENT_NETWORK = process.env.NEXT_PUBLIC_NETWORK || "testnet";
export const IS_TESTNET = CURRENT_NETWORK === "testnet";

// Helper functions
export function getContractAddresses(): Record<string, Address> {
  return {
    factory: FACTORY_ADDRESS,
    faucet: FAUCET_ADDRESS,
  };
}

export function validateNetwork(): boolean {
  const network = process.env.NEXT_PUBLIC_NETWORK;
  return network === "testnet" || network === "mainnet";
}

// Extract events for easy access
export const FACTORY_EVENTS = FACTORY_ABI.filter(
  (item: any) => item.type === "event"
);
export const TOKEN_EVENTS = TOKEN_ABI.filter(
  (item: any) => item.type === "event"
);
export const MANAGER_EVENTS = MANAGER_ABI.filter(
  (item: any) => item.type === "event"
);
