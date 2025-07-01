import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

export interface Trade {
  pricePerToken: string;
  timestamp: string;
  type: "buy" | "sell";
  ethAmount: string;
  tokenAmount: string;
}

export function useTokenTrades(tokenAddress: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        setError(null);

        const tradesRef = collection(db, "trades");
        const q = query(
          tradesRef,
          where("token", "==", tokenAddress),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const tradeData = querySnapshot.docs.map((doc) => ({
          pricePerToken: doc.data().pricePerToken,
          timestamp: doc.data().timestamp,
          type: doc.data().type,
          ethAmount: doc.data().ethAmount,
          tokenAmount: doc.data().tokenAmount,
        })) as Trade[];

        console.log("Fetched trades:", tradeData.length);
        setTrades(tradeData);
      } catch (error) {
        console.error("Error fetching trades:", error);
        setError("Failed to fetch trade data");
      } finally {
        setLoading(false);
      }
    };

    if (tokenAddress) {
      fetchTrades();
    }
  }, [tokenAddress]);

  return { trades, loading, error };
}
