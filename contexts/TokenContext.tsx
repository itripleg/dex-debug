// /contexts/TokenContext.tsx
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
  doc,
  onSnapshot,
  collection,
  query,
  limit as limitQuery,
  getDocs,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Address } from "viem";
import { Token, TokenState } from "@/types";
import {
  useFactoryConfigContext,
  FactoryConfig,
} from "./FactoryConfigProvider";

interface TokenContextState {
  tokens: { [address: string]: Token | null }; // Use null to indicate "not found"
  errors: { [address: string]: string | null };
  watchToken: (address: string) => void;
  unwatchToken: (address: string) => void;
  getRecentTokens: (limit?: number) => Promise<Token[]>;
}

const TokenContext = createContext<TokenContextState | null>(null);

// /contexts/TokenContext.tsx - Updated mapTokenData function

const mapTokenData = (
  address: string,
  data: any,
  factoryConfig: FactoryConfig
): Token => {
  return {
    address: address.toLowerCase() as Address,
    name: data.name || "Unnamed Token",
    symbol: data.symbol || "N/A",
    imageUrl: data.imageUrl || "",
    description: data.description || "",
    creator: (data.creator || "0x0").toLowerCase() as Address,
    burnManager: (data.burnManager || "0x0").toLowerCase() as Address,
    fundingGoal: data.fundingGoal?.toString() || "0",
    createdAt: data.createdAt || new Date().toISOString(),
    blockNumber: data.blockNumber || 0,
    transactionHash: data.transactionHash || "",

    // Image positioning support
    imagePosition: data.imagePosition || {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      fit: "cover",
    },
    lastUpdated: data.lastUpdated,
    updatedBy: data.updatedBy,

    ...factoryConfig,
    collateral: "0",
    virtualSupply: "0",
    state: TokenState.NOT_CREATED,
    currentPrice: "0",
    totalSupply: "0",
  };
};

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { config: factoryConfig } = useFactoryConfigContext();
  const [tokens, setTokens] = useState<{ [address: string]: Token | null }>({});
  const [errors, setErrors] = useState<{ [address: string]: string | null }>(
    {}
  );
  const subscriptions = useRef<{ [key: string]: Unsubscribe }>({}).current;

  const watchToken = useCallback(
    (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      if (!factoryConfig || !tokenAddress || subscriptions[lowercasedAddress]) {
        return;
      }

      const tokenRef = doc(db, "tokens", lowercasedAddress);

      const unsubscribe = onSnapshot(
        tokenRef,
        (doc) => {
          if (doc.exists()) {
            const tokenData = mapTokenData(
              lowercasedAddress,
              doc.data(),
              factoryConfig
            );
            setTokens((prev) => ({ ...prev, [lowercasedAddress]: tokenData }));
            setErrors((prev) => ({ ...prev, [lowercasedAddress]: null }));
          } else {
            setTokens((prev) => ({ ...prev, [lowercasedAddress]: null })); // Explicitly mark as not found
            setErrors((prev) => ({
              ...prev,
              [lowercasedAddress]: "Token not found in database.",
            }));
          }
        },
        (error) => {
          console.error("Firestore subscription error:", error);
          setTokens((prev) => ({ ...prev, [lowercasedAddress]: null })); // Mark as error
          setErrors((prev) => ({
            ...prev,
            [lowercasedAddress]: error.message,
          }));
        }
      );

      subscriptions[lowercasedAddress] = unsubscribe;
    },
    [subscriptions, factoryConfig]
  );

  const unwatchToken = useCallback(
    (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      if (subscriptions[lowercasedAddress]) {
        subscriptions[lowercasedAddress]();
        delete subscriptions[lowercasedAddress];
      }
    },
    [subscriptions]
  );

  const getRecentTokens = useCallback(
    async (limit: number = 10): Promise<Token[]> => {
      if (!factoryConfig) return [];
      const tokensRef = collection(db, "tokens");
      const q = query(
        tokensRef,
        orderBy("createdAt", "desc"),
        limitQuery(limit)
      );
      const querySnapshot = await getDocs(q);
      // Filter out any potential nulls if mapTokenData could fail, though it's typed not to.
      return querySnapshot.docs
        .map((doc) => mapTokenData(doc.id, doc.data(), factoryConfig))
        .filter(Boolean) as Token[];
    },
    [factoryConfig]
  );

  return (
    <TokenContext.Provider
      value={{
        tokens,
        errors,
        watchToken,
        unwatchToken,
        getRecentTokens,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export function useTokenContext() {
  const context = useContext(TokenContext);
  if (!context)
    throw new Error("useTokenContext must be used within a TokenProvider");
  return context;
}

export function useToken(address: string) {
  const { tokens, errors, watchToken, unwatchToken } = useTokenContext();
  const lowercasedAddress = address?.toLowerCase();

  useEffect(() => {
    if (lowercasedAddress) {
      watchToken(lowercasedAddress);
      return () => {
        unwatchToken(lowercasedAddress);
      };
    }
  }, [lowercasedAddress, watchToken, unwatchToken]);

  const tokenData = lowercasedAddress ? tokens[lowercasedAddress] : null;
  const error = lowercasedAddress ? errors[lowercasedAddress] : null;

  // The loading state is now derived: it's loading if we have no data yet.
  // `undefined` means the fetch hasn't completed. `null` means it failed.
  const isLoading =
    lowercasedAddress && tokens[lowercasedAddress] === undefined;

  return {
    token: tokenData, // This will be Token object, null, or undefined
    loading: isLoading,
    error: error,
  };
}
