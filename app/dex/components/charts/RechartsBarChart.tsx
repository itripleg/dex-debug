"use client";
import React, { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts";
import { format } from "date-fns";

interface TokenPriceChartProps {
  trades: Array<{
    pricePerToken: string;
    timestamp: string;
    type: "buy" | "sell";
    ethAmount: string;
    tokenAmount: string;
  }>;
  loading: boolean;
  currentPrice?: string;
  tokenSymbol?: string;
}

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const TokenPriceChart = ({
  trades,
  loading,
  currentPrice,
  tokenSymbol,
}: TokenPriceChartProps) => {
  // Function to group trades into candles
  const groupTradesIntoCandles = (
    trades: TokenPriceChartProps["trades"],
    intervalMinutes: number = 15
  ) => {
    const candleMap = new Map<number, CandleData>();

    trades.forEach((trade) => {
      const timestamp = new Date(trade.timestamp).getTime();
      const interval = intervalMinutes * 60 * 1000;
      const candleTimestamp = Math.floor(timestamp / interval) * interval;
      const price = parseFloat(trade.pricePerToken);
      const volume = parseFloat(trade.ethAmount) / 1e18; // Convert from wei to ETH

      if (!candleMap.has(candleTimestamp)) {
        candleMap.set(candleTimestamp, {
          timestamp: candleTimestamp,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: volume,
        });
      } else {
        const candle = candleMap.get(candleTimestamp)!;
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price;
        candle.volume += volume;
      }
    });

    return Array.from(candleMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  };

  // Memoize candle data calculation
  const candleData = useMemo(() => groupTradesIntoCandles(trades), [trades]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">
            {format(new Date(label), "MMM dd yyyy HH:mm")}
          </p>
          <p className="text-sm text-primary">
            Open: {payload[0]?.value.toFixed(12)} ETH
          </p>
          <p className="text-sm text-primary">
            High: {payload[1]?.value.toFixed(12)} ETH
          </p>
          <p className="text-sm text-primary">
            Low: {payload[2]?.value.toFixed(12)} ETH
          </p>
          <p className="text-sm text-primary">
            Close: {payload[3]?.value.toFixed(12)} ETH
          </p>
          <p className="text-sm text-primary">
            Volume: {payload[4]?.value.toFixed(4)} ETH
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading trades...
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No trades found for this token
      </div>
    );
  }

  // Calculate price range for better scaling
  const allPrices = candleData.flatMap((d) => [d.open, d.high, d.low, d.close]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceDiff = maxPrice - minPrice;
  const yDomain = [
    Math.max(0, minPrice - priceDiff * 0.1),
    maxPrice + priceDiff * 0.1,
  ];

  return (
    <div className="w-full h-full">
      <div className="absolute top-4 left-4 text-sm text-muted-foreground">
        {tokenSymbol ? `${tokenSymbol}/ETH` : "Price Chart"}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={candleData}
          margin={{ top: 40, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2f3540" />
          <XAxis
            dataKey="timestamp"
            scale="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value) => format(new Date(value), "HH:mm")}
            stroke="#6b7280"
          />
          <YAxis
            yAxisId="price"
            domain={yDomain}
            tickFormatter={(value) => value.toFixed(12)}
            stroke="#6b7280"
          />
          <YAxis
            yAxisId="volume"
            orientation="right"
            tickFormatter={(value) => `${value.toFixed(4)} ETH`}
            stroke="#6b7280"
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Volume bars */}
          <Bar
            dataKey="volume"
            yAxisId="volume"
            fill="#3b82f6"
            opacity={0.3}
            barSize={20}
          />

          {/* Candlestick components */}
          <Line
            type="step"
            dataKey="high"
            stroke="#22c55e"
            dot={false}
            yAxisId="price"
          />
          <Line
            type="step"
            dataKey="low"
            stroke="#ef4444"
            dot={false}
            yAxisId="price"
          />
          <Line
            type="step"
            dataKey="open"
            stroke="#10b981"
            dot={false}
            yAxisId="price"
          />
          <Line
            type="step"
            dataKey="close"
            stroke="#3b82f6"
            dot={false}
            yAxisId="price"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TokenPriceChart;
