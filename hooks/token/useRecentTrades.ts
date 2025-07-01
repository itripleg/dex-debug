import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase";

export interface Trade {
  id: string;
  type: "buy" | "sell";
  ethAmount: number;
  tokenAmount: number;
  timestamp: number;
  pricePerToken: number;
}

export interface BuySellPressure {
  buyAmount: number;
  sellAmount: number;
}

export function useRecentTrades(tokenAddress: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [buySellPressure, setBuySellPressure] = useState<BuySellPressure>({
    buyAmount: 0,
    sellAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    const tradesRef = collection(db, "trades");
    const q = query(tradesRef, orderBy("timestamp", "desc"), limit(8));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tradeData: Trade[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type,
            ethAmount: data.ethAmount,
            tokenAmount: data.tokenAmount,
            timestamp: data.timestamp,
            pricePerToken: data.pricePerToken,
          };
        });

        setTrades(tradeData);

        const pressure = tradeData.reduce(
          (acc, trade) => ({
            buyAmount:
              acc.buyAmount + (trade.type === "buy" ? trade.ethAmount : 0),
            sellAmount:
              acc.sellAmount + (trade.type === "sell" ? trade.ethAmount : 0),
          }),
          { buyAmount: 0, sellAmount: 0 }
        );

        setBuySellPressure(pressure);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching trades:", err);
        setError("Failed to load recent trades");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

  return { trades, buySellPressure, loading, error };
}
