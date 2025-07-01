import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { format } from "date-fns";

interface SimplePriceChartProps {
  trades: Array<{
    pricePerToken: string;
    timestamp: string;
    type: string;
  }>;
  currentPrice?: string;
}

export function SimplePriceChart({
  trades,
  currentPrice,
}: SimplePriceChartProps) {
  const chartData = useMemo(() => {
    // Convert trades to chart points
    const points = trades.map((trade) => ({
      time: new Date(trade.timestamp).getTime(),
      price: Number(trade.pricePerToken),
    }));

    // Add current price if it exists and is different from last trade
    if (currentPrice && currentPrice !== "0") {
      const currentPriceNum = Number(currentPrice);
      const lastPoint = points[points.length - 1];

      if (!lastPoint || Math.abs(currentPriceNum - lastPoint.price) > 1e-12) {
        points.push({
          time: Date.now(),
          price: currentPriceNum,
        });
      }
    }

    return points.sort((a, b) => a.time - b.time);
  }, [trades, currentPrice]);

  if (chartData.length === 0) {
    return <div>No price data available</div>;
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <XAxis
            dataKey="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(time) => format(time, "HH:mm")}
            stroke="#888888"
          />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value) => value.toFixed(12)}
            stroke="#888888"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded-lg p-2 shadow-lg">
                    <p>{format(payload[0].payload.time, "HH:mm:ss")}</p>
                    {/* <p>Price: {payload[0]?.value?.toFixed(12)} ETH</p> */}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#22c55e"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
