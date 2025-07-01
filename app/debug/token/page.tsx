// app/debug/token/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Coins,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  DollarSign,
  Clock,
  Zap,
} from "lucide-react";
import { isAddress } from "viem";

// Import token-related hooks
import { useUnifiedTokenPrice } from "@/hooks/token/useUnifiedTokenPrice";
import {
  useRealtimeTokenPrice,
  useRealtimeTokenPrices,
} from "@/hooks/token/useRealtimeTokenPrices";
import { useTokenStats } from "@/hooks/token/useTokenStats";
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import {
  formatTokenPrice,
  formatChartPrice,
  priceToNumber,
} from "@/utils/tokenPriceFormatter";

export default function DebugTokenPage() {
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const testToken = searchParams.get("token") || "";
  const isValidToken = testToken && isAddress(testToken);

  useEffect(() => {
    setMounted(true);
  }, []);

  const forceRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Coins className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading token debugger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Coins className="h-8 w-8 text-purple-500" />
            Token Hooks Debug
          </h1>
          <p className="text-muted-foreground mt-2">
            Test token-specific hooks, price formatters, stats, and utilities
          </p>
        </div>

        <Button onClick={forceRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Force Refresh
        </Button>
      </div>

      {/* Token Status */}
      <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Test Token:</span>
              {isValidToken ? (
                <>
                  <Badge variant="default" className="font-mono">
                    {testToken.slice(0, 8)}...{testToken.slice(-8)}
                  </Badge>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </>
              ) : (
                <>
                  <Badge variant="destructive">No valid token</Badge>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Refresh Key: #{refreshKey}
            </div>
          </div>

          {!isValidToken && (
            <p className="text-sm text-muted-foreground mt-2">
              💡 Add a valid token address to test all token-specific hooks and
              utilities
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="price-hooks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="price-hooks">Price Hooks</TabsTrigger>
          <TabsTrigger value="stats-trades">Stats & Trades</TabsTrigger>
          <TabsTrigger value="formatters">Formatters</TabsTrigger>
          <TabsTrigger value="comparisons">Hook Comparison</TabsTrigger>
        </TabsList>

        {/* Price Hooks Tab */}
        <TabsContent value="price-hooks">
          <div className="grid gap-6">
            <PriceHooksDebug token={testToken} refreshKey={refreshKey} />
          </div>
        </TabsContent>

        {/* Stats & Trades Tab */}
        <TabsContent value="stats-trades">
          <div className="grid gap-6">
            <StatsTradesDebug token={testToken} refreshKey={refreshKey} />
          </div>
        </TabsContent>

        {/* Formatters Tab */}
        <TabsContent value="formatters">
          <FormattersDebug refreshKey={refreshKey} />
        </TabsContent>

        {/* Hook Comparison Tab */}
        <TabsContent value="comparisons">
          <HookComparisonDebug token={testToken} refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Price Hooks Debug Component
function PriceHooksDebug({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const tokenAddress =
    token && isAddress(token) ? (token as `0x${string}`) : undefined;

  // Test both unified and realtime price hooks
  const unifiedPrice = useUnifiedTokenPrice(tokenAddress);
  const {
    price: realtimePrice,
    isLoading: realtimeLoading,
    error: realtimeError,
    refreshPrice,
  } = useRealtimeTokenPrice(tokenAddress);

  // Test the multi-token hook with single token
  const {
    prices,
    getPrice,
    refreshPrices,
    isLoading: multiLoading,
    error: multiError,
  } = useRealtimeTokenPrices(tokenAddress ? [tokenAddress] : []);

  const multiPrice = tokenAddress ? getPrice(tokenAddress) : null;

  return (
    <div className="grid gap-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Price Hooks Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Token Required</span>
              <div className="font-mono">
                {token ? "✅ Provided" : "❌ Missing"}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Unified Loading</span>
              <div className="font-mono">
                {unifiedPrice.isLoading.toString()}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Realtime Loading</span>
              <div className="font-mono">{realtimeLoading.toString()}</div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Refresh #</span>
              <div className="font-mono">{refreshKey}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Hook Results */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Unified Price Hook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-blue-500" />
              useUnifiedTokenPrice
              <Badge
                variant={
                  unifiedPrice.error
                    ? "destructive"
                    : unifiedPrice.isLoading
                    ? "secondary"
                    : "default"
                }
              >
                {unifiedPrice.error
                  ? "Error"
                  : unifiedPrice.isLoading
                  ? "Loading"
                  : "Success"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loading:</span>
                <span className="font-mono">
                  {unifiedPrice.isLoading.toString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="font-mono text-red-500 text-xs">
                  {unifiedPrice.error || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw Price:</span>
                <span className="font-mono text-xs">{unifiedPrice.raw}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formatted:</span>
                <span className="font-mono font-bold">
                  {unifiedPrice.formatted}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wei Value:</span>
                <span className="font-mono text-xs">
                  {unifiedPrice.wei?.toString() || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-mono text-xs">
                  {new Date(unifiedPrice.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Realtime Price Hook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-yellow-500" />
              useRealtimeTokenPrice
              <Badge
                variant={
                  realtimeError
                    ? "destructive"
                    : realtimeLoading
                    ? "secondary"
                    : "default"
                }
              >
                {realtimeError
                  ? "Error"
                  : realtimeLoading
                  ? "Loading"
                  : "Success"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loading:</span>
                <span className="font-mono">{realtimeLoading.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="font-mono text-red-500 text-xs">
                  {realtimeError || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw Price:</span>
                <span className="font-mono text-xs">{realtimePrice.raw}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formatted:</span>
                <span className="font-mono font-bold">
                  {realtimePrice.formatted}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-mono text-xs">
                  {new Date(realtimePrice.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <Button
              onClick={refreshPrice}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Manual Refresh
            </Button>
          </CardContent>
        </Card>

        {/* Multi-token Price Hook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              useRealtimeTokenPrices
              <Badge
                variant={
                  multiError
                    ? "destructive"
                    : multiLoading
                    ? "secondary"
                    : "default"
                }
              >
                {multiError ? "Error" : multiLoading ? "Loading" : "Success"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loading:</span>
                <span className="font-mono">{multiLoading.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="font-mono text-red-500 text-xs">
                  {multiError || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tokens Count:</span>
                <span className="font-mono">{Object.keys(prices).length}</span>
              </div>
              {multiPrice && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Raw Price:</span>
                    <span className="font-mono text-xs">{multiPrice.raw}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Formatted:</span>
                    <span className="font-mono font-bold">
                      {multiPrice.formatted}
                    </span>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={refreshPrices}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Price Comparison */}
      {tokenAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Price Comparison Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-muted p-3 rounded">
                <h5 className="font-medium mb-2">Unified Hook:</h5>
                <div>Raw: {unifiedPrice.raw}</div>
                <div>Formatted: {unifiedPrice.formatted}</div>
              </div>
              <div className="bg-muted p-3 rounded">
                <h5 className="font-medium mb-2">Realtime Hook:</h5>
                <div>Raw: {realtimePrice.raw}</div>
                <div>Formatted: {realtimePrice.formatted}</div>
              </div>
              <div className="bg-muted p-3 rounded">
                <h5 className="font-medium mb-2">Multi Hook:</h5>
                <div>Raw: {multiPrice?.raw || "N/A"}</div>
                <div>Formatted: {multiPrice?.formatted || "N/A"}</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
              <h5 className="font-medium mb-2 text-blue-700 dark:text-blue-400">
                Consistency Check:
              </h5>
              <div className="text-xs space-y-1">
                <div>
                  Unified vs Realtime:{" "}
                  {unifiedPrice.raw === realtimePrice.raw
                    ? "✅ Match"
                    : "❌ Different"}
                </div>
                <div>
                  Realtime vs Multi:{" "}
                  {realtimePrice.raw === multiPrice?.raw
                    ? "✅ Match"
                    : "❌ Different"}
                </div>
                <div>
                  All Match:{" "}
                  {unifiedPrice.raw === realtimePrice.raw &&
                  realtimePrice.raw === multiPrice?.raw
                    ? "✅ All Consistent"
                    : "❌ Inconsistent"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Stats & Trades Debug
function StatsTradesDebug({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const stats = useTokenStats({ tokenAddress: token });
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useTokenTrades(token as `0x${string}`);

  return (
    <div className="grid gap-6">
      {/* Token Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            useTokenStats
            <Badge
              variant={
                stats.error
                  ? "destructive"
                  : stats.loading
                  ? "secondary"
                  : "default"
              }
            >
              {stats.error ? "Error" : stats.loading ? "Loading" : "Success"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Loading</span>
              <div className="font-mono">{stats.loading.toString()}</div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Error</span>
              <div className="font-mono text-red-500">
                {stats.error || "None"}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Token State</span>
              <div className="font-mono">{stats.tokenState}</div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Refresh #</span>
              <div className="font-mono">{refreshKey}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded">
              <h5 className="font-medium mb-3">Price & Supply:</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Current Price:</span>
                  <span className="font-mono">{stats.currentPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Supply:</span>
                  <span className="font-mono">{stats.totalSupply}</span>
                </div>
                <div className="flex justify-between">
                  <span>Collateral:</span>
                  <span className="font-mono">{stats.collateral}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded">
              <h5 className="font-medium mb-3">Trading Stats:</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Volume ETH:</span>
                  <span className="font-mono">{stats.volumeETH}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trade Count:</span>
                  <span className="font-mono">{stats.tradeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unique Holders:</span>
                  <span className="font-mono">{stats.uniqueHolders}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Trades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            useTokenTrades
            <Badge
              variant={
                tradesError
                  ? "destructive"
                  : tradesLoading
                  ? "secondary"
                  : "default"
              }
            >
              {tradesError ? "Error" : tradesLoading ? "Loading" : "Success"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Loading</span>
              <div className="font-mono">{tradesLoading.toString()}</div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Error</span>
              <div className="font-mono text-red-500">
                {tradesError || "None"}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Trade Count</span>
              <div className="font-mono">{trades.length}</div>
            </div>
          </div>

          {trades.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-medium">Recent Trades (Latest 3):</h5>
              {trades.slice(0, 3).map((trade, i) => (
                <div key={i} className="border rounded p-3 bg-background">
                  <div className="flex justify-between items-center mb-2">
                    <Badge
                      variant={trade.type === "buy" ? "default" : "secondary"}
                    >
                      {trade.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {trade.timestamp}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Trader: {trade.trader.slice(0, 8)}...</div>
                    <div>Block: {trade.blockNumber}</div>
                    <div>Token Amount: {trade.tokenAmount}</div>
                    <div>ETH Amount: {trade.ethAmount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {trades.length > 0 && (
            <div className="bg-muted p-3 rounded">
              <h5 className="font-medium mb-2">
                Trade Data Structure (First Trade):
              </h5>
              <pre className="text-xs overflow-auto bg-background p-2 rounded border">
                {JSON.stringify(trades[0], null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Formatters Debug
function FormattersDebug({ refreshKey }: { refreshKey: number }) {
  const [testPrice, setTestPrice] = useState("0.000123456789");

  const testPrices = [
    "0",
    "0.000001",
    "0.001",
    "0.123456789",
    "1.23456",
    "1234.5678",
    "0.000000000001",
    "123456789.123456789",
  ];

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Price Formatting Utilities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interactive Testing */}
          <div className="space-y-3">
            <h4 className="font-medium">Interactive Testing:</h4>
            <div className="flex gap-2">
              <Input
                value={testPrice}
                onChange={(e) => setTestPrice(e.target.value)}
                placeholder="Enter price value"
                className="flex-1 font-mono"
              />
              <Button
                onClick={() => setTestPrice((Math.random() * 1000).toString())}
                variant="outline"
              >
                Random
              </Button>
            </div>

            <div className="bg-muted p-4 rounded grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">
                  formatTokenPrice():
                </span>
                <div className="font-mono font-bold">
                  {formatTokenPrice(testPrice)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">
                  formatChartPrice():
                </span>
                <div className="font-mono font-bold">
                  {formatChartPrice(Number(testPrice))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">priceToNumber():</span>
                <div className="font-mono font-bold">
                  {priceToNumber(BigInt(Math.floor(Number(testPrice) * 1e18)))}
                </div>
              </div>
            </div>
          </div>

          {/* Predefined Tests */}
          <div className="space-y-3">
            <h4 className="font-medium">Predefined Tests:</h4>
            <div className="space-y-2">
              {testPrices.map((price, i) => (
                <div key={i} className="border rounded p-3">
                  <div className="font-medium mb-2">Input: {price}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">
                        formatTokenPrice:
                      </span>
                      <div className="font-mono">{formatTokenPrice(price)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        formatChartPrice:
                      </span>
                      <div className="font-mono">
                        {formatChartPrice(Number(price))}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Scientific:
                      </span>
                      <div className="font-mono">
                        {Number(price).toExponential(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook Comparison Debug
function HookComparisonDebug({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const tokenAddress =
    token && isAddress(token) ? (token as `0x${string}`) : undefined;

  // Get data from all price hooks
  const unifiedPrice = useUnifiedTokenPrice(tokenAddress);
  const { price: realtimePrice } = useRealtimeTokenPrice(tokenAddress);
  const stats = useTokenStats({ tokenAddress: token });

  const comparisonData = [
    {
      hook: "useUnifiedTokenPrice",
      raw: unifiedPrice.raw,
      formatted: unifiedPrice.formatted,
      loading: unifiedPrice.isLoading,
      error: unifiedPrice.error,
      source: "lastPrice contract call",
    },
    {
      hook: "useRealtimeTokenPrice",
      raw: realtimePrice.raw,
      formatted: realtimePrice.formatted,
      loading: false,
      error: null,
      source: "lastPrice with events",
    },
    {
      hook: "useTokenStats",
      raw: stats.currentPrice,
      formatted: formatTokenPrice(stats.currentPrice),
      loading: stats.loading,
      error: stats.error,
      source: "Mixed contract + Firestore",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          Cross-Hook Price Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!tokenAddress && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Valid token address required for comparison</p>
          </div>
        )}

        {tokenAddress && (
          <>
            <div className="grid gap-4">
              {comparisonData.map((item, i) => (
                <div key={i} className="border rounded p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium">{item.hook}</h5>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.source}
                      </Badge>
                      <Badge
                        variant={
                          item.error
                            ? "destructive"
                            : item.loading
                            ? "secondary"
                            : "default"
                        }
                      >
                        {item.error
                          ? "Error"
                          : item.loading
                          ? "Loading"
                          : "Success"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Raw Value:</span>
                      <div className="font-mono">{item.raw}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Formatted:</span>
                      <div className="font-mono font-bold">
                        {item.formatted}
                      </div>
                    </div>
                  </div>

                  {item.error && (
                    <div className="mt-2 text-xs text-red-500">
                      {item.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded">
              <h5 className="font-medium mb-3 text-blue-700 dark:text-blue-400">
                Analysis:
              </h5>
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium">Consistency:</span>
                    <div className="text-xs mt-1">
                      {comparisonData.every(
                        (item) => item.raw === comparisonData[0].raw
                      )
                        ? "✅ All hooks return same raw value"
                        : "❌ Hooks return different values"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Performance:</span>
                    <div className="text-xs mt-1">
                      Loading states:{" "}
                      {comparisonData.filter((item) => item.loading).length}/
                      {comparisonData.length}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Reliability:</span>
                    <div className="text-xs mt-1">
                      Errors:{" "}
                      {comparisonData.filter((item) => item.error).length}/
                      {comparisonData.length}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white dark:bg-background rounded border">
                  <h6 className="font-medium text-xs mb-2">Recommendations:</h6>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>
                      • Use <code>useUnifiedTokenPrice</code> for consistent,
                      single-source pricing
                    </li>
                    <li>
                      • Use <code>useRealtimeTokenPrice</code> for event-driven
                      price updates
                    </li>
                    <li>
                      • Use <code>useTokenStats</code> only when you need
                      additional statistics
                    </li>
                    <li>• Consider consolidating to reduce hook complexity</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Refresh Key Tracking */}
            <div className="bg-muted p-3 rounded">
              <h5 className="font-medium mb-2">Refresh Tracking:</h5>
              <div className="text-sm space-y-1">
                <div>Current refresh cycle: #{refreshKey}</div>
                <div>Timestamp: {new Date().toLocaleTimeString()}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Use the "Force Refresh" button to test how hooks respond to
                  state changes
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
