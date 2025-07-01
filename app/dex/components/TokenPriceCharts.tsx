"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import RechartsLineChart from "./charts/RechartsLineChart";
import { useToken } from "@/contexts/TokenContext";
// We no longer need useTokenContractState for the price here
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import { Address } from "viem";
import { TVChart } from "./charts/TVChart";

interface TokenPriceChartsProps {
  address: string;
}

export function TokenPriceCharts({ address }: TokenPriceChartsProps) {
  // We only need token metadata and the trade history
  const { token, loading: tokenLoading, error: tokenError } = useToken(address);
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useTokenTrades(address as Address);

  const loading = tokenLoading || tradesLoading;
  const error = tokenError || tradesError;

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  if (loading && !token) {
    return (
      <div className="text-muted-foreground text-center p-4">
        Loading Chart Data...
      </div>
    );
  }

  if (!token) {
    return null;
  }

  // The component is now much simpler. It just passes the trades down.
  return (
    <div className="grid gap-4 md:grid-cols-1">
      {/* ... other charts ... */}
      <Card className="h-[400px] p-6">
        <RechartsLineChart
          trades={trades}
          loading={loading}
          token={token} // Pass the entire token object
        />
      </Card>
    </div>
  );
}
