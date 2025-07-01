//app/dex/[tokenAddress]/stats

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { TokenStats } from "@/components/TokenStats";
import { useTokenStats } from "@/hooks/token/useTokenStats";
import { TokenData } from "@/types";
import { usePublicClient } from "wagmi";
import { getFormattedTokenData } from "@/utils/tokenUtils";

export default function TokenStatsPage() {
  const { tokenAddress } = useParams();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  // Get real-time stats from our existing hook
  const {
    currentPrice,
    volumeETH,
    tradeCount,
    uniqueHolders,
    tokenState,
    collateral,
    loading: statsLoading,
    error: statsError,
  } = useTokenStats({ tokenAddress: tokenAddress as string });

  // Fetch initial token data
  useEffect(() => {
    async function fetchTokenData() {
      if (!tokenAddress || !publicClient) return;

      try {
        const tokenDocRef = doc(db, "tokens", tokenAddress as string);
        const tokenDoc = await getDoc(tokenDocRef);

        if (tokenDoc.exists()) {
          const data = tokenDoc.data();
          const formattedData = await getFormattedTokenData(
            tokenAddress as string,
            data,
            {
              currentPrice,
              //   volumeETH,
              tradeCount,
              uniqueHolders,
              tokenState,
              collateral,
            },
            publicClient
          );
          setTokenData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTokenData();
  }, [
    tokenAddress,
    publicClient,
    currentPrice,
    volumeETH,
    tradeCount,
    uniqueHolders,
    tokenState,
    collateral,
  ]);

  if (!publicClient) return <div>Initializing...</div>;
  if (loading || statsLoading) {
    return <TokenStats loading data={null as any} />;
  }

  if (!tokenData) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">Token not found</h1>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          Error loading token stats: {statsError}
        </h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {tokenData.name} ({tokenData.symbol}) Stats
        </h1>
      </div>
      <TokenStats data={tokenData} />
    </div>
  );
}
