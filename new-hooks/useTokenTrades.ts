// /new-hooks/useTokenTrades.ts

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
import { type Address } from "viem";
import { Trade } from "@/types"; // Use the single, official Trade type

/**
 * A robust hook to fetch both historical and real-time trade history for a given token.
 * It correctly maps the Firestore data structure to the official Trade type.
 */
export function useTokenTrades(tokenAddress?: Address) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const tradesRef = collection(db, "trades");
    const tradesQuery = query(
      tradesRef,
      where("token", "==", tokenAddress.toLowerCase()),
      orderBy("timestamp", "desc"), // Fetches newest trades first
      limit(100)
    );

    const unsubscribe = onSnapshot(
      tradesQuery,
      (snapshot) => {
        const tradeDocs: Trade[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          // --- DEFINITIVE FIX FOR DATA MAPPING ---
          // This object now includes all required fields from the 'Trade' type.
          return {
            blockNumber: data.blockNumber,
            ethAmount: data.ethAmount,
            pricePerToken: data.pricePerToken,
            timestamp: data.timestamp, // Kept as a string to match the 'Trade' type
            token: data.token,
            tokenAmount: data.tokenAmount, // Use the correct property name
            trader: data.trader,
            transactionHash: data.transactionHash,
            type: data.type,
            fee: data.fee, // Include optional fields
          } as Trade;
        });

        // The query already returns trades with the newest first,
        // so we can set the state directly without reversing.
        setTrades(tradeDocs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching trades from Firestore:", err);
        setError("Failed to load trade history");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

  return { trades, loading, error };
}
