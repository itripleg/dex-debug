"use client";

import React from "react";
import { useTrades } from "@/contexts/TradesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUnits } from "viem";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressComponent } from "@/components/AddressComponent";

interface RecentTradesProps {
  tokenAddress: string;
}

// FIX: This helper function now correctly handles the ISO date string
// It will format the timestamp into a relative time like "2 minutes ago"
const formatTimestamp = (timestampStr: string): string => {
  try {
    const date = parseISO(timestampStr);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Failed to format timestamp:", timestampStr, error);
    return "Invalid date";
  }
};

export default function RecentTrades({ tokenAddress }: RecentTradesProps) {
  const { trades, loading, error } = useTrades(tokenAddress);

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );

  return (
    <Card className="h-[600px] overflow-y-scroll scrollbar-thin">
      <CardHeader>
        <CardTitle className="text-base text-center">Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          renderSkeleton()
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trades yet.</p>
        ) : (
          <div className="space-y-4">
            {trades.slice(0, 10).map((trade) => (
              <div
                key={trade.transactionHash}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  {trade.type === "buy" ? (
                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <AddressComponent hash={trade.trader} type="address" />
                    <span className="text-xs text-muted-foreground">
                      {/* This now works because formatTimestamp accepts a string */}
                      {formatTimestamp(trade.timestamp)}
                    </span>
                  </div>
                </div>
                <div
                  className={`font-mono ${
                    trade.type === "buy" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {parseFloat(
                    formatUnits(BigInt(trade.tokenAmount), 18)
                  ).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
