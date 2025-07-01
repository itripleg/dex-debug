// utils/tokenStatus.ts
import { Token } from "@/types";

export interface TokenStatus {
  isNew: boolean;
  isTrending: boolean;
  isHot: boolean;
  isGoalClose: boolean;
  badge?: {
    text: string;
    color: string;
    variant: "new" | "trending" | "hot" | "goal" | "none";
  };
}

export function getTokenStatus(token: Token): TokenStatus {
  const now = Date.now();
  const createdAt = token.createdAt ? new Date(token.createdAt).getTime() : 0;
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);

  // Parse numeric values
  const collateral = parseFloat(token.collateral || "0");
  const fundingGoal = parseFloat(token.fundingGoal || "0");
  //   @ts-expect-error may not work
  const tradeCount = token.statistics?.tradeCount || 0;
  //   @ts-expect-error may not work
  const volumeETH = parseFloat(token.statistics?.volumeETH || "0");

  // Calculate funding progress
  const fundingProgress =
    fundingGoal > 0 ? (collateral / fundingGoal) * 100 : 0;

  // Define criteria
  const isNew = ageInHours < 24; // Created within 24 hours
  const isTrending = tradeCount > 10 && ageInHours < 72; // Active trading within 3 days
  const isHot = volumeETH > 1 && ageInHours < 48; // High volume within 2 days
  const isGoalClose = fundingProgress > 80; // Close to funding goal

  // Determine primary badge (priority order: goal > hot > trending > new)
  let badge: TokenStatus["badge"] = undefined;

  if (isGoalClose) {
    badge = {
      text: `${Math.round(fundingProgress)}%`,
      color: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
      variant: "goal",
    };
  } else if (isHot) {
    badge = {
      text: "🔥 HOT",
      color: "bg-red-500/20 text-red-300 border-red-400/30",
      variant: "hot",
    };
  } else if (isTrending) {
    badge = {
      text: "📈 TRENDING",
      color: "bg-green-500/20 text-green-300 border-green-400/30",
      variant: "trending",
    };
  } else if (isNew) {
    badge = {
      text: "✨ NEW",
      color: "bg-blue-500/20 text-blue-300 border-blue-400/30",
      variant: "new",
    };
  }

  return {
    isNew,
    isTrending,
    isHot,
    isGoalClose,
    badge,
  };
}

// Alternative criteria you could use:
export const TOKEN_STATUS_CRITERIA = {
  // Time-based
  NEW_HOURS: 24,
  TRENDING_HOURS: 72,
  HOT_HOURS: 48,

  // Activity-based
  MIN_TRADES_TRENDING: 10,
  MIN_VOLUME_HOT: 1, // ETH

  // Funding-based
  GOAL_CLOSE_PERCENTAGE: 80,

  // Advanced criteria (if you want to implement them)
  VELOCITY_THRESHOLD: 5, // trades per hour
  UNIQUE_TRADERS_THRESHOLD: 5,
  PRICE_CHANGE_THRESHOLD: 20, // percentage
};

// Advanced status calculation with more sophisticated logic
export function getAdvancedTokenStatus(
  token: Token,
  recentTrades?: any[],
  priceHistory?: any[]
): TokenStatus {
  const now = Date.now();
  const createdAt = token.createdAt ? new Date(token.createdAt).getTime() : 0;
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);

  // Calculate recent activity (last 24 hours)
  const recentTradeCount =
    recentTrades?.filter(
      (trade) => now - new Date(trade.timestamp).getTime() < 24 * 60 * 60 * 1000
    ).length || 0;

  // Calculate trading velocity (trades per hour in last 24h)
  const tradingVelocity =
    ageInHours > 0 ? recentTradeCount / Math.min(ageInHours, 24) : 0;

  // Calculate price momentum (if price history available)
  const priceChange24h =
    priceHistory && priceHistory.length > 1
      ? ((parseFloat(priceHistory[0].price) -
          parseFloat(priceHistory[priceHistory.length - 1].price)) /
          parseFloat(priceHistory[priceHistory.length - 1].price)) *
        100
      : 0;

  // Enhanced criteria
  const isNew = ageInHours < TOKEN_STATUS_CRITERIA.NEW_HOURS;
  const isTrending =
    tradingVelocity > TOKEN_STATUS_CRITERIA.VELOCITY_THRESHOLD ||
    (recentTradeCount > TOKEN_STATUS_CRITERIA.MIN_TRADES_TRENDING &&
      ageInHours < TOKEN_STATUS_CRITERIA.TRENDING_HOURS);
  const isHot =
    Math.abs(priceChange24h) > TOKEN_STATUS_CRITERIA.PRICE_CHANGE_THRESHOLD ||
    // @ts-expect-error might not work
    parseFloat(token.statistics?.volumeETH || "0") >
      TOKEN_STATUS_CRITERIA.MIN_VOLUME_HOT;

  const fundingProgress =
    parseFloat(token.fundingGoal || "0") > 0
      ? (parseFloat(token.collateral || "0") /
          parseFloat(token.fundingGoal || "0")) *
        100
      : 0;
  const isGoalClose =
    fundingProgress > TOKEN_STATUS_CRITERIA.GOAL_CLOSE_PERCENTAGE;

  // Enhanced badge logic
  let badge: TokenStatus["badge"] = undefined;

  if (isGoalClose) {
    badge = {
      text: `🎯 ${Math.round(fundingProgress)}%`,
      color: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
      variant: "goal",
    };
  } else if (isHot && priceChange24h > 0) {
    badge = {
      text: `🚀 +${Math.round(priceChange24h)}%`,
      color: "bg-green-500/20 text-green-300 border-green-400/30",
      variant: "hot",
    };
  } else if (isHot && priceChange24h < 0) {
    badge = {
      text: `📉 ${Math.round(priceChange24h)}%`,
      color: "bg-red-500/20 text-red-300 border-red-400/30",
      variant: "hot",
    };
  } else if (isTrending) {
    badge = {
      text: `📈 ${recentTradeCount} trades`,
      color: "bg-green-500/20 text-green-300 border-green-400/30",
      variant: "trending",
    };
  } else if (isNew) {
    badge = {
      text: "✨ NEW",
      color: "bg-blue-500/20 text-blue-300 border-blue-400/30",
      variant: "new",
    };
  }

  return {
    isNew,
    isTrending,
    isHot,
    isGoalClose,
    badge,
  };
}

// Usage in TokenCard component:
/*
import { getTokenStatus } from "@/utils/tokenStatus";

// In your TokenCard component:
const tokenStatus = getTokenStatus(token);

// Render the badge:
{tokenStatus.badge && (
  <Badge
    variant="secondary"
    className={`${tokenStatus.badge.color} text-xs`}
  >
    {tokenStatus.badge.text}
  </Badge>
)}
*/
