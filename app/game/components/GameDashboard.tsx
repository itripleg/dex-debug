import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sword,
  Trophy,
  Flame,
  Coins,
  Brain,
  Activity,
  Target,
  Zap,
} from "lucide-react";

interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  activeGames: number;
  totalBurned: string;
  totalRewards: string;
}

interface GameDashboardProps {
  bbtBalance: string;
  gameStats: GameStats;
  isLoading?: boolean;
}

const GameDashboard: React.FC<GameDashboardProps> = ({
  bbtBalance,
  gameStats,
  isLoading = false,
}) => {
  const winRate =
    gameStats.totalGames > 0
      ? ((gameStats.wins / gameStats.totalGames) * 100).toFixed(1)
      : "0.0";

  const battlePower = Math.floor(parseFloat(bbtBalance) / 1000); // Simple battle power calculation

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card
            key={i}
            className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm animate-pulse"
          >
            <CardContent className="p-6">
              <div className="h-16 bg-gray-700/30 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
            <Brain className="h-8 w-8 text-purple-400" />
          </div>
          BigBrain Battle Arena
          <Badge
            className="bg-orange-500/20 text-orange-400 border-orange-500/30"
            variant="outline"
          >
            🔥 LIVE
          </Badge>
        </h1>
        <p className="text-gray-400 text-lg">
          Burn BBT tokens to battle the AI and prove your intelligence
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* BBT Balance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30 backdrop-blur-sm hover:scale-105 transition-transform">
            <CardContent className="p-6 text-center">
              <Coins className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">
                {parseFloat(bbtBalance).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-sm text-purple-300">BBT Balance</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Battle Power */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30 backdrop-blur-sm hover:scale-105 transition-transform">
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">
                {battlePower.toLocaleString()}
              </p>
              <p className="text-sm text-orange-300">Battle Power</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Win Rate */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30 backdrop-blur-sm hover:scale-105 transition-transform">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{winRate}%</p>
              <p className="text-sm text-green-300">Win Rate</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Games */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30 backdrop-blur-sm hover:scale-105 transition-transform">
            <CardContent className="p-6 text-center">
              <Activity className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">
                {gameStats.activeGames}
              </p>
              <p className="text-sm text-blue-300">Active Games</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Battles */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-600/30 backdrop-blur-sm hover:scale-105 transition-transform">
            <CardContent className="p-6 text-center">
              <Sword className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">
                {gameStats.totalGames}
              </p>
              <p className="text-sm text-gray-300">Total Battles</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* BBT Burned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-gradient-to-br from-red-900/30 to-pink-900/30 border-red-500/30 backdrop-blur-sm hover:scale-105 transition-transform">
            <CardContent className="p-6 text-center">
              <Flame className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {parseFloat(gameStats.totalBurned).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-sm text-red-300">BBT Burned</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Battle Record Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              Battle Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-2xl font-bold text-green-400">
                  {gameStats.wins}
                </p>
                <p className="text-green-300 text-sm">Victories</p>
              </div>
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-2xl font-bold text-red-400">
                  {gameStats.losses}
                </p>
                <p className="text-red-300 text-sm">Defeats</p>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-2xl font-bold text-yellow-400">
                  {gameStats.draws}
                </p>
                <p className="text-yellow-300 text-sm">Draws</p>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <p className="text-2xl font-bold text-purple-400">
                  {parseFloat(gameStats.totalRewards).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }
                  )}
                </p>
                <p className="text-purple-300 text-sm">BBT Rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default GameDashboard;
