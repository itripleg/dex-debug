// /types/utils.ts

export type Blockchain = "ethereum" | "avalanche"; // or an enum
export interface CryptoAddress {
  id?: string;
  name: string;
  address: `0x${string}`;
  blockchain: Blockchain;
}

export interface FirebaseError {
  code: string;
  message: string;
}
