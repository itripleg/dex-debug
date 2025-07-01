import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Zap,
  Sword,
  Crown,
  Brain,
  Timer,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface ActiveGame {
  gameId: number;
  gameType: "QUICK_BATTLE" | "ARENA_FIGHT" | "BOSS_BATTLE";
  burnedAmount: string;
  startTime: number; // timestamp
  expectedReward: string;
  status: "WAITING_AI" | "PROCESSING" | "ALMOST_READY";
}

interface ActiveGamesListProps {
  activeGames: ActiveGame[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const ActiveGamesList: React.FC<ActiveGamesListProps> = ({
  activeGames,
  onRefresh,
  isLoading = false,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for elapsed time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getGameTypeConfig = (gameType: ActiveGame["gameType"]) => {
    switch (gameType) {
      case "QUICK_BATTLE":
        return {
          name: "Quick Battle",
          icon: <Zap className="h-5 w-5" />,
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
        };
      case "ARENA_FIGHT":
        return {
          name: "Arena Fight",
          icon: <Sword className="h-5 w-5" />,
          color: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/30",
        };
      case "BOSS_BATTLE":
        return {
          name: "Boss Battle",
          icon: <Crown className="h-5 w-5" />,
          color: "text-purple-400",
          bgColor: "bg-purple-500/10",
          borderColor: "border-purple-500/30",
        };
    }
  };

  const getStatusConfig = (
    status: ActiveGame["status"],
    elapsedMinutes: number
  ) => {
    switch (status) {
      case "WAITING_AI":
        return {
          text: "Awaiting AI Response",
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30",
          icon: <Brain className="h-4 w-4" />,
          pulse: true,
        };
      case "PROCESSING":
        return {
          text: "AI is Thinking...",
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          borderColor: "border-blue-500/30",
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          pulse: false,
        };
      case "ALMOST_READY":
        return {
          text: "Result Coming Soon",
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          icon: <Sparkles className="h-4 w-4" />,
          pulse: true,
        };
      default:
        return {
          text: "Processing",
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          borderColor: "border-gray-500/30",
          icon: <Clock className="h-4 w-4" />,
          pulse: false,
        };
    }
  };

  const formatElapsedTime = (startTime: number) => {
    const elapsed = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getElapsedMinutes = (startTime: number) => {
    return Math.floor((currentTime - startTime) / (1000 * 60));
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Timer className="h-5 w-5 text-orange-400" />
            Active Battles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-700/30 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Timer className="h-5 w-5 text-orange-400" />
            Active Battles
            <Badge
              variant="outline"
              className="text-orange-400 border-orange-400/30"
            >
              {activeGames.length} pending
            </Badge>
          </CardTitle>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="popLayout">
          {activeGames.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="text-gray-500 mb-4">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">No active battles</p>
                <p className="text-sm">
                  Start a new battle to challenge the AI!
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {activeGames.map((game, index) => {
                const gameConfig = getGameTypeConfig(game.gameType);
                const elapsedMinutes = getElapsedMinutes(game.startTime);
                const statusConfig = getStatusConfig(
                  game.status,
                  elapsedMinutes
                );

                return (
                  <motion.div
                    key={game.gameId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    layout
                  >
                    <Card
                      className={`
                      ${gameConfig.bgColor} ${gameConfig.borderColor} 
                      border backdrop-blur-sm relative overflow-hidden
                      hover:scale-[1.02] transition-transform duration-200
                    `}
                    >
                      {/* Animated background effect for active games */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse"></div>

                      <CardContent className="p-4 relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Game Type Icon */}
                            <div
                              className={`${gameConfig.color} p-2 rounded-lg ${gameConfig.bgColor}`}
                            >
                              {gameConfig.icon}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className={`font-semibold ${gameConfig.color}`}
                                >
                                  {gameConfig.name}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="text-xs text-gray-400 border-gray-500/30"
                                >
                                  Game #{game.gameId}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatElapsedTime(game.startTime)}
                                </span>
                                <span>
                                  Burned:{" "}
                                  {parseFloat(
                                    game.burnedAmount
                                  ).toLocaleString()}{" "}
                                  BBT
                                </span>
                                <span className="text-green-400">
                                  Potential:{" "}
                                  {parseFloat(
                                    game.expectedReward
                                  ).toLocaleString()}{" "}
                                  BBT
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className={`
                                ${statusConfig.color} ${
                                statusConfig.borderColor
                              } ${statusConfig.bgColor}
                                ${statusConfig.pulse ? "animate-pulse" : ""}
                              `}
                            >
                              <span className="flex items-center gap-1">
                                {statusConfig.icon}
                                {statusConfig.text}
                              </span>
                            </Badge>

                            {/* Time-based hints */}
                            <div className="text-xs text-gray-500 mt-1">
                              {elapsedMinutes < 1 && "Just started..."}
                              {elapsedMinutes >= 1 &&
                                elapsedMinutes < 3 &&
                                "AI is analyzing..."}
                              {elapsedMinutes >= 3 &&
                                elapsedMinutes < 5 &&
                                "Response incoming..."}
                              {elapsedMinutes >= 5 && (
                                <span className="text-yellow-400 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Taking longer than usual
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar for visual feedback */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                            <motion.div
                              className={`h-full rounded-full ${
                                elapsedMinutes < 2
                                  ? "bg-yellow-400"
                                  : elapsedMinutes < 4
                                  ? "bg-blue-400"
                                  : "bg-green-400"
                              }`}
                              initial={{ width: "0%" }}
                              animate={{
                                width: `${Math.min(
                                  100,
                                  (elapsedMinutes / 5) * 100
                                )}%`,
                              }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Footer info */}
        {activeGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
          >
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Brain className="h-4 w-4" />
              <span>
                The AI is processing your battles. Results typically arrive
                within 1-5 minutes.
              </span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveGamesList;
