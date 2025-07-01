// app/dex/components/tokens/TokenCard.tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Token } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useState, useEffect } from "react";

interface TokenCardProps {
  token: Token;
  price: string;
  rawPrice?: string;
  isLoading?: boolean;
  lastUpdated?: number;
}

// Component to show price change animation
const PriceDisplay = ({
  price,
  rawPrice,
}: {
  price: string;
  rawPrice?: string;
}) => {
  const [previousPrice, setPreviousPrice] = useState<string>("");
  const [priceDirection, setPriceDirection] = useState<
    "up" | "down" | "neutral"
  >("neutral");

  useEffect(() => {
    if (rawPrice && previousPrice && rawPrice !== previousPrice) {
      const current = parseFloat(rawPrice);
      const previous = parseFloat(previousPrice);

      if (current > previous) {
        setPriceDirection("up");
      } else if (current < previous) {
        setPriceDirection("down");
      } else {
        setPriceDirection("neutral");
      }

      // Reset direction after animation
      const timer = setTimeout(() => setPriceDirection("neutral"), 2000);
      return () => clearTimeout(timer);
    }

    if (rawPrice) {
      setPreviousPrice(rawPrice);
    }
  }, [rawPrice, previousPrice]);

  const getPriceColor = () => {
    switch (priceDirection) {
      case "up":
        return "text-green-400";
      case "down":
        return "text-red-400";
      default:
        return "text-gray-200";
    }
  };

  const PriceIcon = () => {
    switch (priceDirection) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-400" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <motion.div
      className="flex items-center gap-2"
      animate={{
        scale: priceDirection !== "neutral" ? [1, 1.05, 1] : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      <PriceIcon />
      <span
        className={`text-sm font-mono transition-colors duration-300 ${getPriceColor()}`}
      >
        {price} AVAX
      </span>
    </motion.div>
  );
};

export const TokenCard = ({ token, price, rawPrice }: TokenCardProps) => {
  const router = useRouter();

  // Format the address for display
  const shortAddress = token.address
    ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}`
    : "N/A";

  // Determine if this is a "new" token (created within last 24 hours)
  const isNew = token.createdAt
    ? Date.now() - new Date(token.createdAt).getTime() < 24 * 60 * 60 * 1000
    : false;

  return (
    <AnimatePresence>
      <motion.div
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        layout
      >
        <Card
          className="h-full relative overflow-hidden group cursor-pointer"
          onClick={() => router.push(`/dex/${token.address}`)}
        >
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0">
            {token.imageUrl ? (
              <div
                className="absolute inset-0 bg-no-repeat transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundImage: `url(${token.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 transition-opacity duration-300 group-hover:from-black/70 group-hover:to-black/80" />
          </div>

          {/* Content Layer */}
          <div className="relative z-10 p-4 h-full flex flex-col">
            {/* Header */}
            <CardHeader className="p-0 mb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <CardTitle className="text-white text-lg font-bold truncate">
                    {token.name}
                  </CardTitle>
                  <CardDescription className="text-gray-200 text-sm">
                    ${token.symbol}
                  </CardDescription>
                </div>

                {/* New badge */}
                {isNew && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs"
                  >
                    NEW
                  </Badge>
                )}
              </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="p-0 flex-1 space-y-3">
              {/* Price Display */}
              <div className="backdrop-blur-sm bg-white/10 rounded-lg p-3 border border-white/20">
                <div className="text-gray-300 text-xs mb-1">Current Price</div>
                <PriceDisplay price={price} rawPrice={rawPrice} />
              </div>

              {/* Token Info */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Address:</span>
                  <span className="text-gray-200 font-mono text-xs">
                    {shortAddress}
                  </span>
                </div>

                {token.createdAt && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Created:</span>
                    <span className="text-gray-200 text-xs">
                      {new Date(token.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="p-0 mt-4">
              <Button
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white transition-all duration-300 group-hover:bg-white/40"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dex/${token.address}`);
                }}
              >
                Trade Token
              </Button>
            </CardFooter>
          </div>

          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
