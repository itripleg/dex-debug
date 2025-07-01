"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Address, formatUnits, parseUnits } from "viem";
import { Trade } from "@/types";
import { tokenEventEmitter } from "@/components/EventWatcher"; // Import the event emitter

interface TradesContextState {
  trades: { [tokenAddress: string]: Trade[] | null };
  errors: { [tokenAddress: string]: string | null };
  watchTrades: (tokenAddress: string) => void;
  unwatchTrades: (tokenAddress: string) => void;
}

const TradesContext = createContext<TradesContextState | null>(null);

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<{
    [tokenAddress: string]: Trade[] | null;
  }>({});
  const [errors, setErrors] = useState<{
    [tokenAddress: string]: string | null;
  }>({});
  const subscriptions = useRef<{ [key: string]: Unsubscribe }>({}).current;

  // --- NEW ---
  // This effect listens for real-time events from the client-side EventWatcher
  useEffect(() => {
    const handleClientEvent = (event: any) => {
      console.log(
        `[TradesContext] Received optimistic event: ${event.eventName}`
      );
      const { eventName, tokenAddress, data } = event;

      // We only care about buy/sell events for optimistic updates
      if (eventName !== "TokensPurchased" && eventName !== "TokensSold") {
        return;
      }

      // Create a temporary Trade object from the event data
      const optimisticTrade: Trade = {
        trader: data.trader,
        token: tokenAddress,
        type: eventName === "TokensPurchased" ? "buy" : "sell",
        ethAmount: data.ethAmount.toString(),
        tokenAmount: data.tokenAmount.toString(),
        timestamp: new Date().toISOString(), // Use current time for optimistic update
        transactionHash: data.transactionHash || `optimistic_${Date.now()}`,
        // These fields might not be in the event, so we provide defaults
        blockNumber: 0,
        pricePerToken: "0",
      };

      // Update the local state immediately
      setTrades((prev) => {
        const currentTrades = prev[tokenAddress] || [];
        // Add the new trade to the top of the list
        const updatedTrades = [optimisticTrade, ...currentTrades];
        return {
          ...prev,
          [tokenAddress]: updatedTrades,
        };
      });
    };

    // Subscribe to all events for the tokens being watched
    Object.keys(subscriptions).forEach((tokenAddress) => {
      tokenEventEmitter.addEventListener(tokenAddress, handleClientEvent);
    });

    // Cleanup: remove listeners when the component or dependencies change
    return () => {
      Object.keys(subscriptions).forEach((tokenAddress) => {
        tokenEventEmitter.removeEventListener(tokenAddress, handleClientEvent);
      });
    };
  }, [subscriptions, trades]); // Re-run when subscriptions change

  const watchTrades = useCallback(
    (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      if (!tokenAddress || subscriptions[lowercasedAddress]) return;

      const tradesRef = collection(db, "trades");
      const tradesQuery = query(
        tradesRef,
        where("token", "==", lowercasedAddress),
        orderBy("timestamp", "desc"),
        limit(100)
      );

      const unsubscribe = onSnapshot(
        tradesQuery,
        (snapshot) => {
          console.log(
            `[TradesContext] Received canonical data from Firestore for ${lowercasedAddress}. Docs found: ${snapshot.docs.length}`
          );
          const newTrades: Trade[] = snapshot.docs.map(
            (doc) => doc.data() as Trade
          );
          // This update from Firestore will overwrite any optimistic state
          setTrades((prev) => ({ ...prev, [lowercasedAddress]: newTrades }));
          setErrors((prev) => ({ ...prev, [lowercasedAddress]: null }));
        },
        (error) => {
          console.error(
            `[TradesContext] Error fetching from Firestore for ${lowercasedAddress}:`,
            error
          );
          setTrades((prev) => ({ ...prev, [lowercasedAddress]: null }));
          setErrors((prev) => ({
            ...prev,
            [lowercasedAddress]: "Failed to load trades",
          }));
        }
      );

      subscriptions[lowercasedAddress] = unsubscribe;
    },
    [subscriptions]
  );

  const unwatchTrades = useCallback(
    (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      if (subscriptions[lowercasedAddress]) {
        subscriptions[lowercasedAddress]();
        delete subscriptions[lowercasedAddress];
      }
    },
    [subscriptions]
  );

  const value = { trades, errors, watchTrades, unwatchTrades };

  return (
    <TradesContext.Provider value={value}>{children}</TradesContext.Provider>
  );
}

// Other hooks (useTradesContext, useTrades) remain the same
export function useTradesContext() {
  const context = useContext(TradesContext);
  if (!context) {
    throw new Error("useTradesContext must be used within a TradesProvider");
  }
  return context;
}

export function useTrades(tokenAddress: string | undefined) {
  const { trades, errors, watchTrades, unwatchTrades } = useTradesContext();

  useEffect(() => {
    if (tokenAddress) {
      watchTrades(tokenAddress);
      return () => {
        unwatchTrades(tokenAddress);
      };
    }
  }, [tokenAddress, watchTrades, unwatchTrades]);

  const lowercasedAddress = tokenAddress?.toLowerCase();
  const tradesData = lowercasedAddress ? trades[lowercasedAddress] : null;
  const isLoading =
    lowercasedAddress && trades[lowercasedAddress] === undefined;

  return {
    trades: tradesData || [],
    loading: isLoading,
    error: lowercasedAddress ? errors[lowercasedAddress] || null : null,
  };
}
