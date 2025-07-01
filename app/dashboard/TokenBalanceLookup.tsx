import React, { useState, useEffect } from "react";
import { Alchemy, Network } from "alchemy-sdk";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Search, Star, StarOff } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
import { truncateAddress, getExplorerUrl } from "@/utils/tokenUtils";
import { TokenAddress } from "@/components/TokenAddress";

const SUPPORTED_NETWORKS = [
  {
    name: "Ethereum",
    network: Network.ETH_MAINNET,
    color: "#627EEA",
    nativeToken: "ETH",
  },
  {
    name: "Polygon",
    network: Network.MATIC_MAINNET,
    color: "#8247E5",
    nativeToken: "MATIC",
  },
  {
    name: "Avalanche",
    network: Network.AVAX_MAINNET,
    color: "#28A0F0",
    nativeToken: "AVAX",
  },
  {
    name: "Avalanche Fuji",
    network: Network.AVAX_FUJI,
    color: "#28A0a8",
    nativeToken: "AVAX",
  },
  {
    name: "BSC",
    network: Network.BNB_MAINNET,
    color: "#FF0420",
    nativeToken: "BNB",
  },
];

const MINIMUM_BALANCE = 0.0001;

interface TokenBalance {
  network: string;
  tokenName: string;
  tokenSymbol: string;
  balance: string;
  tokenAddress: string;
  networkColor: string;
  usdValue?: number;
}

interface WatchlistAddress {
  id: string;
  address: string;
  label: string;
  addedAt: Date;
}

const TokenCard = ({ token }: { token: TokenBalance }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: token.networkColor }}
            />
            <span className="text-sm text-muted-foreground truncate">
              {token.network}
            </span>
          </div>
          <h3 className="font-semibold mt-2 truncate">{token.tokenName}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {token.tokenSymbol}
          </p>
          <TokenAddress address={token.tokenAddress} network={token.network} />
        </div>
        <div className="text-right min-w-[120px] max-w-[160px]">
          <p className="font-bold truncate" title={token.balance}>
            {token.balance}
          </p>
          {token.usdValue && (
            <p
              className="text-sm text-muted-foreground truncate"
              title={`$${token.usdValue.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}`}
            >
              $
              {token.usdValue.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const NetworkGroup = ({
  network,
  tokens,
}: {
  network: string;
  tokens: TokenBalance[];
}) => (
  <div className="mb-8">
    <h3 className="font-semibold mb-4">{network}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tokens.map((token, index) => (
        <TokenCard
          key={`${token.network}-${token.tokenAddress}-${index}`}
          token={token}
        />
      ))}
    </div>
  </div>
);

export function TokenBalanceLookup() {
  const { address: userAddress } = useAccount();
  const [searchAddress, setSearchAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [activeTab, setActiveTab] = useState("mine");
  const [watchlist, setWatchlist] = useState<WatchlistAddress[]>([]);
  const [newLabel, setNewLabel] = useState("");

  const alchemyInstances = SUPPORTED_NETWORKS.reduce((acc, network) => {
    acc[network.name] = new Alchemy({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      network: network.network,
    });
    return acc;
  }, {} as Record<string, Alchemy>);

  useEffect(() => {
    if (!userAddress) return;
    // fetchBalances(userAddress);
    const q = query(
      collection(db, "watchlist"),
      where("userId", "==", userAddress.toLowerCase())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const addresses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WatchlistAddress[];
      setWatchlist(addresses);
    });

    return () => unsubscribe();
  }, [userAddress]);

  const fetchBalances = async (address: string) => {
    if (!isAddress(address)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    setIsLoading(true);
    setError("");
    setBalances([]);

    try {
      const allBalances: TokenBalance[] = [];

      await Promise.all(
        SUPPORTED_NETWORKS.map(
          async ({ name, network, color, nativeToken }) => {
            const alchemy = alchemyInstances[name];

            try {
              const tokenBalances = await alchemy.core.getTokenBalances(
                address
              );

              const nonZeroBalances = tokenBalances.tokenBalances.filter(
                (token) => token.tokenBalance !== "0"
              );

              for (const token of nonZeroBalances) {
                try {
                  const metadata = await alchemy.core.getTokenMetadata(
                    token.contractAddress
                  );

                  const actualBalance = token.tokenBalance
                    ? parseInt(token.tokenBalance) /
                      Math.pow(10, metadata.decimals || 18)
                    : 0;

                  // Only add tokens with balance >= MINIMUM_BALANCE
                  if (actualBalance >= MINIMUM_BALANCE) {
                    allBalances.push({
                      network: name,
                      tokenName: metadata.name || "Unknown Token",
                      tokenSymbol: metadata.symbol || "???",
                      balance: actualBalance.toFixed(4),
                      tokenAddress: token.contractAddress,
                      networkColor: color,
                    });
                  }
                } catch (err) {
                  console.error(
                    `Error fetching metadata for token ${token.contractAddress}:`,
                    err
                  );
                }
              }

              // Fetch and filter native token balance
              const nativeBalance = await alchemy.core.getBalance(address);
              const nativeBalanceInEther =
                parseInt(nativeBalance.toString()) / 1e18;

              if (nativeBalanceInEther >= MINIMUM_BALANCE) {
                allBalances.push({
                  network: name,
                  tokenName: name + " " + nativeToken,
                  tokenSymbol: nativeToken,
                  balance: nativeBalanceInEther.toFixed(4),
                  tokenAddress: "native",
                  networkColor: color,
                });
              }
            } catch (err) {
              console.error(`Error fetching balances for ${name}:`, err);
            }
          }
        )
      );

      const sortedBalances = allBalances.sort((a, b) => {
        if (a.network !== b.network) {
          return a.network.localeCompare(b.network);
        }
        return parseFloat(b.balance) - parseFloat(a.balance);
      });

      setBalances(sortedBalances);
    } catch (err) {
      setError("Error fetching token balances. Please try again.");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!userAddress || !searchAddress || !isAddress(searchAddress)) return;

    try {
      await addDoc(collection(db, "watchlist"), {
        userId: userAddress.toLowerCase(),
        address: searchAddress.toLowerCase(),
        label: newLabel || searchAddress,
        addedAt: new Date(),
      });
      setNewLabel("");
    } catch (err) {
      console.error("Error adding to watchlist:", err);
      setError("Failed to add address to watchlist");
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      await deleteDoc(doc(db, "watchlist", id));
    } catch (err) {
      console.error("Error removing from watchlist:", err);
      setError("Failed to remove address from watchlist");
    }
  };

  const groupedBalances = balances.reduce((acc, balance) => {
    if (!acc[balance.network]) {
      acc[balance.network] = [];
    }
    acc[balance.network].push(balance);
    return acc;
  }, {} as Record<string, TokenBalance[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Balance Explorer</CardTitle>
        <CardDescription>
          View and track token balances across multiple networks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="mine">My Balances</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>

          <TabsContent value="mine">
            {userAddress ? (
              <div className="space-y-4">
                <Button
                  onClick={() => fetchBalances(userAddress)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    "Fetch Your Balances"
                  )}
                </Button>
                {Object.entries(groupedBalances).map(([network, tokens]) => (
                  <NetworkGroup
                    key={network}
                    network={network}
                    tokens={tokens}
                  />
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Please connect your wallet to view your balances
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="search">
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Enter Ethereum address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Label (optional)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => fetchBalances(searchAddress)}
                disabled={isLoading || !searchAddress}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              {userAddress && (
                <Button
                  variant="outline"
                  onClick={addToWatchlist}
                  disabled={!isAddress(searchAddress)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Watch
                </Button>
              )}
            </div>
            {Object.entries(groupedBalances).map(([network, tokens]) => (
              <NetworkGroup key={network} network={network} tokens={tokens} />
            ))}
          </TabsContent>

          <TabsContent value="watchlist">
            {userAddress ? (
              <div className="space-y-4">
                {watchlist.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No addresses in your watchlist yet
                  </p>
                ) : (
                  watchlist.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.address}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                fetchBalances(item.address);
                                setActiveTab("search");
                              }}
                            >
                              <Search className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => removeFromWatchlist(item.id)}
                            >
                              <StarOff className="h-4 w-4 mr-2" />
                              Unwatch
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Please connect your wallet to use the watchlist feature
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default TokenBalanceLookup;
