"use client";
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Target, DollarSign } from "lucide-react";
import {
  ActivityLog as ActivityLogType,
  getActionColor,
} from "./detailHelpers";

interface ActivityLogProps {
  logs: ActivityLogType[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => (
  <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <Activity className="h-5 w-5 text-green-400" />
        Live Activity Feed
        <Badge variant="outline" className="text-green-400 border-green-400">
          {logs.length} events
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30"
          >
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(
                log.action
              )}`}
            >
              {log.action.toUpperCase().replace("_", " ")}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{log.message}</p>
              <div className="flex items-center flex-wrap gap-4 mt-1 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {log.timestamp.toLocaleTimeString()}
                </span>
                {log.tokenSymbol && (
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {log.tokenSymbol}
                  </span>
                )}
                {log.amount && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {log.amount}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default ActivityLog;
