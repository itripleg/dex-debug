// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Token } from "@/types";

interface UseTokenListOptions {
  orderByField?: string;
  orderDirection?: "desc" | "asc";
  additionalQueries?: QueryConstraint[];
  limitCount?: number;
}

export enum TokenPriceCategory {
  ALL = "all",
  HIGH = "high", // >= 100
  MEDIUM = "medium", // >= 10 && < 100
  LOW = "low", // < 10
}

export function useTokenList(options: UseTokenListOptions = {}) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<TokenPriceCategory>(
    TokenPriceCategory.ALL
  );

  // Fetch tokens from Firestore
  useEffect(() => {
    setIsLoading(true);

    const queryConstraints: QueryConstraint[] = [
      orderBy(
        options.orderByField || "createdAt",
        options.orderDirection || "desc"
      ),
      limit(options.limitCount || 25),
      ...(options.additionalQueries || []),
    ];

    const tokensQuery = query(collection(db, "tokens"), ...queryConstraints);

    const unsubscribe = onSnapshot(
      tokensQuery,
      (snapshot) => {
        const tokenData: Token[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          symbol: doc.data().symbol,
          address: doc.data().address,
          currentPrice: Number(doc.data().statistics?.currentPrice || 0),
          createdAt: new Date(doc.data().createdAt),
          imageUrl: doc.data().imageUrl,
        }));
        setTokens(tokenData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching tokens:", err);
        setError("Failed to load tokens. Please try again later.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [options.orderByField, options.orderDirection, options.limitCount]);

  // Filter tokens based on search and category
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      // Search filter
      const searchMatch =
        !searchQuery ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.address.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      let categoryMatch = true;
      if (activeCategory !== TokenPriceCategory.ALL) {
        switch (activeCategory) {
          case TokenPriceCategory.HIGH:
            categoryMatch = token.currentPrice >= 100;
            break;
          case TokenPriceCategory.MEDIUM:
            categoryMatch =
              token.currentPrice >= 10 && token.currentPrice < 100;
            break;
          case TokenPriceCategory.LOW:
            categoryMatch = token.currentPrice < 10;
            break;
        }
      }

      return searchMatch && categoryMatch;
    });
  }, [tokens, searchQuery, activeCategory]);

  const setCategory = (category: TokenPriceCategory) => {
    setActiveCategory(category);
  };

  return {
    // Raw data
    tokens,

    // Filtered data
    filteredTokens,

    // Search functionality
    searchQuery,
    setSearchQuery,

    // Category functionality
    activeCategory,
    setCategory,

    // Status
    isLoading,
    error,
  };
}
