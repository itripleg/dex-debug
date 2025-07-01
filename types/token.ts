import { Address } from "viem";

// /types/token.ts
export enum TokenState {
  NOT_CREATED = 0,
  TRADING = 1,
  GOAL_REACHED = 2,
  HALTED = 3,
  RESUMED = 4,
}

export interface ImagePosition {
  x: number; // -100 to 100 (percentage)
  y: number; // -100 to 100 (percentage)
  scale: number; // 0.5 to 3
  rotation: number; // -180 to 180 degrees
}

export interface PositionHistoryEntry {
  position: ImagePosition;
  updatedAt: string;
  updatedBy: string;
}

export interface Trade {
  blockNumber: number;
  ethAmount: string;
  pricePerToken: string;
  timestamp: string; // We will handle this string format in the chart
  token: Address;
  tokenAmount: string; // This is the missing property
  trader: Address;
  transactionHash: string;
  type: "buy" | "sell";
  fee?: string; // Optional fee property
}

export interface Token {
  // Basic token information from Token contract
  address: `0x${string}`;
  name: string;
  symbol: string;
  imageUrl: string;
  description: string;

  // Contract parameters from Token contract
  creator: `0x${string}`;
  burnManager: `0x${string}`;

  // Factory contract state
  fundingGoal: string;
  collateral: string;
  virtualSupply: string;

  // Factory constants (immutable)
  decimals: string; // 10 ** 18
  maxSupply: string; // (10 ** 9) * DECIMALS
  initialMint: string; // (MAX_SUPPLY * 20) / 100
  initialPrice: string; // 0.00001 ether
  minPurchase: string; // INITIAL_PRICE
  maxPurchase: string; // 50 ether
  maxWalletPercentage: number; // 5
  priceRate: string; // 2000
  tradingFee: number; // 30 (0.3%)

  // Current state
  state: TokenState;
  currentPrice: string; // Calculated from contract

  // On-chain stats
  totalSupply: string;

  // Metadata from creation event
  createdAt: string;
  blockNumber: number;
  transactionHash: string;

  // Image positioning and metadata
  imagePosition?: ImagePosition; // Position data for token header display
  lastUpdated?: string; // When image position was last updated
  updatedBy?: string; // Who last updated the image position
  positionHistory?: PositionHistoryEntry[]; // History of position changes (last 10)

  // Trade history
  lastTrade?: Trade;
}

// Interface for token creation form
export interface TokenCreationInfo {
  name: string;
  ticker: string;
  description: string;
  image: File | null;
  imagePosition: ImagePosition;
  burnManager?: `0x${string}`;
}

// Interface for image metadata stored in Firebase
export interface TokenImageMetadata {
  imageUrl: string;
  imagePosition: ImagePosition;
  uploadedAt: number;
  originalFilename: string;
  fileSize?: number;
  mimeType?: string;
  createdBy: string;
}

// Interface for token updates (analytics/logging)
export interface TokenUpdateLog {
  tokenAddress: string;
  updateType: "image_position" | "metadata" | "other";
  oldPosition?: ImagePosition | null;
  newPosition?: ImagePosition;
  updatedBy: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string; // Optional for analytics
}

// Type guards for runtime validation
export const isValidImagePosition = (
  position: any
): position is ImagePosition => {
  return (
    typeof position === "object" &&
    position !== null &&
    typeof position.x === "number" &&
    typeof position.y === "number" &&
    typeof position.scale === "number" &&
    typeof position.rotation === "number" &&
    position.x >= -100 &&
    position.x <= 100 &&
    position.y >= -100 &&
    position.y <= 100 &&
    position.scale >= 0.5 &&
    position.scale <= 3 &&
    position.rotation >= -180 &&
    position.rotation <= 180
  );
};

export const isValidToken = (token: any): token is Token => {
  return (
    typeof token === "object" &&
    token !== null &&
    typeof token.address === "string" &&
    typeof token.name === "string" &&
    typeof token.symbol === "string" &&
    typeof token.creator === "string" &&
    (!token.imagePosition || isValidImagePosition(token.imagePosition))
  );
};

// Default values
export const DEFAULT_IMAGE_POSITION: ImagePosition = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};

// Utility functions
export const createImagePosition = (
  x: number = 0,
  y: number = 0,
  scale: number = 1,
  rotation: number = 0
): ImagePosition => ({
  x: Math.max(-100, Math.min(100, x)),
  y: Math.max(-100, Math.min(100, y)),
  scale: Math.max(0.5, Math.min(3, scale)),
  rotation: Math.max(-180, Math.min(180, rotation)),
});

export const clampImagePosition = (
  position: Partial<ImagePosition>
): ImagePosition => ({
  x: Math.max(-100, Math.min(100, position.x ?? 0)),
  y: Math.max(-100, Math.min(100, position.y ?? 0)),
  scale: Math.max(0.5, Math.min(3, position.scale ?? 1)),
  rotation: Math.max(-180, Math.min(180, position.rotation ?? 0)),
});

// CSS style generator for image positioning
export const getImagePositionStyle = (position?: ImagePosition) => {
  if (!position) {
    return {
      backgroundSize: "cover",
      backgroundPosition: "center",
      transform: "none",
    };
  }

  return {
    backgroundSize: `${100 * position.scale}% ${100 * position.scale}%`,
    backgroundPosition: `${50 + position.x}% ${50 + position.y}%`,
    backgroundRepeat: "no-repeat" as const,
    transform: `rotate(${position.rotation}deg)`,
    transformOrigin: "center center" as const,
    transition: "all 0.2s ease-out" as const,
  };
};

// Helper to check if user can edit token
export const canEditToken = (token: Token, userAddress?: string): boolean => {
  return !!(
    userAddress &&
    token.creator &&
    userAddress.toLowerCase() === token.creator.toLowerCase()
  );
};
