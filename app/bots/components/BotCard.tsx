"use client";
import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, MessageCircle, ExternalLink } from "lucide-react";
import { TVBBot } from "./helpers";
import {
  getStatusColor,
  getMoodIcon,
  getMoodColor,
  getActionIcon,
  getActionColor,
  formatActionType,
} from "./helpers";

interface BotCardProps {
  bot: TVBBot;
  index: number;
}

const BotCard: React.FC<BotCardProps> = ({ bot, index }) => {
  const router = useRouter();
  const [lastActionKey, setLastActionKey] = React.useState("");
  const [lastMessageKey, setLastMessageKey] = React.useState("");

  // Track action changes for subtle animations
  React.useEffect(() => {
    if (bot.lastAction) {
      const actionKey = `${bot.lastAction.type}-${bot.lastAction.timestamp}`;
      const messageKey = `${bot.lastAction.message}-${bot.lastAction.timestamp}`;

      if (actionKey !== lastActionKey) {
        setLastActionKey(actionKey);
      }
      if (messageKey !== lastMessageKey) {
        setLastMessageKey(messageKey);
      }
    }
  }, [
    bot.lastAction?.timestamp,
    bot.lastAction?.type,
    bot.lastAction?.message,
    lastActionKey,
    lastMessageKey,
  ]);

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/64x64/9333ea/ffffff?text=${
      bot.displayName?.charAt(0) || "B"
    }`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a link
    if ((e.target as HTMLElement).closest("a")) {
      return;
    }
    router.push(`/bots/${bot.name}`);
  };

  // Use bot's calculated session duration instead of frontend calculation
  const getSessionUptime = (): string => {
    // Use bot's calculated session duration from webhook
    const sessionMinutes = bot.lastAction?.details?.sessionDurationMinutes;

    if (sessionMinutes !== undefined) {
      const hours = Math.floor(sessionMinutes / 60);
      const minutes = sessionMinutes % 60;

      if (hours > 0) {
        return `${hours}h`;
      }
      return `${minutes}m`;
    }

    // Fallback to frontend calculation only if bot data unavailable
    const fallbackHours =
      Math.floor(
        (Date.now() - new Date(bot.sessionStarted).getTime()) / 3600000
      ) || 0;
    return `${fallbackHours}h`;
  };

  const uptimeDisplay = getSessionUptime();

  // Extract token info from last action details based on webhook structure
  const getTokenInfo = () => {
    if (!bot.lastAction?.details) {
      return null;
    }

    const details = bot.lastAction.details;

    // Based on webhook code: tokenSymbol and tokenName are direct properties
    const tokenSymbol = details.tokenSymbol;
    const tokenAddress = details.tokenAddress || details.contractAddress;

    if (tokenSymbol) {
      return {
        address: tokenAddress || "unknown",
        symbol: tokenSymbol,
      };
    }

    return null;
  };

  const tokenInfo = getTokenInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card
        className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        onClick={handleCardClick}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-300"
            style={{ backgroundImage: `url(${bot.avatarUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header - Fixed Height */}
          <CardHeader className="pb-3 flex-shrink-0 h-[140px]">
            <div className="flex items-center justify-between mb-4">
              <Badge className={getStatusColor(bot.isOnline)} variant="outline">
                {bot.isOnline ? (
                  <Wifi className="h-3 w-3 mr-1" />
                ) : (
                  <WifiOff className="h-3 w-3 mr-1" />
                )}
                {bot.isOnline ? "Online" : "Offline"}
              </Badge>
              {bot.character?.mood && (
                <div className="flex items-center gap-2">
                  {getMoodIcon(bot.character.mood)}
                  <span
                    className={`text-sm font-medium ${getMoodColor(
                      bot.character.mood
                    )}`}
                  >
                    {bot.character.mood}
                  </span>
                </div>
              )}
            </div>

            {/* Bot Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={bot.avatarUrl}
                  alt={bot.displayName}
                  className="w-16 h-16 rounded-full border-2 border-purple-500/30 object-cover"
                  onError={handleImageError}
                />
                {bot.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-white text-lg truncate">
                  {bot.displayName}
                </CardTitle>
                <p className="text-gray-400 text-sm truncate">
                  {bot.character?.personality?.replace(/_/g, " ") ||
                    "Trading Bot"}
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Content - Flexible Height */}
          <CardContent className="flex-1 flex flex-col space-y-4 pb-4">
            {/* Bio Section - Fixed Height */}
            <div className="h-[60px] flex-shrink-0">
              {bot.bio ? (
                <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 h-full overflow-hidden">
                  <p className="text-gray-300 text-sm italic leading-tight overflow-hidden text-ellipsis">
                    &quot;
                    {bot.bio.length > 80
                      ? `${bot.bio.substring(0, 80)}...`
                      : bot.bio}
                    &quot;
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-gray-700/20 rounded-lg border border-gray-600/20 h-full flex items-center justify-center">
                  <p className="text-gray-500 text-sm italic">
                    No bio available
                  </p>
                </div>
              )}
            </div>

            {/* Stats Grid - Fixed Height */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0 h-[60px]">
              <div className="text-center p-2 bg-blue-500/10 rounded-lg flex flex-col justify-center">
                <p className="text-white font-bold text-lg">
                  {bot.totalActions || 0}
                </p>
                <p className="text-gray-400 text-xs">Actions</p>
              </div>
              <div className="text-center p-2 bg-purple-500/10 rounded-lg flex flex-col justify-center">
                <p className="text-white font-bold text-lg">{uptimeDisplay}</p>
                <p className="text-gray-400 text-xs">Uptime</p>
              </div>
            </div>

            {/* Last Action Info - Fixed Height */}
            <div className="flex-shrink-0 space-y-2 h-[80px]">
              {bot.lastAction ? (
                <div className="space-y-2">
                  {/* Action Type and Time */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Last Action:</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getActionColor(
                          bot.lastAction.type
                        )}`}
                      >
                        {getActionIcon(bot.lastAction.type)}
                        <span>{formatActionType(bot.lastAction.type)}</span>
                      </div>
                      {/* Show ticker for buy/sell actions */}
                      {tokenInfo &&
                        (bot.lastAction.type === "buy" ||
                          bot.lastAction.type === "sell") && (
                          <Link
                            href={`/dex/${tokenInfo.address}`}
                            className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 hover:text-purple-300 rounded-full transition-colors border border-purple-500/30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-medium">
                              {tokenInfo.symbol}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      {/* Fallback ticker display if no token info but it's a trade action */}
                      {!tokenInfo &&
                        (bot.lastAction.type === "buy" ||
                          bot.lastAction.type === "sell") && (
                          <div className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
                            <span className="text-xs">TOKEN</span>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">When:</span>
                    <span className="text-white text-xs">
                      {new Date(bot.lastAction.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 text-sm italic">
                    No recent actions
                  </p>
                </div>
              )}
            </div>

            {/* Message Section - Fixed Height with Subtle Animation */}
            <div className=" flex-shrink-0">
              {bot.lastAction?.message ? (
                <div className="p-3 bg-gray-700/40 rounded-lg h-full overflow-hidden">
                  <motion.div
                    key={lastMessageKey}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex items-start gap-2 h-full"
                  >
                    <MessageCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm leading-tight overflow-hidden">
                      &quot;
                      {bot.lastAction.message.length > 60
                        ? `${bot.lastAction.message.substring(0, 60)}...`
                        : bot.lastAction.message}
                      &quot;
                    </p>
                  </motion.div>
                </div>
              ) : (
                <div className="p-3 bg-gray-700/20 rounded-lg h-full flex items-center justify-center">
                  <p className="text-gray-500 text-sm italic">No message</p>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default BotCard;
