// app/dex/components/tokens/TokenGrid.tsx
import { motion } from "framer-motion";
import { TokenCard } from "./TokenCard";
import { Token } from "@/types";
import { type Address } from "viem";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeTokenPrices } from "@/hooks/token/useRealtimeTokenPrices";

interface TokenGridProps {
  tokens: Token[];
}

export const TokenGrid = ({ tokens }: TokenGridProps) => {
  // Extract token addresses for price fetching
  const tokenAddresses = tokens.map((token) => token.address as Address);

  // Use the new real-time prices hook
  const { prices, isLoading, error, refreshPrices, lastUpdate } =
    useRealtimeTokenPrices(tokenAddresses, {
      refreshInterval: 15000, // 15 seconds
      eventRefreshDelay: 2000, // 2 seconds after trade events
      enableEventListening: true,
    });

  // Loading state
  if (isLoading && Object.keys(prices).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading token prices...</span>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error && Object.keys(prices).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load token prices</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshPrices}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  // No tokens state
  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium">No tokens found</p>
          <p className="text-sm">Create a new token to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          {tokens.length} token{tokens.length !== 1 ? "s" : ""} found
        </span>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
          {lastUpdate > 0 && (
            <span className="text-xs">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPrices}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Token grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-screen overflow-y-auto scrollbar-thin p-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {tokens.map((token) => {
          const priceData = prices[token.address.toLowerCase()];

          return (
            <TokenCard
              key={token.address}
              token={token}
              price={priceData?.formatted || "0.000000"}
              rawPrice={priceData?.raw || "0"}
              isLoading={isLoading}
              lastUpdated={priceData?.lastUpdated}
            />
          );
        })}
      </motion.div>
    </div>
  );
};
