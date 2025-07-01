import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface TokenProgressData {
  id: string;
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  creator: string;
  status: string;
  collateral: number;
  fundingGoal: number;
  progress: number;
}

export function TokensCreated() {
  const { address: userAddress } = useAccount();
  const [tokens, setTokens] = useState<TokenProgressData[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(
      collection(db, "tokens"),
      where("creator", "==", userAddress.toLowerCase())
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const tokensPromises = snapshot.docs.map(async (doc) => {
            const tokenBaseData = doc.data();
            const tokenDoc = await getDoc(doc.ref);
            const tokenData = tokenDoc.data();

            const progress = tokenData?.fundingGoal
              ? (parseFloat(tokenData.collateral || "0") /
                  parseFloat(tokenData.fundingGoal)) *
                100
              : 0;

            return {
              id: doc.id,
              address: doc.id,
              name: tokenBaseData.name,
              symbol: tokenBaseData.symbol,
              imageUrl: tokenBaseData.imageUrl,
              creator: tokenBaseData.creator,
              status: tokenBaseData.status || "Active",
              collateral: parseFloat(tokenData?.collateral || "0"),
              fundingGoal: parseFloat(tokenData?.fundingGoal || "0"),
              progress: Math.min(progress, 100),
            };
          });

          const processedTokens = await Promise.all(tokensPromises);
          setTokens(processedTokens);
        } catch (err) {
          console.error("Error processing tokens:", err);
          setError("Failed to process token details");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching tokens:", error);
        setError("Failed to load tokens");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userAddress]);

  if (!userAddress) {
    return (
      <Alert>
        <AlertDescription>
          Please connect your wallet to view your created tokens
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-border dark:border-white">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-foreground dark:text-white">
          Tokens Created
        </CardTitle>
        <CardDescription className="text-muted-foreground dark:text-gray-400">
          Progress towards funding goals
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : tokens.length === 0 ? (
          <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
            You haven&apos;t created any tokens yet
          </p>
        ) : (
          <div className="space-y-4">
            {tokens.map((token) => (
              <div key={token.id} className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full">
                      {token.imageUrl ? (
                        <Image
                          src={token.imageUrl}
                          alt={`${token.name} logo`}
                          className="object-cover"
                          fill
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full bg-muted dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-bold text-muted-foreground dark:text-gray-400">
                            {token.symbol?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground dark:text-white">
                        {token.name}
                      </span>
                      <span className="text-muted-foreground dark:text-gray-400">
                        ({token.symbol})
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground dark:text-gray-400">
                    {token.progress.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={token.progress}
                  className="h-2 bg-purple-950 dark:bg-purple-900"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground dark:text-gray-400">
                    Raised: {token.collateral.toFixed(4)} ETH
                  </span>
                  <span className="text-muted-foreground dark:text-gray-400">
                    Goal: {token.fundingGoal.toFixed(4)} ETH
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TokensCreated;
