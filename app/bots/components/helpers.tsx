import React from "react";
import {
  TrendingUp,
  Sword,
  Shield,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  PlusCircle,
  Play,
  Pause,
  AlertTriangle,
  Heart,
  Zap,
} from "lucide-react";

// --- INTERFACES ---

export interface BotLastAction {
  type: string;
  message: string;
  timestamp: string;
  details?: any;
}

export interface TVBBot {
  name: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: string;
  lastAction?: BotLastAction;
  totalActions: number;
  sessionStarted: string;
  character?: {
    mood?: string;
    personality?: string;
  };
  config?: any; // Keeping this generic as per original
}

export interface FleetStats {
  totalActions: number;
  activeBots: number;
  totalBots: number;
}

// --- HELPER FUNCTIONS ---

export const getStatusColor = (isOnline: boolean): string =>
  isOnline
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : "bg-red-500/20 text-red-400 border-red-500/30";

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

export const getActionColor = (action?: string): string => {
  switch (action?.toLowerCase()) {
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

export const getActionIcon = (action?: string): React.ReactElement => {
  switch (action?.toLowerCase()) {
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

export const formatActionType = (action?: string): string => {
  if (!action) return "No Action";

  // Handle special cases for better formatting
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

// New helper to determine if an action is a personality action or system action
export const isPersonalityAction = (action?: string): boolean => {
  const personalityActions = ["buy", "sell", "hold", "create_token", "error"];
  return personalityActions.includes(action?.toLowerCase() || "");
};

// New helper to get action priority for sorting (higher = more important)
export const getActionPriority = (action?: string): number => {
  switch (action?.toLowerCase()) {
    case "error":
    case "insufficient_funds":
      return 10; // Highest priority
    case "buy":
    case "sell":
      return 8;
    case "create_token":
      return 7;
    case "hold":
      return 6;
    case "startup":
      return 5;
    case "balance_alert":
      return 4;
    case "heartbeat":
      return 2;
    case "shutdown":
      return 1;
    default:
      return 3;
  }
};
