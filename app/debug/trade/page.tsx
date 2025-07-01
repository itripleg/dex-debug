// app/debug/trade/page.tsx

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  DollarSign,
  Zap,
  BarChart3,
  ArrowRightLeft,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { isAddress, parseEther, formatEther, Address } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

// Import hooks and utilities
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { useToken } from "@/contexts/TokenContext";
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import { FACTORY_ADDRESS, FACTORY_ABI, TOKEN_ABI } from "@/types";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { useToast } from "@/hooks/use-toast";
import RechartsLineChart from "@/app/dex/components/charts/RechartsLineChart";

export default function DebugTradePage() {
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const testToken = searchParams.get("token") || "";
  const isValidToken = testToken && isAddress(testToken);
  const { address: userAddress, isConnected } = useAccount();
  const { toast } = useToast();

  // Token data
  const {
    token: tokenData,
    loading: tokenLoading,
    error: tokenError,
  } = useToken(testToken);
  const tokenExists = !!(isValidToken && tokenData && !tokenError);

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
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading trade debugger...</p>
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
            <Calculator className="h-8 w-8 text-green-500" />
            Trade Debug & Testing
          </h1>
          <p className="text-muted-foreground mt-2">
            Test trade calculations, simulate transactions, and verify price
            accuracy
          </p>
        </div>

        <Button onClick={forceRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Force Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <TradeStatusCard
        tokenAddress={testToken}
        tokenData={tokenData}
        userAddress={userAddress}
        isConnected={isConnected}
        tokenExists={tokenExists}
        refreshKey={refreshKey}
      />

      <Tabs defaultValue="calculations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculations">Price Calculations</TabsTrigger>
          <TabsTrigger value="real-trade">Real Trading</TabsTrigger>
          <TabsTrigger value="chart-data">Chart Verification</TabsTrigger>
        </TabsList>

        {/* Price Calculations Tab */}
        <TabsContent value="calculations">
          <div className="grid gap-6">
            <PriceCalculationsDebug
              token={testToken}
              tokenExists={tokenExists}
              refreshKey={refreshKey}
            />
          </div>
        </TabsContent>

        {/* Real Trading Tab */}
        <TabsContent value="real-trade">
          <LiveTrading
            token={testToken}
            tokenExists={tokenExists}
            userAddress={userAddress}
            isConnected={isConnected}
            refreshKey={refreshKey}
          />
        </TabsContent>

        {/* Chart Data Test Tab */}
        <TabsContent value="chart-data">
          <ChartVerification
            token={tokenData}
            tokenExists={tokenExists}
            refreshKey={refreshKey}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Status Card Component
function TradeStatusCard({
  tokenAddress,
  tokenData,
  userAddress,
  isConnected,
  tokenExists,
  refreshKey,
}: {
  tokenAddress: string;
  tokenData: any;
  userAddress?: string;
  isConnected: boolean;
  tokenExists: boolean;
  refreshKey: number;
}) {
  return (
    <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/20">
      <CardContent className="p-4 space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Wallet</span>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-mono text-xs">
                    {userAddress?.slice(0, 6)}...
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>Not connected</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">Token</span>
            <div className="flex items-center gap-2">
              {tokenExists ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-mono text-xs">
                    {tokenAddress.slice(0, 6)}...
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>Invalid/Missing</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">Token State</span>
            <div className="font-mono text-xs">
              {tokenData?.state ?? "Unknown"}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">Refresh #</span>
            <div className="font-mono">{refreshKey}</div>
          </div>
        </div>

        {/* Token Details */}
        {tokenExists && tokenData && (
          <div className="grid md:grid-cols-3 gap-4 p-4 bg-background rounded-lg border">
            <div>
              <h4 className="font-medium text-sm mb-2">Token Info</h4>
              <div className="text-xs space-y-1">
                <div>Name: {tokenData.name}</div>
                <div>Symbol: {tokenData.symbol}</div>
                <div>Creator: {tokenData.creator?.slice(0, 8)}...</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Economics</h4>
              <div className="text-xs space-y-1">
                <div>Funding Goal: {tokenData.fundingGoal} AVAX</div>
                <div>Collateral: {tokenData.collateral} AVAX</div>
                <div>Virtual Supply: {tokenData.virtualSupply}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Trading</h4>
              <div className="text-xs space-y-1">
                <div>
                  Current Price:{" "}
                  {formatTokenPrice(tokenData.currentPrice || "0")}
                </div>
                <div>Total Supply: {tokenData.totalSupply}</div>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() =>
                      window.open(`/dex/${tokenAddress}`, "_blank")
                    }
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open Token Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {!isConnected && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Connect wallet to test real trading functionality</span>
            </div>
          </div>
        )}

        {!tokenExists && (
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Valid token address required for trade testing</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Price Calculations Debug
function PriceCalculationsDebug({
  token,
  tokenExists,
  refreshKey,
}: {
  token: string;
  tokenExists: boolean;
  refreshKey: number;
}) {
  const [buyAmount, setBuyAmount] = useState("1.0");
  const [sellAmount, setSellAmount] = useState("1000");
  const { useCurrentPrice, useCollateral } = useFactoryContract();

  // Contract reads
  const tokenAddress = token as `0x${string}`;
  const { data: currentPrice } = useCurrentPrice(tokenAddress);
  const { data: collateral } = useCollateral(tokenAddress);

  // Calculate buy price
  const { data: buyPriceData } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateBuyPrice",
    args:
      tokenAddress && buyAmount
        ? [tokenAddress, parseEther(buyAmount)] // CORRECTED
        : undefined,
    query: {
      enabled: Boolean(tokenAddress && buyAmount),
      refetchInterval: 10000,
    },
  });

  // Calculate tokens for ETH
  const { data: tokensForEthData } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateTokenAmount",
    args:
      tokenAddress && buyAmount
        ? [tokenAddress, parseEther(buyAmount)]
        : undefined,
    query: {
      enabled: Boolean(tokenAddress && buyAmount),
      refetchInterval: 10000,
    },
  });

  // Calculate sell price
  const { data: sellPriceData } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateSellPrice",
    args:
      tokenAddress && sellAmount
        ? [tokenAddress, parseEther(sellAmount)]
        : undefined,
    query: {
      enabled: Boolean(tokenAddress && sellAmount),
      refetchInterval: 10000,
    },
  });

  if (!tokenExists) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Token Required</h3>
          <p className="text-muted-foreground">
            Enter a valid token address to test price calculations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Current State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Current Token State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded">
              <h5 className="font-medium mb-2">Current Price</h5>
              <div className="font-mono text-lg">
                {typeof currentPrice === "bigint" // CORRECTED
                  ? formatTokenPrice(formatEther(currentPrice))
                  : "Loading..."}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                From lastPrice mapping
              </div>
            </div>
            <div className="bg-muted p-4 rounded">
              <h5 className="font-medium mb-2">Collateral</h5>
              <div className="font-mono text-lg">
                {typeof collateral === "bigint" // CORRECTED
                  ? formatEther(collateral)
                  : "Loading..."}{" "}
                AVAX
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total ETH backing tokens
              </div>
            </div>
            <div className="bg-muted p-4 rounded">
              <h5 className="font-medium mb-2">Price Source</h5>
              <div className="text-sm">Factory Contract</div>
              <div className="text-xs text-muted-foreground mt-1">
                Real-time from blockchain
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buy Calculations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Buy Price Calculations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="buyAmount">AVAX Amount to Spend</Label>
                <Input
                  id="buyAmount"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="1.0"
                  type="number"
                  step="0.001"
                />
              </div>

              <div className="bg-muted p-4 rounded space-y-3">
                <h5 className="font-medium">You will receive:</h5>
                <div className="text-2xl font-mono">
                  {typeof tokensForEthData === "bigint" // CORRECTED
                    ? formatEther(tokensForEthData)
                    : "Calculating..."}{" "}
                  tokens
                </div>
                <div className="text-sm text-muted-foreground">
                  From calculateTokenAmount()
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-medium">Calculation Breakdown:</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>AVAX Input:</span>
                  <span className="font-mono">{buyAmount} AVAX</span>
                </div>
                <div className="flex justify-between">
                  <span>Trading Fee (0.3%):</span>
                  <span className="font-mono">
                    {(Number(buyAmount) * 0.003).toFixed(6)} AVAX
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Amount for tokens:</span>
                  <span className="font-mono">
                    {(Number(buyAmount) * 0.997).toFixed(6)} AVAX
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Tokens received:</span>
                  <span className="font-mono">
                    {typeof tokensForEthData === "bigint" // CORRECTED
                      ? Number(formatEther(tokensForEthData)).toFixed(2)
                      : "..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Effective price per token:</span>
                  <span className="font-mono">
                    {typeof tokensForEthData === "bigint" && // CORRECTED
                    Number(formatEther(tokensForEthData)) > 0
                      ? formatTokenPrice(
                          (
                            Number(buyAmount) /
                            Number(formatEther(tokensForEthData))
                          ).toString()
                        )
                      : "..."}{" "}
                    AVAX
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sell Calculations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-red-500" />
            Sell Price Calculations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sellAmount">Token Amount to Sell</Label>
                <Input
                  id="sellAmount"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="1000"
                  type="number"
                  step="1"
                />
              </div>

              <div className="bg-muted p-4 rounded space-y-3">
                <h5 className="font-medium">You will receive:</h5>
                <div className="text-2xl font-mono">
                  {typeof sellPriceData === "bigint" // CORRECTED
                    ? Number(formatEther(sellPriceData)).toFixed(6)
                    : "Calculating..."}{" "}
                  AVAX
                </div>
                <div className="text-sm text-muted-foreground">
                  From calculateSellPrice() (after fees)
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-medium">Calculation Breakdown:</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tokens to sell:</span>
                  <span className="font-mono">{sellAmount} tokens</span>
                </div>
                {typeof sellPriceData === "bigint" && ( // CORRECTED
                  <>
                    <div className="flex justify-between">
                      <span>Gross AVAX value:</span>
                      <span className="font-mono">
                        {(Number(formatEther(sellPriceData)) / 0.997).toFixed(
                          6
                        )}{" "}
                        AVAX
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trading Fee (0.3%):</span>
                      <span className="font-mono">
                        {(
                          (Number(formatEther(sellPriceData)) / 0.997) *
                          0.003
                        ).toFixed(6)}{" "}
                        AVAX
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Net AVAX received:</span>
                      <span className="font-mono">
                        {Number(formatEther(sellPriceData)).toFixed(6)} AVAX
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective price per token:</span>
                      <span className="font-mono">
                        {formatTokenPrice(
                          (
                            Number(formatEther(sellPriceData)) /
                            Number(sellAmount)
                          ).toString()
                        )}{" "}
                        AVAX
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Price Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded border border-green-200 dark:border-green-800">
              <h5 className="font-medium text-green-700 dark:text-green-400 mb-3">
                Buy Impact
              </h5>
              {typeof tokensForEthData === "bigint" && // CORRECTED
                typeof currentPrice === "bigint" && ( // CORRECTED
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Current price:</span>
                      <span className="font-mono">
                        {formatTokenPrice(formatEther(currentPrice))} AVAX
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective buy price:</span>
                      <span className="font-mono">
                        {formatTokenPrice(
                          (
                            Number(buyAmount) /
                            Number(formatEther(tokensForEthData))
                          ).toString()
                        )}{" "}
                        AVAX
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price impact:</span>
                      <span className="font-mono">
                        {(
                          ((Number(buyAmount) /
                            Number(formatEther(tokensForEthData)) -
                            Number(formatEther(currentPrice))) /
                            Number(formatEther(currentPrice))) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                )}
            </div>

            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded border border-red-200 dark:border-red-800">
              <h5 className="font-medium text-red-700 dark:text-red-400 mb-3">
                Sell Impact
              </h5>
              {typeof sellPriceData === "bigint" && // CORRECTED
                typeof currentPrice === "bigint" && ( // CORRECTED
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Current price:</span>
                      <span className="font-mono">
                        {formatTokenPrice(formatEther(currentPrice))} AVAX
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective sell price:</span>
                      <span className="font-mono">
                        {formatTokenPrice(
                          (
                            Number(formatEther(sellPriceData)) /
                            Number(sellAmount)
                          ).toString()
                        )}{" "}
                        AVAX
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price impact:</span>
                      <span className="font-mono">
                        {(
                          ((Number(formatEther(sellPriceData)) /
                            Number(sellAmount) -
                            Number(formatEther(currentPrice))) /
                            Number(formatEther(currentPrice))) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Chart Verification Component
function ChartVerification({
  token,
  tokenExists,
  refreshKey,
}: {
  token: any;
  tokenExists: boolean;
  refreshKey: number;
}) {
  const { trades, loading, error } = useTokenTrades(token?.address);

  if (!tokenExists) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Token Required</h3>
          <p className="text-muted-foreground">
            Enter a valid token address to test chart accuracy
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-500" />
          Chart Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        {error && <p className="text-red-500">{error}</p>}
        <RechartsLineChart trades={trades} loading={loading} token={token} />
      </CardContent>
    </Card>
  );
}

// Live Trading Component
function LiveTrading({
  token,
  tokenExists,
  userAddress,
  isConnected,
  refreshKey,
}: {
  token: string;
  tokenExists: boolean;
  userAddress?: string;
  isConnected: boolean;
  refreshKey: number;
}) {
  const { toast } = useToast();
  const { buyTokens, sellTokens, isWritePending } = useFactoryContract();

  const [buyAmount, setBuyAmount] = useState("0.01");
  const [sellAmount, setSellAmount] = useState("100");

  const { data: avaxBalance, refetch: refetchAvaxBalance } = useBalance({
    address: userAddress as Address,
  });

  const { data: tokenBalance, refetch: refetchTokenBalance } = useBalance({
    address: userAddress as Address,
    token: token as Address,
  });

  const { writeContract: approve, isPending: isApproving } = useWriteContract();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token as Address,
    abi: TOKEN_ABI,
    functionName: "allowance",
    args: [userAddress as Address, FACTORY_ADDRESS],
    query: {
      enabled: !!userAddress && !!token,
    },
  });

  const needsApproval = useMemo(() => {
    if (!sellAmount || !allowance) return false;
    try {
      return parseEther(sellAmount) > allowance;
    } catch {
      return false;
    }
  }, [sellAmount, allowance]);

  const handleBuy = () => {
    if (!token || !buyAmount) return;
    buyTokens(token as Address, buyAmount);
  };

  const handleSell = () => {
    if (!token || !sellAmount) return;
    sellTokens(token as Address, sellAmount);
  };

  const handleApprove = () => {
    if (!token || !sellAmount) return;
    approve({
      address: token as Address,
      abi: TOKEN_ABI,
      functionName: "approve",
      args: [FACTORY_ADDRESS, parseEther(sellAmount)],
    });
  };

  useEffect(() => {
    refetchAvaxBalance();
    refetchTokenBalance();
    refetchAllowance();
  }, [refreshKey, isWritePending]);

  if (!isConnected || !tokenExists) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Connect Wallet & Select Token
          </h3>
          <p className="text-muted-foreground">
            Please connect your wallet and provide a valid token address to
            start trading.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buy {token.slice(0, 6)}</CardTitle>
          <CardDescription>
            Your AVAX Balance: {formatEther(avaxBalance?.value ?? 0n)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="buy-amount">Amount in AVAX</Label>
              <Input
                id="buy-amount"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                type="number"
                step="0.01"
              />
            </div>
            <Button onClick={handleBuy} disabled={isWritePending}>
              {isWritePending ? "Buying..." : "Buy"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sell {token.slice(0, 6)}</CardTitle>
          <CardDescription>
            Your Token Balance: {formatEther(tokenBalance?.value ?? 0n)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sell-amount">Amount in Tokens</Label>
              <Input
                id="sell-amount"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                type="number"
                step="1"
              />
            </div>
            {needsApproval ? (
              <Button onClick={handleApprove} disabled={isApproving}>
                {isApproving ? "Approving..." : "Approve"}
              </Button>
            ) : (
              <Button onClick={handleSell} disabled={isWritePending}>
                {isWritePending ? "Selling..." : "Sell"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
