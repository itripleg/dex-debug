"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wifi, WifiOff, Eye, EyeOff, Settings } from "lucide-react";
import { BotStatus, getMoodColor, getMoodIcon } from "./detailHelpers";

interface BotHeaderProps {
  bot: BotStatus;
  showConfig: boolean;
  onToggleConfig: () => void;
}

const BotHeader: React.FC<BotHeaderProps> = ({
  bot,
  showConfig,
  onToggleConfig,
}) => {
  const getStatusColor = (isOnline: boolean) =>
    isOnline ? "bg-green-500" : "bg-red-500";

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/96x96/9333ea/ffffff?text=${
      bot.displayName?.charAt(0) || "B"
    }`;
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${bot.avatarUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
      </div>

      <div className="relative z-10">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="relative flex-shrink-0">
                <img
                  src={bot.avatarUrl}
                  alt={bot.displayName}
                  className="w-24 h-24 rounded-full border-4 border-purple-500/30 object-cover"
                  onError={handleImageError}
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusColor(
                    bot.isOnline
                  )} rounded-full border-2 border-gray-800 ${
                    bot.isOnline ? "animate-pulse" : ""
                  }`}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-4 mb-3">
                  <h1 className="text-4xl font-bold text-white">
                    {bot.displayName}
                  </h1>
                  <Badge
                    className={`${
                      bot.isOnline
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}
                    variant="outline"
                  >
                    {bot.isOnline ? (
                      <Wifi className="h-3 w-3 mr-1" />
                    ) : (
                      <WifiOff className="h-3 w-3 mr-1" />
                    )}
                    {bot.isOnline ? "Online" : "Offline"}
                  </Badge>
                  {bot.character?.mood && (
                    <Badge
                      className={`${getMoodColor(
                        bot.character.mood
                      )} border-current bg-transparent`}
                      variant="outline"
                    >
                      {getMoodIcon(bot.character.mood)}
                      <span className="ml-1 capitalize">
                        {bot.character.mood}
                      </span>
                    </Badge>
                  )}
                </div>

                {bot.bio && (
                  <p className="text-gray-300 mb-3 text-lg">{bot.bio}</p>
                )}
                {bot.character?.catchphrase && (
                  <p className="text-purple-300 italic mb-4 text-lg">
                    "{bot.character.catchphrase}"
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {/* Status, Last Seen, Energy, Session */}
                  <div>
                    <p className="text-gray-400">Status</p>
                    <p
                      className={
                        bot.isOnline
                          ? "text-green-400 font-medium"
                          : "text-red-400 font-medium"
                      }
                    >
                      {bot.isOnline ? "Active" : "Offline"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Last Seen</p>
                    <p className="text-white">
                      {new Date(bot.lastSeen).toLocaleTimeString()}
                    </p>
                  </div>
                  {bot.character?.energy !== undefined && (
                    <div>
                      <p className="text-gray-400">Energy</p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={bot.character.energy}
                          className="h-2 w-16"
                        />
                        <span className="text-white text-xs">
                          {bot.character.energy}%
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400">Session Uptime</p>
                    <p className="text-white">
                      {Math.floor(
                        (Date.now() - new Date(bot.sessionStarted).getTime()) /
                          3600000
                      )}
                      h
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto flex-shrink-0">
              {bot.config && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleConfig}
                  className="border-gray-600 text-gray-300"
                >
                  {showConfig ? (
                    <EyeOff className="h-4 w-4 mr-1" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  Config
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default BotHeader;
