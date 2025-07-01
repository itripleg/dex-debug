// app/debug/contexts/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";
import { isAddress } from "viem";

// Import context hooks
import { useToken, useTokenContext } from "@/contexts/TokenContext";
import { useTrades, useTradesContext } from "@/contexts/TradesContext";
import { useFactoryConfigContext } from "@/contexts/FactoryConfigProvider";

export default function DebugContextsPage() {
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
          <Database className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading context debugger...</p>
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
            <Database className="h-8 w-8 text-blue-500" />
            Context Hooks Debug
          </h1>
          <p className="text-muted-foreground mt-2">
            Test React Context providers and their associated hooks
          </p>
        </div>

        <Button onClick={forceRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Force Refresh
        </Button>
      </div>

      {/* Token Status */}
      <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">
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
              💡 Add a valid token address in the URL (?token=0x...) or use the
              input above to test context hooks
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="token-context" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="token-context">Token Context</TabsTrigger>
          <TabsTrigger value="trades-context">Trades Context</TabsTrigger>
          <TabsTrigger value="factory-config">Factory Config</TabsTrigger>
        </TabsList>

        {/* Token Context Tab */}
        <TabsContent value="token-context">
          <div className="grid gap-6">
            <TokenContextDebug token={testToken} refreshKey={refreshKey} />
            <TokenContextRawDebug token={testToken} refreshKey={refreshKey} />
          </div>
        </TabsContent>

        {/* Trades Context Tab */}
        <TabsContent value="trades-context">
          <div className="grid gap-6">
            <TradesContextDebug token={testToken} refreshKey={refreshKey} />
            <TradesContextRawDebug token={testToken} refreshKey={refreshKey} />
          </div>
        </TabsContent>

        {/* Factory Config Tab */}
        <TabsContent value="factory-config">
          <FactoryConfigDebug refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Token Context Debug Component
function TokenContextDebug({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const { token: tokenData, loading, error } = useToken(token);

  const getStatusBadge = () => {
    if (error) return <Badge variant="destructive">Error</Badge>;
    if (loading) return <Badge variant="secondary">Loading</Badge>;
    if (tokenData) return <Badge variant="default">Success</Badge>;
    return <Badge variant="outline">No Data</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          useToken Hook
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Loading</span>
            <div className="font-mono">{loading.toString()}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Error</span>
            <div className="font-mono text-red-500">{error || "None"}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Has Token</span>
            <div className="font-mono">{tokenData ? "✅ Yes" : "❌ No"}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Refresh #</span>
            <div className="font-mono">{refreshKey}</div>
          </div>
        </div>

        {/* Token Data Display */}
        {tokenData && (
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-sm">Token Data:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <div className="font-medium">{tokenData.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Symbol:</span>
                <div className="font-medium">{tokenData.symbol}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Creator:</span>
                <div className="font-mono text-xs">{tokenData.creator}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Funding Goal:</span>
                <div className="font-medium">{tokenData.fundingGoal} AVAX</div>
              </div>
              <div>
                <span className="text-muted-foreground">State:</span>
                <div className="font-medium">{tokenData.state}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Image Position:</span>
                <div className="font-medium">
                  {tokenData.imagePosition ? "✅ Yes" : "❌ No"}
                </div>
              </div>
            </div>

            {tokenData.imagePosition && (
              <div className="mt-3 p-3 bg-background rounded border">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">
                  Image Position:
                </h5>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>X: {tokenData.imagePosition.x}</div>
                  <div>Y: {tokenData.imagePosition.y}</div>
                  <div>Scale: {tokenData.imagePosition.scale}</div>
                  <div>Rotation: {tokenData.imagePosition.rotation}°</div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-sm text-red-700 dark:text-red-400 mb-2">
              Error Details:
            </h4>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Token Context Raw Debug
function TokenContextRawDebug({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const context = useTokenContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-500" />
          useTokenContext (Raw)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm">
            <span className="font-medium">Context Functions Available:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.keys(context).map((key) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Cached Tokens:</h4>
            <div className="text-xs font-mono">
              {Object.keys(context.tokens).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(context.tokens).map(([addr, tokenData]) => (
                    <div key={addr} className="flex justify-between">
                      <span>{addr.slice(0, 8)}...</span>
                      <span>{tokenData ? "✅" : "❌"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">No tokens cached</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Trades Context Debug
function TradesContextDebug({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const { trades, loading, error } = useTrades(token);

  const getStatusBadge = () => {
    if (error) return <Badge variant="destructive">Error</Badge>;
    if (loading) return <Badge variant="secondary">Loading</Badge>;
    if (trades.length > 0) return <Badge variant="default">Success</Badge>;
    return <Badge variant="outline">No Data</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          useTrades Hook
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Loading</span>
            <div className="font-mono">{loading.toString()}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Error</span>
            <div className="font-mono text-red-500">{error || "None"}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Trade Count</span>
            <div className="font-mono">{trades.length}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Refresh #</span>
            <div className="font-mono">{refreshKey}</div>
          </div>
        </div>

        {/* Recent Trades */}
        {trades.length > 0 && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">
              Recent Trades (Latest 3):
            </h4>
            <div className="space-y-2">
              {trades.slice(0, 3).map((trade, i) => (
                <div
                  key={i}
                  className="text-sm border rounded p-2 bg-background"
                >
                  <div className="flex justify-between items-center mb-1">
                    <Badge
                      variant={trade.type === "buy" ? "default" : "secondary"}
                    >
                      {trade.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {trade.timestamp}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Trader: {trade.trader.slice(0, 8)}...</div>
                    <div>Block: {trade.blockNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-sm text-red-700 dark:text-red-400 mb-2">
              Error Details:
            </h4>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Trades Context Raw Debug
function TradesContextRawDebug({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const context = useTradesContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          useTradesContext (Raw)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm">
            <span className="font-medium">Context Functions Available:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.keys(context).map((key) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">
              Cached Trades by Token:
            </h4>
            <div className="text-xs font-mono">
              {Object.keys(context.trades).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(context.trades).map(([addr, tradesData]) => (
                    <div key={addr} className="flex justify-between">
                      <span>{addr.slice(0, 8)}...</span>
                      <span>
                        {tradesData
                          ? `${tradesData.length} trades`
                          : "❌ No data"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">No trades cached</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Factory Config Debug
function FactoryConfigDebug({ refreshKey }: { refreshKey: number }) {
  const { config, isLoading } = useFactoryConfigContext();

  const getStatusBadge = () => {
    if (isLoading) return <Badge variant="secondary">Loading</Badge>;
    if (config) return <Badge variant="default">Loaded</Badge>;
    return <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          Factory Config Context
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Loading</span>
            <div className="font-mono">{isLoading.toString()}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Has Config</span>
            <div className="font-mono">{config ? "✅ Yes" : "❌ No"}</div>
          </div>
        </div>

        {config && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">
              Factory Configuration:
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Decimals:</span>
                <div className="font-mono">{config.decimals}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Initial Price:</span>
                <div className="font-mono">{config.initialPrice}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Max Supply:</span>
                <div className="font-mono">{config.maxSupply}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Trading Fee:</span>
                <div className="font-mono">{config.tradingFee}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Max Wallet %:</span>
                <div className="font-mono">{config.maxWalletPercentage}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Price Rate:</span>
                <div className="font-mono">{config.priceRate}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
