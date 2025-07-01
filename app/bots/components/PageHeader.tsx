"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, RefreshCw } from "lucide-react";

interface PageHeaderProps {
  lastUpdate: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  lastUpdate,
  onRefresh,
  isLoading,
}) => (
  <motion.div
    className="mb-8"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
            <Bot className="h-8 w-8 text-purple-400" />
          </div>
          Transparent Volume Bots
          <Badge
            className="bg-blue-500/20 text-blue-400 border-blue-500/30"
            variant="outline"
          >
            TVB Fleet
          </Badge>
        </h1>
        <p className="text-gray-400 text-lg">
          Personality-driven trading bots creating authentic volume
        </p>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdate && (
          <div className="text-sm text-gray-400 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Updated {lastUpdate.toLocaleTimeString()}
          </div>
        )}
        <Button
          onClick={onRefresh}
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
    </div>
  </motion.div>
);

export default PageHeader;
