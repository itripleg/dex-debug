"use client";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { formatUnits, parseUnits } from "viem";
import { Token, Trade } from "@/types";
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import {
  formatTokenPrice,
  formatChartPrice,
  priceToNumber,
} from "@/utils/tokenPriceFormatter";

// This interface defines the shape of the data that our chart will use
interface ChartPoint {
  price: number;
  formattedPrice: string;
  timeLabel: string;
}

// Props for the main component
interface RechartsLineChartProps {
  trades: Trade[];
  loading: boolean;
  token: Token;
}

// A custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg text-white">
        <p className="label text-sm">{`Price: ${payload[0].payload.formattedPrice} AVAX`}</p>
        <p className="intro text-xs text-gray-400">{`On: ${label}`}</p>
      </div>
    );
  }
  return null;
};

// The main chart component
export default function RechartsLineChart({
  trades,
  loading,
  token,
}: RechartsLineChartProps) {
  const { formatValue } = useFactoryContract();

  // useMemo will re-calculate the chart data only when its dependencies change
  const chartData: ChartPoint[] = useMemo(() => {
    // 1. Create the "Genesis Point" from the token's creation data
    const genesisTimestamp = token.createdAt
      ? parseISO(token.createdAt).getTime()
      : Date.now();
    const genesisPoint = {
      timestamp: genesisTimestamp,
      priceInWei: parseUnits(token.initialPrice, 18),
    };

    // 2. Process the raw trade data from Firestore
    const processedTrades = trades
      .map((trade) => {
        // Safeguard against bad data
        if (
          !trade.tokenAmount ||
          BigInt(trade.tokenAmount) === 0n ||
          !trade.timestamp
        ) {
          return null;
        }

        const tradeTimestamp = parseISO(trade.timestamp).getTime();
        const priceInWei =
          (BigInt(trade.ethAmount) * BigInt(10 ** 18)) /
          BigInt(trade.tokenAmount);

        return {
          timestamp: tradeTimestamp,
          priceInWei,
        };
      })
      .filter(
        (point): point is { timestamp: number; priceInWei: bigint } =>
          point !== null
      );

    // 3. Combine the genesis point with actual trades and sort chronologically
    const allPoints = [...processedTrades, genesisPoint].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    // 4. Format the sorted points into the final shape for the chart
    // NOW USING UNIFIED FORMATTING
    return allPoints.map((point) => ({
      price: priceToNumber(point.priceInWei), // Convert to number for chart calculations
      formattedPrice: formatTokenPrice(formatUnits(point.priceInWei, 18)), // Use unified formatting
      timeLabel: format(point.timestamp, "MMM d, h:mm a"),
    }));
  }, [trades, token]);

  // The price displayed in the header uses the same unified formatting
  const displayPrice =
    chartData.length > 0
      ? chartData[chartData.length - 1].formattedPrice
      : formatTokenPrice(formatUnits(parseUnits(token.initialPrice, 18), 18));

  if (loading) {
    return (
      <div className="text-center text-gray-400 animate-pulse">
        Loading Chart Data...
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">
          {token.symbol} Price History
        </h3>
        <p className="text-2xl text-green-400">{displayPrice} AVAX</p>
      </div>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="80%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey="timeLabel"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              // NOW USING UNIFIED CHART FORMATTING FOR Y-AXIS
              tickFormatter={(value) => formatChartPrice(Number(value))}
              domain={["dataMin", "dataMax"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#4ade80"
              strokeWidth={2}
              dot={chartData.length < 50}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-4/5">
          <p className="text-gray-500">No trade data available.</p>
        </div>
      )}
    </div>
  );
}
