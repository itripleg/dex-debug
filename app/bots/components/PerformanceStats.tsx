import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Calendar,
  Zap,
  Timer,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { BotStatus } from "./detailHelpers";

interface PerformanceStatsProps {
  bot: BotStatus;
}

const PerformanceStats: React.FC<PerformanceStatsProps> = ({ bot }) => {
  // Extract balance information from bot's last action or details
  const getCurrentBalance = (): number => {
    return bot.lastAction?.details?.currentBalance || 0;
  };

  const getStartingBalance = (): number => {
    return (
      bot.lastAction?.details?.startingBalance ||
      (bot.config as any)?.startingBalance ||
      getCurrentBalance()
    ); // Fallback to current if no starting balance
  };

  const calculatePnL = (): { amount: number; percentage: number } => {
    const current = getCurrentBalance();
    const starting = getStartingBalance();
    const amount = current - starting;
    const percentage = starting > 0 ? (amount / starting) * 100 : 0;

    return { amount, percentage };
  };

  const getTradeInterval = (): string => {
    const minInterval = bot.config?.minInterval;
    const maxInterval = bot.config?.maxInterval;

    if (minInterval !== undefined && maxInterval !== undefined) {
      return `${minInterval}-${maxInterval}s`;
    }

    // Try to get from last action details
    const details = bot.lastAction?.details;
    if (
      details?.config?.minInterval !== undefined &&
      details?.config?.maxInterval !== undefined
    ) {
      return `${details.config.minInterval}-${details.config.maxInterval}s`;
    }

    return "N/A";
  };

  const getSessionUptime = (): string => {
    // Use bot's calculated session duration from webhook
    const sessionMinutes = bot.lastAction?.details?.sessionDurationMinutes;

    if (sessionMinutes !== undefined) {
      const hours = Math.floor(sessionMinutes / 60);
      const minutes = sessionMinutes % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }

    // Fallback to frontend calculation only if bot data unavailable
    const fallbackHours = Math.floor(
      (Date.now() - new Date(bot.sessionStarted).getTime()) / 3600000
    );
    return `${fallbackHours}h`;
  };

  const currentBalance = getCurrentBalance();
  const startingBalance = getStartingBalance();
  const pnl = calculatePnL();
  const tradeInterval = getTradeInterval();
  const sessionUptime = getSessionUptime();

  // Determine P&L color
  const getPnLColor = () => {
    if (pnl.amount > 0) return "text-green-400";
    if (pnl.amount < 0) return "text-red-400";
    return "text-gray-400";
  };

  const getPnLIcon = () => {
    if (pnl.amount > 0)
      return <TrendingUp className="h-6 w-6 text-green-400" />;
    if (pnl.amount < 0)
      return <TrendingDown className="h-6 w-6 text-red-400" />;
    return <DollarSign className="h-6 w-6 text-gray-400" />;
  };

  const getPnLBgColor = () => {
    if (pnl.amount > 0) return "bg-green-500/10";
    if (pnl.amount < 0) return "bg-red-500/10";
    return "bg-gray-500/10";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {/* Current AVAX Balance */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <Wallet className="h-6 w-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {currentBalance.toFixed(4)}
          </p>
          <p className="text-sm text-gray-400">AVAX Balance</p>
        </CardContent>
      </Card>

      {/* Starting Balance */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <DollarSign className="h-6 w-6 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {startingBalance.toFixed(4)}
          </p>
          <p className="text-sm text-gray-400">Starting Balance</p>
        </CardContent>
      </Card>

      {/* P&L Amount */}
      <Card
        className={`bg-gray-800/50 border-gray-700/50 backdrop-blur-sm ${getPnLBgColor()}`}
      >
        <CardContent className="p-6 text-center">
          {getPnLIcon()}
          <p className={`text-2xl font-bold ${getPnLColor()}`}>
            {pnl.amount >= 0 ? "+" : ""}
            {pnl.amount.toFixed(6)}
          </p>
          <p className="text-sm text-gray-400">P&L (AVAX)</p>
        </CardContent>
      </Card>

      {/* P&L Percentage */}
      <Card
        className={`bg-gray-800/50 border-gray-700/50 backdrop-blur-sm ${getPnLBgColor()}`}
      >
        <CardContent className="p-6 text-center">
          {getPnLIcon()}
          <p className={`text-2xl font-bold ${getPnLColor()}`}>
            {pnl.percentage >= 0 ? "+" : ""}
            {pnl.percentage.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-400">P&L (%)</p>
        </CardContent>
      </Card>

      {/* Total Actions */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <Activity className="h-6 w-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{bot.totalActions}</p>
          <p className="text-sm text-gray-400">Total Actions</p>
        </CardContent>
      </Card>

      {/* Trade Interval */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <Timer className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-white">{tradeInterval}</p>
          <p className="text-sm text-gray-400">Trade Interval</p>
        </CardContent>
      </Card>

      {/* Additional Row for More Details */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm md:col-span-2">
        <CardContent className="p-6 text-center">
          <Calendar className="h-6 w-6 text-purple-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-white">
            {new Date(bot.sessionStarted).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-400">Session Started</p>
        </CardContent>
      </Card>

      {/* Last Action */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm md:col-span-2">
        <CardContent className="p-6 text-center">
          <Zap className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-xl font-bold text-white capitalize">
            {bot.lastAction?.type.replace("_", " ") || "None"}
          </p>
          <p className="text-sm text-gray-400">Last Action</p>
        </CardContent>
      </Card>

      {/* Session Uptime */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm md:col-span-2">
        <CardContent className="p-6 text-center">
          <Timer className="h-6 w-6 text-green-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-white">{sessionUptime}</p>
          <p className="text-sm text-gray-400">Session Uptime</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceStats;
