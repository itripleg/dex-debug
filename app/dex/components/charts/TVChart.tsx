import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  CandlestickData,
  UTCTimestamp,
  PriceFormat,
} from "lightweight-charts";

interface TVChartProps {
  trades: Array<{
    pricePerToken: string;
    timestamp: string;
    type: string;
    ethAmount?: string;
    tokenAmount?: string;
  }>;
  currentPrice?: string;
  isDarkMode?: boolean;
}

export function TVChart({
  trades,
  currentPrice,
  isDarkMode = true,
}: TVChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { color: isDarkMode ? "#1a1b1e" : "#ffffff" },
        textColor: isDarkMode ? "#d1d5db" : "#374151",
      },
      grid: {
        vertLines: { color: isDarkMode ? "#2f3336" : "#e5e7eb" },
        horzLines: { color: isDarkMode ? "#2f3336" : "#e5e7eb" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: isDarkMode ? "#2f3336" : "#e5e7eb",
      },
      rightPriceScale: {
        borderColor: isDarkMode ? "#2f3336" : "#e5e7eb",
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
      },
      crosshair: {
        vertLine: {
          color: isDarkMode ? "#6b7280" : "#9ca3af",
          width: 1,
          style: 1,
        },
        horzLine: {
          color: isDarkMode ? "#6b7280" : "#9ca3af",
          width: 1,
          style: 1,
        },
      },
    };
    // @ts-expect-error chart options
    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      priceFormat: {
        type: "price",
        precision: 12,
        minMove: 0.000000000001,
      } as PriceFormat,
    });

    // Group trades into candles
    const candles: Record<number, CandlestickData<UTCTimestamp>> = {};
    const MINUTES_PER_CANDLE = 15;
    const MS_PER_CANDLE = MINUTES_PER_CANDLE * 60 * 1000;

    trades.forEach((trade) => {
      const timestamp = new Date(trade.timestamp).getTime();
      const candleTime =
        (Math.floor(timestamp / MS_PER_CANDLE) * MS_PER_CANDLE) / 1000;

      // Calculate price per token from ethAmount and tokenAmount if available
      let price;
      if (trade.ethAmount && trade.tokenAmount) {
        const ethAmount = Number(trade.ethAmount);
        const tokenAmount = Number(trade.tokenAmount);
        price = ethAmount / tokenAmount;
      } else {
        price = Number(trade.pricePerToken);
      }

      if (!candles[candleTime]) {
        candles[candleTime] = {
          time: candleTime as UTCTimestamp,
          open: price,
          high: price,
          low: price,
          close: price,
        };
      } else {
        const candle = candles[candleTime];
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price;
      }
    });

    // Add current price if available
    if (currentPrice && currentPrice !== "0") {
      const currentPriceNum = Number(currentPrice);
      const now =
        (Math.floor(Date.now() / MS_PER_CANDLE) * MS_PER_CANDLE) / 1000;

      if (candles[now]) {
        candles[now].close = currentPriceNum;
        candles[now].high = Math.max(candles[now].high, currentPriceNum);
        candles[now].low = Math.min(candles[now].low, currentPriceNum);
      } else {
        candles[now] = {
          time: now as UTCTimestamp,
          open: currentPriceNum,
          high: currentPriceNum,
          low: currentPriceNum,
          close: currentPriceNum,
        };
      }
    }

    // Set chart data
    const candleData = Object.values(candles).sort(
      (a, b) => (a.time as number) - (b.time as number)
    );

    if (candleData.length > 0) {
      candlestickSeries.setData(candleData);
      chart.timeScale().fitContent();
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 400,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [trades, currentPrice, isDarkMode]);

  return (
    <div className="w-full h-[400px] relative">
      <div ref={chartContainerRef} className="absolute inset-0" />
    </div>
  );
}
