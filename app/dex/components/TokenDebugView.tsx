// @ts-nocheck
import React from "react";
import { useTokenContext } from "@/contexts/TokenContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatEther } from "viem";
import { Token, TokenState } from "@/types";

// Helper to format ETH values
const formatETH = (value: string) => {
  try {
    return `${formatEther(BigInt(value))} ETH`;
  } catch {
    return "0 ETH";
  }
};

// Helper to format token state
const formatTokenState = (state: TokenState): string => {
  const states = {
    [TokenState.NOT_CREATED]: "NOT_CREATED",
    [TokenState.TRADING]: "TRADING",
    [TokenState.GOAL_REACHED]: "GOAL_REACHED",
    [TokenState.HALTED]: "HALTED",
    [TokenState.RESUMED]: "RESUMED",
  };
  return states[state] || "UNKNOWN";
};

export const TokenDebugView = ({ address }: { address: string }) => {
  const context = useTokenContext();
  const token = context.tokens[address];

  // Format any value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Helper to render a key-value pair
  const DebugField = ({ label, value }: { label: string; value: any }) => (
    <div className="mb-2">
      <span className="font-semibold text-gray-200">{label}: </span>
      <span className="text-gray-300 break-all whitespace-pre-wrap font-mono text-sm">
        {formatValue(value)}
      </span>
    </div>
  );

  if (!token) {
    return (
      <Card className="bg-gray-800 text-white">
        <CardHeader>
          <CardTitle>Token Debug View - No Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No token data found for address: {address}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 text-white">
      <CardHeader>
        <CardTitle>Token Debug View</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Basic Info</h3>
          <DebugField label="Address" value={token.address} />
          <DebugField label="Name" value={token.name} />
          <DebugField label="Symbol" value={token.symbol} />
          <DebugField label="State" value={formatTokenState(token.state)} />
          <DebugField label="Description" value={token.description} />
          <DebugField label="Image URL" value={token.imageUrl} />
        </div>

        {/* Contract Parameters */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Contract Parameters</h3>
          <DebugField label="Creator" value={token.creator} />
          <DebugField label="Burn Manager" value={token.burnManager} />
          <DebugField label="Funding Goal" value={token.fundingGoal + " ETH"} />
          <DebugField
            label="Current Collateral"
            value={token.collateral + " ETH"}
          />
          <DebugField
            label="Virtual Supply"
            value={formatETH(token.virtualSupply)}
          />
        </div>

        {/* Factory Constants */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Factory Constants</h3>
          <DebugField
            label="Initial Price"
            value={formatETH(token.initialPrice)}
          />
          <DebugField label="Current Price" value={token.currentPrice} />
          <DebugField label="Max Supply" value={formatETH(token.maxSupply)} />
          <DebugField
            label="Initial Mint"
            value={formatETH(token.initialMint)}
          />
          <DebugField
            label="Total Supply"
            value={formatETH(token.totalSupply)}
          />
          <DebugField
            label="Max Wallet %"
            value={`${token.maxWalletPercentage}%`}
          />
          <DebugField label="Price Rate" value={token.priceRate} />
          <DebugField
            label="Min Purchase"
            value={formatETH(token.minPurchase)}
          />
          <DebugField
            label="Max Purchase"
            value={formatETH(token.maxPurchase)}
          />
          <DebugField
            label="Trading Fee"
            value={`${token.tradingFee / 100}%`}
          />
        </div>

        {/* Last Trade */}
        {token.lastTrade && (
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Last Trade</h3>
            <DebugField
              label="Timestamp"
              value={new Date(token.lastTrade.timestamp).toLocaleString()}
            />
            <DebugField label="Type" value={token.lastTrade.type} />
            <DebugField
              label="Amount"
              value={formatETH(token.lastTrade.amount)}
            />
            <DebugField
              label="ETH Amount"
              value={formatETH(token.lastTrade.ethAmount)}
            />
            <DebugField label="Trader" value={token.lastTrade.trader} />
          </div>
        )}

        {/* Creation Info */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Creation Info</h3>
          <DebugField
            label="Created At"
            value={new Date(token.createdAt).toLocaleString()}
          />
          <DebugField label="Block Number" value={token.blockNumber} />
          <DebugField label="Transaction Hash" value={token.transactionHash} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenDebugView;
