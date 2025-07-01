"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock } from "lucide-react";
import {
  TVBBot,
  getActionIcon,
  getActionColor,
  formatActionType,
} from "./helpers";

interface LiveActivityFeedProps {
  bots: TVBBot[];
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ bots }) => {
  const router = useRouter();

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    bot: TVBBot
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/40x40/9333ea/ffffff?text=${
      bot.displayName?.charAt(0) || "B"
    }`;
  };

  const sortedActivity = bots
    .filter((bot) => bot.lastAction)
    .sort(
      (a, b) =>
        new Date(b.lastAction!.timestamp).getTime() -
        new Date(a.lastAction!.timestamp).getTime()
    )
    .slice(0, 20);

  return (
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-400" />
          Live Bot Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No bot activity to display
          </div>
        ) : (
          <div className="space-y-3">
            {sortedActivity.map((bot, index) => (
              <motion.div
                key={`${bot.name}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 cursor-pointer hover:bg-gray-700/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/bots/${bot.name}`)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={bot.avatarUrl}
                    alt={bot.displayName}
                    className="w-10 h-10 rounded-full border border-purple-500/30 flex-shrink-0"
                    onError={(e) => handleImageError(e, bot)}
                  />
                  <div className="overflow-hidden">
                    <p className="text-white font-medium truncate">
                      {bot.displayName}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getActionColor(
                          bot.lastAction?.type
                        )}`}
                      >
                        {getActionIcon(bot.lastAction?.type)}
                        <span>{formatActionType(bot.lastAction?.type)}</span>
                      </div>
                      {bot.lastAction?.message && (
                        <span className="text-gray-400 truncate hidden sm:inline">
                          "{bot.lastAction.message}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500 flex items-center gap-1 flex-shrink-0 ml-2">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(bot.lastAction!.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveActivityFeed;
