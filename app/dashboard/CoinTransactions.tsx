"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { formatEther } from "viem";

interface Trade {
  id: string;
  type: "buy" | "sell";
  token: string;
  tokenName?: string;
  blockNumber: number;
  tokenAmount: string;
  ethAmount: string;
  fee: string;
  pricePerToken: string;
  timestamp: string;
  transactionHash: string;
}

export function CoinTransactions() {
  const { address } = useAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      if (!address) return;

      try {
        const tradesRef = collection(db, "trades");
        const q = query(
          tradesRef,
          where("trader", "==", address.toLowerCase()),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const tradeData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();

            // Get token details
            const tokenDoc = await getDocs(
              query(
                collection(db, "tokens"),
                where("address", "==", data.token)
              )
            );
            const tokenData = tokenDoc.docs[0]?.data();
            const tokenName = tokenData?.name || "Unknown Token";

            return {
              id: doc.id,
              type: data.type as "buy" | "sell",
              token: data.token,
              tokenName,
              blockNumber: data.blockNumber,
              tokenAmount: data.tokenAmount,
              ethAmount: data.ethAmount,
              fee: data.fee,
              pricePerToken: data.pricePerToken,
              timestamp: data.timestamp,
              transactionHash: data.transactionHash,
            };
          })
        );

        setTrades(tradeData);
      } catch (error) {
        console.error("Error fetching trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [address]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>Loading your trades...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!trades.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>No trades found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
        <CardDescription>Your trading activity</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Token Amount</TableHead>
              <TableHead>ETH Amount</TableHead>
              <TableHead>Price/Token</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((tx) => (
              <TableRow key={tx.id} className="group">
                <TableCell
                  className={
                    tx.type === "buy" ? "text-green-600" : "text-red-600"
                  }
                >
                  {tx.type.toUpperCase()}
                </TableCell>
                <TableCell>{tx.tokenName}</TableCell>
                <TableCell>{tx.blockNumber}</TableCell>
                <TableCell>
                  {Number(formatEther(BigInt(tx.tokenAmount))).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </TableCell>
                <TableCell>
                  {Number(formatEther(BigInt(tx.ethAmount))).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    }
                  )}
                </TableCell>
                <TableCell>
                  {Number(tx.pricePerToken).toLocaleString(undefined, {
                    minimumFractionDigits: 8,
                    maximumFractionDigits: 8,
                  })}
                </TableCell>
                <TableCell>
                  {Number(formatEther(BigInt(tx.fee))).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 6,
                      maximumFractionDigits: 6,
                    }
                  )}
                </TableCell>
                <TableCell>
                  {new Date(tx.timestamp).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
