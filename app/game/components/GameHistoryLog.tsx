import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Scroll,
  Trophy,
  X,
  Minus,
  Sparkles,
  Zap,
  Sword,
  Crown,
  Calendar,
  MessageSquare,
  Coins,
  Flame,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CompletedGame {
  gameId: number;
  gameType: "QUICK_BATTLE" | "ARENA_FIGHT" | "BOSS_BATTLE";
  outcome: "PLAYER_VICTORY" | "AI_VICTORY" | "DRAW" | "EPIC_VICTORY";
  burnedAmount: string;
  rewardAmount: string;
  aiMessage: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
}

interface GameHistoryLogProps {
  completedGames: CompletedGame[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

const GameHistoryLog: React.FC<GameHistoryLogProps> = ({
  completedGames,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<string>("ALL");
  const [selectedGameType, setSelectedGameType] = useState<string>("ALL");
  const [expandedGames, setExpandedGames] = useState<Set<number>>(new Set());

  const getGameTypeConfig = (gameType: CompletedGame["gameType"]) => {
    switch (gameType) {
      case "QUICK_BATTLE":
        return {
          name: "Quick Battle",
          icon: <Zap className="h-4 w-4" />,
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
        };
      case "ARENA_FIGHT":
        return {
          name: "Arena Fight",
          icon: <Sword className="h-4 w-4" />,
          color: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/30",
        };
      case "BOSS_BATTLE":
        return {
          name: "Boss Battle",
          icon: <Crown className="h-4 w-4" />,
          color: "text-purple-400",
          bgColor: "bg-purple-500/10",
          borderColor: "border-purple-500/30",
        };
    }
  };

  const getOutcomeConfig = (outcome: CompletedGame["outcome"]) => {
    switch (outcome) {
      case "PLAYER_VICTORY":
        return {
          text: "Victory",
          icon: <Trophy className="h-4 w-4" />,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          emoji: "🏆",
        };
      case "AI_VICTORY":
        return {
          text: "Defeat",
          icon: <X className="h-4 w-4" />,
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500/30",
          emoji: "💀",
        };
      case "DRAW":
        return {
          text: "Draw",
          icon: <Minus className="h-4 w-4" />,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30",
          emoji: "⚖️",
        };
      case "EPIC_VICTORY":
        return {
          text: "Epic Victory",
          icon: <Sparkles className="h-4 w-4" />,
          color: "text-purple-400",
          bgColor: "bg-purple-500/20",
          borderColor: "border-purple-500/30",
          emoji: "✨",
        };
    }
  };

  const toggleGameExpansion = (gameId: number) => {
    setExpandedGames((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter games based on search and filters
  const filteredGames = completedGames.filter((game) => {
    const matchesSearch =
      searchTerm === "" ||
      game.aiMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.gameId.toString().includes(searchTerm);

    const matchesOutcome =
      selectedOutcome === "ALL" || game.outcome === selectedOutcome;
    const matchesGameType =
      selectedGameType === "ALL" || game.gameType === selectedGameType;

    return matchesSearch && matchesOutcome && matchesGameType;
  });

  // Calculate stats for filtered games
  const stats = {
    total: filteredGames.length,
    wins: filteredGames.filter(
      (g) => g.outcome === "PLAYER_VICTORY" || g.outcome === "EPIC_VICTORY"
    ).length,
    totalBurned: filteredGames.reduce(
      (sum, g) => sum + parseFloat(g.burnedAmount),
      0
    ),
    totalRewards: filteredGames.reduce(
      (sum, g) => sum + parseFloat(g.rewardAmount),
      0
    ),
  };

  if (isLoading && completedGames.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Scroll className="h-5 w-5 text-blue-400" />
            Battle History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-700/30 rounded-lg"></div>
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
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Scroll className="h-5 w-5 text-blue-400" />
            Battle History
            <Badge
              variant="outline"
              className="text-blue-400 border-blue-400/30"
            >
              {stats.total} battles
            </Badge>
          </CardTitle>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48">
              <Input
                placeholder="Search messages or game ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md text-white text-sm"
            >
              <option value="ALL">All Outcomes</option>
              <option value="PLAYER_VICTORY">Victories</option>
              <option value="EPIC_VICTORY">Epic Victories</option>
              <option value="AI_VICTORY">Defeats</option>
              <option value="DRAW">Draws</option>
            </select>

            <select
              value={selectedGameType}
              onChange={(e) => setSelectedGameType(e.target.value)}
              className="px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md text-white text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="QUICK_BATTLE">Quick Battle</option>
              <option value="ARENA_FIGHT">Arena Fight</option>
              <option value="BOSS_BATTLE">Boss Battle</option>
            </select>
          </div>

          {/* Quick Stats */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-center p-2 bg-blue-500/10 rounded border border-blue-500/20">
                <p className="text-blue-400 font-bold">{stats.total}</p>
                <p className="text-blue-300 text-xs">Total Battles</p>
              </div>
              <div className="text-center p-2 bg-green-500/10 rounded border border-green-500/20">
                <p className="text-green-400 font-bold">{stats.wins}</p>
                <p className="text-green-300 text-xs">Victories</p>
              </div>
              <div className="text-center p-2 bg-red-500/10 rounded border border-red-500/20">
                <p className="text-red-400 font-bold">
                  {stats.totalBurned.toLocaleString()}
                </p>
                <p className="text-red-300 text-xs">BBT Burned</p>
              </div>
              <div className="text-center p-2 bg-purple-500/10 rounded border border-purple-500/20">
                <p className="text-purple-400 font-bold">
                  {stats.totalRewards.toLocaleString()}
                </p>
                <p className="text-purple-300 text-xs">BBT Rewards</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="popLayout">
          {filteredGames.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="text-gray-500 mb-4">
                <Scroll className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">
                  {completedGames.length === 0
                    ? "No battle history yet"
                    : "No battles match your filters"}
                </p>
                <p className="text-sm">
                  {completedGames.length === 0
                    ? "Complete some battles to see your history!"
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredGames.map((game, index) => {
                const gameConfig = getGameTypeConfig(game.gameType);
                const outcomeConfig = getOutcomeConfig(game.outcome);
                const isExpanded = expandedGames.has(game.gameId);
                const netResult =
                  parseFloat(game.rewardAmount) - parseFloat(game.burnedAmount);

                return (
                  <motion.div
                    key={game.gameId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Card
                      className={`
                      ${outcomeConfig.bgColor} ${outcomeConfig.borderColor} 
                      border backdrop-blur-sm hover:scale-[1.01] transition-transform duration-200
                    `}
                    >
                      <CardContent className="p-4">
                        {/* Main game info - always visible */}
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleGameExpansion(game.gameId)}
                        >
                          <div className="flex items-center gap-3">
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
                                  className={`${outcomeConfig.color} ${outcomeConfig.borderColor}`}
                                >
                                  {outcomeConfig.emoji} {outcomeConfig.text}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs text-gray-400 border-gray-500/30"
                                >
                                  #{game.gameId}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(game.endTime)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Flame className="h-3 w-3" />
                                  Burned:{" "}
                                  {parseFloat(
                                    game.burnedAmount
                                  ).toLocaleString()}
                                </span>
                                <span
                                  className={`flex items-center gap-1 ${
                                    netResult > 0
                                      ? "text-green-400"
                                      : netResult < 0
                                      ? "text-red-400"
                                      : "text-gray-400"
                                  }`}
                                >
                                  <Coins className="h-3 w-3" />
                                  {netResult > 0 ? "+" : ""}
                                  {netResult.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 pt-4 border-t border-gray-600/30"
                            >
                              {/* AI Message */}
                              <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="h-4 w-4 text-blue-400" />
                                  <span className="text-sm font-medium text-blue-400">
                                    AI Response
                                  </span>
                                </div>
                                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600/30">
                                  <p className="text-gray-300 italic">
                                    &quot;{game.aiMessage}&quot;
                                  </p>
                                </div>
                              </div>

                              {/* Detailed stats */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-400">
                                    Duration:
                                  </span>
                                  <p className="text-white font-medium">
                                    {formatDuration(game.duration)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Burned:</span>
                                  <p className="text-red-400 font-medium">
                                    {parseFloat(
                                      game.burnedAmount
                                    ).toLocaleString()}{" "}
                                    BBT
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Reward:</span>
                                  <p className="text-green-400 font-medium">
                                    {parseFloat(
                                      game.rewardAmount
                                    ).toLocaleString()}{" "}
                                    BBT
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-400">
                                    Net Result:
                                  </span>
                                  <p
                                    className={`font-medium ${
                                      netResult > 0
                                        ? "text-green-400"
                                        : netResult < 0
                                        ? "text-red-400"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {netResult > 0 ? "+" : ""}
                                    {netResult.toLocaleString()} BBT
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center pt-4"
                >
                  <Button
                    variant="outline"
                    onClick={onLoadMore}
                    disabled={isLoading}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Loading...
                      </div>
                    ) : (
                      "Load More Battles"
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default GameHistoryLog;
