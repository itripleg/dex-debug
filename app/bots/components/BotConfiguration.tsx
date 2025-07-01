"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Settings } from "lucide-react";
import { BotConfig } from "./detailHelpers";

interface BotConfigurationProps {
  showConfig: boolean;
  config: BotConfig;
}

const BotConfiguration: React.FC<BotConfigurationProps> = ({
  showConfig,
  config,
}) => (
  <AnimatePresence>
    {showConfig && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-8"
      >
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-400" />
              Bot Configuration
              <Badge
                variant="outline"
                className="text-blue-400 border-blue-400"
              >
                Live Config
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Trading Parameters */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">
                  Trading Parameters
                </h3>
                <div>
                  <label className="text-gray-300 text-sm">Buy Bias</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={(config.buyBias ?? 0.5) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-white text-sm">
                      {(config.buyBias ?? 0.5) * 100}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 text-sm">
                    Risk Tolerance
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={(config.riskTolerance ?? 0.5) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-white text-sm">
                      {(config.riskTolerance ?? 0.5) * 100}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 text-sm">Trading Range</label>
                  <div className="bg-gray-700 border border-gray-600 text-white text-sm p-2 rounded mt-1">
                    {`${config.minTradeAmount}-${config.maxTradeAmount} AVAX`}
                  </div>
                </div>
              </div>
              {/* Timing & Behavior */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">
                  Timing & Behavior
                </h3>
                <div>
                  <label className="text-gray-300 text-sm">
                    Interval Range
                  </label>
                  <div className="bg-gray-700 border border-gray-600 text-white text-sm p-2 rounded mt-1">
                    {`${config.minInterval}-${config.maxInterval} seconds`}
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 text-sm">
                    Create Token Chance
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={(config.createTokenChance ?? 0.01) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-white text-sm">
                      {((config.createTokenChance ?? 0.01) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              {/* Personality */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">
                  Personality
                </h3>
                {config.buyPhrases && (
                  <div>
                    <label className="text-gray-300 text-sm">Buy Phrases</label>
                    <div className="text-sm text-gray-400 bg-gray-700/30 p-2 rounded max-h-20 overflow-y-auto mt-1">
                      {config.buyPhrases.slice(0, 3).map((p, i) => (
                        <div key={i} className="italic">
                          "{p}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {config.sellPhrases && (
                  <div>
                    <label className="text-gray-300 text-sm">
                      Sell Phrases
                    </label>
                    <div className="text-sm text-gray-400 bg-gray-700/30 p-2 rounded max-h-20 overflow-y-auto mt-1">
                      {config.sellPhrases.slice(0, 3).map((p, i) => (
                        <div key={i} className="italic">
                          "{p}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )}
  </AnimatePresence>
);

export default BotConfiguration;
