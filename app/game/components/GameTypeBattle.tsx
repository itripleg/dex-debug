import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Sword,
  Crown,
  Flame,
  AlertTriangle,
  Target,
  Trophy,
  Coins,
} from "lucide-react";

interface GameType {
  id: "QUICK_BATTLE" | "ARENA_FIGHT" | "BOSS_BATTLE";
  name: string;
  description: string;
  minBurn: number;
  maxReward: string;
  winChance: number;
  icon: React.ReactNode;
  difficulty: "Easy" | "Medium" | "Hard";
  color: string;
  borderColor: string;
  bgGradient: string;
}

interface GameTypeBattleProps {
  bbtBalance: string;
  onStartBattle: (gameType: GameType["id"], burnAmount: string) => void;
  isLoading?: boolean;
  isConnected?: boolean;
}

const GameTypeBattle: React.FC<GameTypeBattleProps> = ({
  bbtBalance,
  onStartBattle,
  isLoading = false,
  isConnected = true,
}) => {
  const [selectedType, setSelectedType] = useState<GameType["id"] | null>(null);
  const [burnAmount, setBurnAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gameTypes: GameType[] = [
    {
      id: "QUICK_BATTLE",
      name: "Quick Battle",
      description:
        "Fast-paced skirmish against the AI. Perfect for testing your luck!",
      minBurn: 1000,
      maxReward: "1.5x",
      winChance: 60,
      icon: <Zap className="h-8 w-8" />,
      difficulty: "Easy",
      color: "text-green-400",
      borderColor: "border-green-500/30",
      bgGradient: "from-green-900/30 to-emerald-900/30",
    },
    {
      id: "ARENA_FIGHT",
      name: "Arena Fight",
      description:
        "Balanced combat in the neural arena. Strategy meets chance.",
      minBurn: 5000,
      maxReward: "2x",
      winChance: 50,
      icon: <Sword className="h-8 w-8" />,
      difficulty: "Medium",
      color: "text-blue-400",
      borderColor: "border-blue-500/30",
      bgGradient: "from-blue-900/30 to-cyan-900/30",
    },
    {
      id: "BOSS_BATTLE",
      name: "Boss Battle",
      description: "Face the ultimate AI overlord. High risk, massive rewards!",
      minBurn: 20000,
      maxReward: "3x",
      winChance: 30,
      icon: <Crown className="h-8 w-8" />,
      difficulty: "Hard",
      color: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgGradient: "from-purple-900/30 to-pink-900/30",
    },
  ];

  const selectedGameType = gameTypes.find((gt) => gt.id === selectedType);
  const userBalance = parseFloat(bbtBalance);
  const burnAmountNum = parseFloat(burnAmount) || 0;

  const canAfford = burnAmountNum <= userBalance;
  const meetsMinimum = selectedGameType
    ? burnAmountNum >= selectedGameType.minBurn
    : false;
  const canStartBattle =
    isConnected && canAfford && meetsMinimum && !isLoading && !isSubmitting;

  const handleStartBattle = async () => {
    if (!selectedGameType || !canStartBattle) return;

    setIsSubmitting(true);
    try {
      await onStartBattle(selectedGameType.id, burnAmount);
      setBurnAmount("");
      setSelectedType(null);
    } catch (error) {
      console.error("Failed to start battle:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "Medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "Hard":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Target className="h-7 w-7 text-orange-400" />
          Choose Your Battle
        </h2>
        <p className="text-gray-400">
          Burn BBT tokens to challenge the AI and earn rewards
        </p>
      </motion.div>

      {/* Game Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gameTypes.map((gameType, index) => (
          <motion.div
            key={gameType.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`
                bg-gradient-to-br ${gameType.bgGradient} 
                border ${gameType.borderColor} 
                backdrop-blur-sm cursor-pointer transition-all duration-300
                ${
                  selectedType === gameType.id
                    ? "ring-2 ring-offset-2 ring-offset-gray-900 ring-current scale-105"
                    : "hover:scale-105"
                }
              `}
              onClick={() => setSelectedType(gameType.id)}
            >
              <CardHeader className="text-center pb-3">
                <div className={`${gameType.color} mx-auto mb-3`}>
                  {gameType.icon}
                </div>
                <CardTitle className={`${gameType.color} text-xl`}>
                  {gameType.name}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={getDifficultyColor(gameType.difficulty)}
                >
                  {gameType.difficulty}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm text-center">
                  {gameType.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min Burn:</span>
                    <span className="text-white font-medium">
                      {gameType.minBurn.toLocaleString()} BBT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Reward:</span>
                    <span className={gameType.color}>{gameType.maxReward}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Chance:</span>
                    <span className="text-white">{gameType.winChance}%</span>
                  </div>
                </div>

                {selectedType === gameType.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pt-4 border-t border-gray-600/30"
                  >
                    <Badge
                      variant="outline"
                      className="text-green-400 border-green-400/30 w-full justify-center"
                    >
                      ✓ Selected
                    </Badge>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Burn Amount Input */}
      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                Set Burn Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Your BBT Balance:</span>
                  <span className="text-white font-medium">
                    {userBalance.toLocaleString()} BBT
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Minimum Required:</span>
                  <span className="text-white">
                    {selectedGameType?.minBurn.toLocaleString()} BBT
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder={`Enter amount (min: ${selectedGameType?.minBurn.toLocaleString()})`}
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400"
                  min={selectedGameType?.minBurn}
                  max={userBalance}
                />

                {/* Quick Amount Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {selectedGameType &&
                    [
                      selectedGameType.minBurn,
                      selectedGameType.minBurn * 2,
                      selectedGameType.minBurn * 5,
                      Math.floor(userBalance * 0.1),
                      Math.floor(userBalance * 0.5),
                    ]
                      .filter(
                        (amount, index, arr) =>
                          amount <= userBalance &&
                          amount >= selectedGameType.minBurn &&
                          arr.indexOf(amount) === index // Remove duplicates
                      )
                      .map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setBurnAmount(amount.toString())}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          {amount.toLocaleString()}
                        </Button>
                      ))}
                  {userBalance > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setBurnAmount(Math.floor(userBalance).toString())
                      }
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                    >
                      All In
                    </Button>
                  )}
                </div>
              </div>

              {/* Validation Messages */}
              {burnAmount && (
                <div className="space-y-2">
                  {!canAfford && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Insufficient BBT balance
                    </div>
                  )}
                  {!meetsMinimum && canAfford && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Below minimum burn amount
                    </div>
                  )}
                  {canAfford && meetsMinimum && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Trophy className="h-4 w-4" />
                        Potential reward:{" "}
                        {burnAmountNum *
                          parseFloat(
                            selectedGameType?.maxReward.replace("x", "") || "1"
                          )}{" "}
                        BBT
                      </div>
                      <div className="flex items-center gap-2 text-blue-400 text-sm">
                        <Coins className="h-4 w-4" />
                        Remaining balance:{" "}
                        {(userBalance - burnAmountNum).toLocaleString()} BBT
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Start Battle Button */}
              <Button
                onClick={handleStartBattle}
                disabled={!canStartBattle}
                className={`
                  w-full h-12 text-lg font-bold transition-all duration-300
                  ${
                    canStartBattle
                      ? `${selectedGameType?.color} bg-gradient-to-r ${selectedGameType?.bgGradient} border ${selectedGameType?.borderColor} hover:scale-105 hover:shadow-lg`
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    Starting Battle...
                  </div>
                ) : !isConnected ? (
                  "Connect Wallet"
                ) : (
                  `🔥 Start ${selectedGameType?.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default GameTypeBattle;
