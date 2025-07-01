// app/debug/factory/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Factory,
  Coins,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  DollarSign,
} from "lucide-react";
import { isAddress } from "viem";

// Import factory contract hooks
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

export default function DebugFactoryPage() {
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
          <Factory className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading factory debugger...</p>
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
            <Factory className="h-8 w-8 text-green-500" />
            Factory Contract Debug
          </h1>
          <p className="text-muted-foreground mt-2">
            Test factory contract reads, writes, and formatting utilities
          </p>
        </div>

        <Button onClick={forceRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Force Refresh
        </Button>
      </div>

      {/* Contract Info */}
      <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/20">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Factory Address:</span>
                <Badge variant="outline" className="font-mono">
                  {FACTORY_ADDRESS}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Refresh Key: #{refreshKey}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Test Token:</span>
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
            </div>

            {!isValidToken && (
              <p className="text-sm text-muted-foreground">
                💡 Add a valid token address to test token-specific contract
                reads
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contract-reads" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contract-reads">Contract Reads</TabsTrigger>
          <TabsTrigger value="formatting">Formatting Utils</TabsTrigger>
          <TabsTrigger value="abi-analysis">ABI Analysis</TabsTrigger>
          <TabsTrigger value="write-functions">Write Functions</TabsTrigger>
        </TabsList>

        {/* Contract Reads Tab */}
        <TabsContent value="contract-reads">
          <div className="grid gap-6">
            <FactoryContractReads token={testToken} refreshKey={refreshKey} />
          </div>
        </TabsContent>

        {/* Formatting Utils Tab */}
        <TabsContent value="formatting">
          <FormattingUtilsDebug refreshKey={refreshKey} />
        </TabsContent>

        {/* ABI Analysis Tab */}
        <TabsContent value="abi-analysis">
          <ABIAnalysisDebug />
        </TabsContent>

        {/* Write Functions Tab */}
        <TabsContent value="write-functions">
          <WriteDebug token={testToken} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Contract Reads Component
function FactoryContractReads({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const { useTokenState, useCollateral, useCurrentPrice, formatValue } =
    useFactoryContract();

  // Only call hooks if we have a valid token
  const tokenAddress =
    token && isAddress(token) ? (token as `0x${string}`) : undefined;

  const {
    data: tokenState,
    isLoading: stateLoading,
    error: stateError,
  } = useTokenState(tokenAddress);
  const {
    data: collateralRaw,
    formatted: collateralFormatted,
    isLoading: collateralLoading,
    error: collateralError,
  } = useCollateral(tokenAddress);
  const {
    data: priceRaw,
    formatted: priceFormatted,
    isLoading: priceLoading,
    error: priceError,
  } = useCurrentPrice(tokenAddress);

  const anyLoading = stateLoading || collateralLoading || priceLoading;
  const anyError = stateError || collateralError || priceError;

  return (
    <div className="grid gap-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            useFactoryContract Hook Overview
            <Badge
              variant={
                anyError ? "destructive" : anyLoading ? "secondary" : "default"
              }
            >
              {anyError ? "Has Errors" : anyLoading ? "Loading" : "Success"}
            </Badge>
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
              <span className="text-muted-foreground">Any Loading</span>
              <div className="font-mono">{anyLoading.toString()}</div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Any Errors</span>
              <div className="font-mono">{anyError ? "Yes" : "No"}</div>
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
        {/* Token State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              useTokenState
              <Badge
                variant={
                  stateError
                    ? "destructive"
                    : stateLoading
                    ? "secondary"
                    : "default"
                }
              >
                {stateError ? "Error" : stateLoading ? "Loading" : "Success"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loading:</span>
                <span className="font-mono">{stateLoading.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="font-mono text-red-500">
                  {stateError?.message || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw Value:</span>
                <span className="font-mono">
                  {tokenState?.toString() || "None"}
                </span>
              </div>
            </div>

            {tokenState !== undefined && (
              <div className="bg-muted p-3 rounded">
                <h5 className="text-xs font-medium mb-2">State Mapping:</h5>
                <div className="text-xs space-y-1">
                  <div>0: NOT_CREATED</div>
                  <div>1: TRADING</div>
                  <div>2: GOAL_REACHED</div>
                  <div>3: HALTED</div>
                  <div className="font-bold text-primary">
                    Current: {tokenState} (
                    {tokenState === 0
                      ? "NOT_CREATED"
                      : tokenState === 1
                      ? "TRADING"
                      : tokenState === 2
                      ? "GOAL_REACHED"
                      : tokenState === 3
                      ? "HALTED"
                      : "UNKNOWN"}
                    )
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Collateral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-green-500" />
              useCollateral
              <Badge
                variant={
                  collateralError
                    ? "destructive"
                    : collateralLoading
                    ? "secondary"
                    : "default"
                }
              >
                {collateralError
                  ? "Error"
                  : collateralLoading
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
                  {collateralLoading.toString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="font-mono text-red-500">
                  {collateralError?.message || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw (Wei):</span>
                <span className="font-mono text-xs">
                  {collateralRaw?.toString() || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formatted:</span>
                <span className="font-mono font-bold">
                  {collateralFormatted}
                </span>
              </div>
            </div>

            {collateralRaw && (
              <div className="bg-muted p-3 rounded">
                <h5 className="text-xs font-medium mb-2">
                  formatValue() Tests:
                </h5>
                <div className="text-xs space-y-1">
                  <div>
                    formatValue(raw, 2): {formatValue(collateralRaw, 2)}
                  </div>
                  <div>
                    formatValue(raw, 4): {formatValue(collateralRaw, 4)}
                  </div>
                  <div>
                    formatValue(raw, 6): {formatValue(collateralRaw, 6)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Price */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-yellow-500" />
              useCurrentPrice
              <Badge
                variant={
                  priceError
                    ? "destructive"
                    : priceLoading
                    ? "secondary"
                    : "default"
                }
              >
                {priceError ? "Error" : priceLoading ? "Loading" : "Success"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loading:</span>
                <span className="font-mono">{priceLoading.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="font-mono text-red-500">
                  {priceError?.message || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw (Wei):</span>
                <span className="font-mono text-xs">
                  {priceRaw?.toString() || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formatted:</span>
                <span className="font-mono font-bold">{priceFormatted}</span>
              </div>
            </div>

            {priceRaw && (
              <div className="bg-muted p-3 rounded">
                <h5 className="text-xs font-medium mb-2">Price Analysis:</h5>
                <div className="text-xs space-y-1">
                  <div>
                    Scientific: {Number(priceFormatted).toExponential(2)}
                  </div>
                  <div>Fixed(8): {Number(priceFormatted).toFixed(8)}</div>
                  <div>
                    In USD (≈$2000): $
                    {(Number(priceFormatted) * 2000).toFixed(4)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Formatting Utils Debug
function FormattingUtilsDebug({ refreshKey }: { refreshKey: number }) {
  const { formatValue } = useFactoryContract();

  const [testValue, setTestValue] = useState("1000000000000000000"); // 1 ETH in wei

  const testValues = [
    { label: "0 Wei", value: "0" },
    { label: "1 Wei", value: "1" },
    { label: "1 ETH", value: "1000000000000000000" },
    { label: "0.001 ETH", value: "1000000000000000" },
    { label: "1000 ETH", value: "1000000000000000000000" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          formatValue() Utility Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Interactive Testing */}
        <div className="space-y-3">
          <h4 className="font-medium">Interactive Testing:</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={testValue}
              onChange={(e) => setTestValue(e.target.value)}
              placeholder="Enter wei value"
              className="flex-1 px-3 py-2 border rounded text-sm font-mono"
            />
            <Button
              onClick={() => setTestValue((Math.random() * 1e18).toString())}
              variant="outline"
              size="sm"
            >
              Random
            </Button>
          </div>

          <div className="bg-muted p-4 rounded grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">
                formatValue(val, 2):
              </span>
              <div className="font-mono font-bold">
                {formatValue(BigInt(testValue || "0"), 2)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">
                formatValue(val, 6):
              </span>
              <div className="font-mono font-bold">
                {formatValue(BigInt(testValue || "0"), 6)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">
                formatValue(val, 10):
              </span>
              <div className="font-mono font-bold">
                {formatValue(BigInt(testValue || "0"), 10)}
              </div>
            </div>
          </div>
        </div>

        {/* Predefined Tests */}
        <div className="space-y-3">
          <h4 className="font-medium">Predefined Value Tests:</h4>
          <div className="space-y-3">
            {testValues.map((test, i) => (
              <div key={i} className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{test.label}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {test.value} wei
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Precision 2:
                    </span>
                    <div className="font-mono">
                      {formatValue(BigInt(test.value), 2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Precision 4:
                    </span>
                    <div className="font-mono">
                      {formatValue(BigInt(test.value), 4)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Precision 6:
                    </span>
                    <div className="font-mono">
                      {formatValue(BigInt(test.value), 6)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Precision 8:
                    </span>
                    <div className="font-mono">
                      {formatValue(BigInt(test.value), 8)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edge Cases */}
        <div className="space-y-3">
          <h4 className="font-medium">Edge Case Tests:</h4>
          <div className="bg-muted p-4 rounded space-y-2 text-sm">
            <div className="flex justify-between">
              <span>formatValue(undefined):</span>
              <span className="font-mono">{formatValue(undefined)}</span>
            </div>
            <div className="flex justify-between">
              <span>formatValue(0n):</span>
              <span className="font-mono">{formatValue(0n)}</span>
            </div>
            <div className="flex justify-between">
              <span>formatValue(1n, 0):</span>
              <span className="font-mono">{formatValue(1n, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>formatValue(BigInt.MAX_SAFE_INTEGER):</span>
              <span className="font-mono text-xs">
                {formatValue(BigInt(Number.MAX_SAFE_INTEGER))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ABI Analysis Debug
function ABIAnalysisDebug() {
  const readFunctions = FACTORY_ABI.filter(
    (item: any) =>
      item.type === "function" &&
      (item.stateMutability === "view" || item.stateMutability === "pure")
  );

  const writeFunctions = FACTORY_ABI.filter(
    (item: any) =>
      item.type === "function" &&
      item.stateMutability !== "view" &&
      item.stateMutability !== "pure"
  );

  const events = FACTORY_ABI.filter((item: any) => item.type === "event");

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Factory ABI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Read Functions ({readFunctions.length})
              </h4>
              <div className="space-y-1 text-sm">
                {readFunctions.map((func: any, i: number) => (
                  <div
                    key={i}
                    className="font-mono text-xs p-2 bg-muted rounded"
                  >
                    {func.name}(
                    {func.inputs?.map((input: any) => input.type).join(", ")})
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Factory className="h-4 w-4 text-green-500" />
                Write Functions ({writeFunctions.length})
              </h4>
              <div className="space-y-1 text-sm">
                {writeFunctions.map((func: any, i: number) => (
                  <div
                    key={i}
                    className="font-mono text-xs p-2 bg-muted rounded"
                  >
                    {func.name}(
                    {func.inputs?.map((input: any) => input.type).join(", ")})
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-purple-500" />
                Events ({events.length})
              </h4>
              <div className="space-y-1 text-sm">
                {events.map((event: any, i: number) => (
                  <div
                    key={i}
                    className="font-mono text-xs p-2 bg-muted rounded"
                  >
                    {event.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Write Functions Debug (placeholder)
function WriteDebug({ token }: { token: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="h-5 w-5 text-red-500" />
          Write Functions (Coming Soon)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>
            Write function testing will be implemented in the next iteration.
          </p>
          <p className="text-sm mt-2">
            This will include createToken, buy, sell, and other state-changing
            functions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
