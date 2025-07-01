// /types/events.ts

import { Address } from "viem";

export type TokenCreatedEvent = {
  tokenAddress: Address;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: Address;
  fundingGoal: bigint;
  burnManager: Address;
};

export type TokensPurchasedEvent = {
  token: Address;
  buyer: Address;
  amount: bigint;
  price: bigint;
  fee: bigint;
};

export type TokensSoldEvent = {
  token: Address;
  seller: Address;
  tokenAmount: bigint;
  ethAmount: bigint;
  fee: bigint;
};

export type TradingHaltedEvent = {
  token: Address;
  collateral: bigint;
};

export type TradingResumedEvent = {
  token: Address;
};
