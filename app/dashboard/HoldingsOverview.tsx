"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { formatEther } from "viem";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

export function HoldingsOverview() {
  const { address } = useAccount();
  const [tokens, setTokens] = useState<
    Array<{ address: string; name: string }>
  >([]);
  const [holdings, setHoldings] = useState<
    Array<{ name: string; value: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's created tokens
  useEffect(() => {
    const fetchUserTokens = async () => {
      if (!address) return;

      const tokensRef = collection(db, "tokens");
      const q = query(tokensRef, where("creator", "==", address.toLowerCase()));

      try {
        const querySnapshot = await getDocs(q);
        const userTokens = querySnapshot.docs.map((doc) => ({
          address: doc.id,
          name: doc.data().name,
        }));
        setTokens(userTokens);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      }
    };

    fetchUserTokens();
  }, [address]);

  // Read token data from contracts
  const { data: tokenData } = useReadContracts({
    contracts: tokens.map((token) => ({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "getUserTokenBalance",
      args: [token.address, address],
    })),
  });

  // Process token data into holdings
  useEffect(() => {
    if (!tokenData) return;

    const processedHoldings = tokens
      .map((token, index) => {
        const balance = tokenData[index]?.result;
        return {
          name: token.name,
          value: balance ? Number(formatEther(BigInt(balance.toString()))) : 0,
        };
      })
      .filter((holding) => holding.value > 0);

    setHoldings(processedHoldings);
    setLoading(false);
  }, [tokenData, tokens]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holdings Overview</CardTitle>
          <CardDescription>Loading your holdings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holdings Overview</CardTitle>
          <CardDescription>
            You don&pos;t have any token holdings yet
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings Overview</CardTitle>
        <CardDescription>Distribution of your token holdings</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={holdings}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {holdings.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [
                `${Number(value).toFixed(2)} tokens`,
                "Amount",
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
