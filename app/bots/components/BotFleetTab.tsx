import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, BarChart3 } from "lucide-react";
import { TVBBot, FleetStats } from "./helpers";
import BotCard from "./BotCard";

interface BotFleetTabProps {
  bots: TVBBot[];
  fleetStats: FleetStats;
}

const BotFleetTab: React.FC<BotFleetTabProps> = ({ bots, fleetStats }) => {
  if (bots.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Bot className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Bots Online</h3>
          <p className="text-gray-400 mb-4">
            No TVB instances are currently running or connected.
          </p>
          <p className="text-gray-500 text-sm">
            Start a bot with:{" "}
            <code className="bg-gray-700 px-2 py-1 rounded">
              {/* python main.py --config configs/bullish_billy.json --auto */}
              py .\launch_all.py --auto --verbose --auto
            </code>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {bots.map((bot, index) => (
          <BotCard key={bot.name || index} bot={bot} index={index} />
        ))}
      </div>

      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Fleet Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-500/10 rounded-lg">
              <p className="text-blue-400 text-2xl font-bold">
                {fleetStats.totalActions}
              </p>
              <p className="text-blue-400 text-sm">Total Actions</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-green-400 text-2xl font-bold">
                {fleetStats.activeBots}
              </p>
              <p className="text-green-400 text-sm">Active Bots</p>
            </div>
            <div className="text-center p-4 bg-purple-500/10 rounded-lg">
              <p className="text-purple-400 text-2xl font-bold">
                {fleetStats.totalBots}
              </p>
              <p className="text-purple-400 text-sm">Total Bots</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BotFleetTab;
