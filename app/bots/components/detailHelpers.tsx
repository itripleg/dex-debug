import React from "react";
import {
  TrendingUp,
  Sword,
  Shield,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  Pause,
  AlertTriangle,
  PlusCircle,
  Heart,
  Play,
  Zap,
} from "lucide-react";

// --- INTERFACES ---
export interface BotCharacter {
  mood?: string;
  energy?: number;
  personality?: string;
  catchphrase?: string;
}

export interface BotLastAction {
  type: string;
  message: string;
  timestamp: string;
  details?: any;
}

export interface BotConfig {
  buyBias?: number;
  riskTolerance?: number;
  minInterval?: number;
  maxInterval?: number;
  minTradeAmount?: number;
  maxTradeAmount?: number;
  createTokenChance?: number;
  buyPhrases?: string[];
  sellPhrases?: string[];
}

export interface BotStatus {
  name: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: string;
  lastAction?: BotLastAction;
  totalActions: number;
  sessionStarted: string;
  character?: BotCharacter;
  config?: BotConfig;
}

export interface ActivityLog {
  id: string;
  action: string;
  message: string;
  timestamp: Date;
  tokenSymbol?: string;
  amount?: string;
}

// --- HELPER FUNCTIONS ---
export const getMoodColor = (mood?: string): string => {
  switch (mood?.toLowerCase()) {
    case "bullish":
      return "text-green-400";
    case "aggressive":
      return "text-red-400";
    case "cautious":
      return "text-blue-400";
    case "bearish":
      return "text-orange-400";
    case "neutral":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
};

export const getMoodIcon = (mood?: string): React.ReactElement => {
  switch (mood?.toLowerCase()) {
    case "bullish":
      return <TrendingUp className="h-4 w-4" />;
    case "aggressive":
      return <Sword className="h-4 w-4" />;
    case "cautious":
      return <Shield className="h-4 w-4" />;
    case "bearish":
      return <ArrowDownCircle className="h-4 w-4" />;
    case "neutral":
      return <Activity className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

export const getActionColor = (action: string): string => {
  switch (action.toLowerCase()) {
    case "buy":
      return "text-green-400 bg-green-500/10";
    case "sell":
      return "text-red-400 bg-red-500/10";
    case "hold":
      return "text-yellow-400 bg-yellow-500/10";
    case "create_token":
      return "text-purple-400 bg-purple-500/10";
    case "heartbeat":
      return "text-blue-400 bg-blue-500/10";
    case "startup":
      return "text-orange-400 bg-orange-500/10";
    case "shutdown":
      return "text-gray-400 bg-gray-500/10";
    case "insufficient_funds":
      return "text-red-400 bg-red-500/20";
    case "error":
      return "text-red-400 bg-red-500/10";
    case "balance_alert":
      return "text-orange-400 bg-orange-500/10";
    default:
      return "text-gray-400 bg-gray-500/10";
  }
};

export const getActionIcon = (action: string): React.ReactElement => {
  switch (action.toLowerCase()) {
    case "buy":
      return <ArrowUpCircle className="h-4 w-4" />;
    case "sell":
      return <ArrowDownCircle className="h-4 w-4" />;
    case "hold":
      return <Pause className="h-4 w-4" />;
    case "create_token":
      return <PlusCircle className="h-4 w-4" />;
    case "startup":
      return <Play className="h-4 w-4" />;
    case "heartbeat":
      return <Heart className="h-4 w-4" />;
    case "insufficient_funds":
      return <AlertTriangle className="h-4 w-4" />;
    case "error":
      return <AlertTriangle className="h-4 w-4" />;
    case "balance_alert":
      return <Zap className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

export const formatActionType = (action: string): string => {
  switch (action.toLowerCase()) {
    case "insufficient_funds":
      return "Low Funds";
    case "balance_alert":
      return "Balance Alert";
    case "create_token":
      return "Create Token";
    default:
      return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
};

// Helper to determine if action is personality-driven or system-driven
export const isPersonalityAction = (action: string): boolean => {
  const personalityActions = ["buy", "sell", "hold", "create_token", "error"];
  return personalityActions.includes(action.toLowerCase());
};

// Helper to get action description for activity log
export const getActionDescription = (action: string): string => {
  switch (action.toLowerCase()) {
    case "buy":
      return "Purchased tokens with AVAX";
    case "sell":
      return "Sold tokens for AVAX";
    case "hold":
      return "Decided to maintain current position";
    case "create_token":
      return "Created a new token";
    case "heartbeat":
      return "System health check";
    case "startup":
      return "Bot started new trading session";
    case "shutdown":
      return "Bot ended trading session";
    case "insufficient_funds":
      return "Insufficient AVAX for trading";
    case "error":
      return "Encountered an error";
    case "balance_alert":
      return "Balance threshold alert";
    default:
      return "Performed an action";
  }
};
