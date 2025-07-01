"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";

export function BundledTokensMap() {
  // This would typically fetch data from your API or blockchain
  const data = [
    {
      name: "Bundle A",
      children: [
        { name: "Token 1", size: 1000 },
        { name: "Token 2", size: 800 },
        { name: "Token 3", size: 600 },
      ],
    },
    {
      name: "Bundle B",
      children: [
        { name: "Token 4", size: 1200 },
        { name: "Token 5", size: 900 },
      ],
    },
    {
      name: "Bundle C",
      children: [
        { name: "Token 6", size: 700 },
        { name: "Token 7", size: 500 },
        { name: "Token 8", size: 400 },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bundled Tokens Map</CardTitle>
        <CardDescription>
          Visual representation of bundled tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <Treemap
            data={data}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill="#8884d8"
          >
            <Tooltip />
          </Treemap>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
