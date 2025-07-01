"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

// Import Components and Helpers from the correct relative path
import {
  BotStatus,
  ActivityLog as ActivityLogType,
} from "../components/detailHelpers";
import BotHeader from "../components/BotHeader";
import PerformanceStats from "../components/PerformanceStats";
import BotConfiguration from "../components/BotConfiguration";
import ActivityLog from "../components/ActivityLog";

const BotDetailPage = () => {
  const [bot, setBot] = useState<BotStatus | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [realTimeActivity, setRealTimeActivity] = useState<ActivityLogType[]>(
    []
  );

  const params = useParams();
  const botName = params.bot as string;

  const fetchBotDetails = useCallback(async () => {
    if (!botName) return;

    try {
      const response = await fetch("/api/tvb/webhook");
      if (!response.ok) throw new Error("Failed to fetch fleet data");

      const data = await response.json();
      if (data.success && Array.isArray(data.bots)) {
        const specificBot = data.bots.find((b: any) => b.name === botName);
        if (specificBot) {
          setBot(specificBot);
          setLastUpdate(new Date());

          // Create real activity log from bot's last action
          if (specificBot.lastAction) {
            const newActivity: ActivityLogType = {
              id: `${specificBot.name}-${specificBot.lastAction.timestamp}`,
              action: specificBot.lastAction.type,
              message: specificBot.lastAction.message,
              timestamp: new Date(specificBot.lastAction.timestamp),
              tokenSymbol: specificBot.lastAction.details?.tokenSymbol,
              amount: specificBot.lastAction.details?.amountAvax
                ? `${specificBot.lastAction.details.amountAvax} AVAX`
                : specificBot.lastAction.details?.readableAmount
                ? `${specificBot.lastAction.details.readableAmount} ${specificBot.lastAction.details.tokenSymbol}`
                : undefined,
            };

            // Add to real-time activity if it's new
            setRealTimeActivity((prev) => {
              const exists = prev.some(
                (activity) => activity.id === newActivity.id
              );
              if (!exists) {
                return [newActivity, ...prev.slice(0, 29)]; // Keep last 30 real activities
              }
              return prev;
            });
          }
        } else {
          setBot(null);
        }
      }
    } catch (error) {
      console.error("Error fetching bot details:", error);
      setBot(null);
    } finally {
      setIsLoading(false);
    }
  }, [botName]);

  // Generate historical activity based on bot's personality and config
  const generateHistoricalActivity = useCallback(
    (botData: any): ActivityLogType[] => {
      if (!botData) return [];

      const activities: ActivityLogType[] = [];
      const now = Date.now();

      // Use bot's actual interval for realistic timing
      const minInterval = (botData.config?.minInterval || 15) * 1000; // Convert to ms
      const maxInterval = (botData.config?.maxInterval || 60) * 1000;

      // Generate activities based on bot's personality
      const buyBias = botData.config?.buyBias || 0.6;
      const actions = [];

      // Weight actions based on buy bias
      const buyWeight = Math.floor(buyBias * 10);
      const sellWeight = Math.floor((1 - buyBias) * 10);

      for (let i = 0; i < buyWeight; i++) actions.push("buy");
      for (let i = 0; i < sellWeight; i++) actions.push("sell");
      actions.push("heartbeat"); // Add some heartbeats

      let currentTime = now;

      for (let i = 0; i < 12; i++) {
        // Generate 12 historical activities
        const action = actions[Math.floor(Math.random() * actions.length)];
        const interval =
          Math.random() * (maxInterval - minInterval) + minInterval;
        currentTime -= interval + Math.random() * 120000; // Add more randomness

        let message = "";
        let tokenSymbol: string | undefined;
        let amount: string | undefined;

        // Always use bot's personality phrases for buy/sell actions
        if (action === "buy") {
          const buyPhrases = botData.config?.buyPhrases || [
            "Going long! 📈",
            "Buying the dip! 💎",
            "This looks bullish! 🚀",
            "Adding to my position! 💰",
            "Can't resist this price! 🤑",
          ];
          message = buyPhrases[Math.floor(Math.random() * buyPhrases.length)];
          tokenSymbol = [
            "MOON",
            "BULL",
            "ROCKET",
            "DOGE",
            "PEPE",
            "SHIB",
            "FLOKI",
          ][Math.floor(Math.random() * 7)];
          const tradeAmount =
            Math.random() *
              (botData.config?.maxTradeAmount ||
                0.02 - botData.config?.minTradeAmount ||
                0.005) +
            (botData.config?.minTradeAmount || 0.005);
          amount = `${tradeAmount.toFixed(4)} AVAX`;
        } else if (action === "sell") {
          const sellPhrases = botData.config?.sellPhrases || [
            "Taking profits! 💰",
            "Time to secure gains! ✅",
            "Partial exit here! 📉",
            "Booking some wins! 🎯",
            "Smart exit strategy! 🧠",
          ];
          message = sellPhrases[Math.floor(Math.random() * sellPhrases.length)];
          tokenSymbol = [
            "MOON",
            "BULL",
            "ROCKET",
            "DOGE",
            "PEPE",
            "SHIB",
            "FLOKI",
          ][Math.floor(Math.random() * 7)];
          const tokenAmount = Math.random() * 2000 + 100;
          amount = `${tokenAmount.toFixed(2)} ${tokenSymbol}`;
        } else if (action === "heartbeat") {
          message = `${botData.displayName} is active and trading`;
        }

        activities.push({
          id: `${botData.name}-historical-${i}-${currentTime}`,
          action,
          message,
          timestamp: new Date(currentTime),
          tokenSymbol,
          amount,
        });
      }

      return activities.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    },
    []
  );

  // Update activity log when bot data changes
  useEffect(() => {
    if (bot) {
      // Only use real-time activities, no historical mock data
      const realActivities = [...realTimeActivity]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20); // Keep only latest 20

      setActivityLog(realActivities);
    }
  }, [bot, realTimeActivity]);

  useEffect(() => {
    fetchBotDetails();
    const interval = setInterval(fetchBotDetails, 10000); // Refresh every 10 seconds for more real-time feel
    return () => clearInterval(interval);
  }, [fetchBotDetails]);

  if (isLoading && !bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading bot details for "{botName}"...</p>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl text-white mb-4">Bot Not Found</h1>
          <p className="text-gray-400 mb-4">
            Could not find bot "{botName}" in the active fleet.
          </p>
          <Link
            href="/bots"
            className="text-purple-400 hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bot Fleet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto p-6 pt-24 space-y-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between"
        >
          <Link
            href="/bots"
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bot Fleet
          </Link>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <div className="text-sm text-gray-400 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={fetchBotDetails}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BotHeader
            bot={bot}
            showConfig={showConfig}
            onToggleConfig={() => setShowConfig(!showConfig)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PerformanceStats bot={bot} />
        </motion.div>

        {bot.config && (
          <BotConfiguration showConfig={showConfig} config={bot.config} />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ActivityLog logs={activityLog} />
        </motion.div>
      </div>
    </div>
  );
};

export default BotDetailPage;
