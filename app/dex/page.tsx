// app/dex/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Container } from "@/components/craft";
import { useAccount } from "wagmi";
import { getAddressGreeting } from "@/hooks/addressGreetings";
import { motion, AnimatePresence } from "framer-motion";
import { SearchContainer } from "./components/SearchContainer";
import { TokenContainer } from "./components/tokens/TokenContainer";
import { useTokenList } from "@/hooks/token/useTokenList";
import { SpaceScene } from "./scene/SpaceScene";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Rocket,
  TrendingUp,
  Coins,
  Sparkles,
  Plus,
  BarChart3,
  Users,
  Activity,
} from "lucide-react";

export default function DexPage() {
  const account = useAccount();
  const cameraRef = useRef<any>(null);
  const controlRef = useRef<any>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [searchMode, setSearchMode] = useState("token");

  const {
    filteredTokens,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setCategory,
    isLoading,
    error,
  } = useTokenList();

  const handleSecretFound = () => {
    setShowSecret(true);
    setTimeout(() => setShowSecret(false), 160000);
  };

  useEffect(() => {
    setGreeting(getAddressGreeting(account?.address));
  }, [account?.address]);

  // Remove stats data since we're not using the large cards anymore

  return (
    <div className="min-h-screen animated-bg floating-particles relative">
      {/* 3D Background Scene */}
      <div className="fixed inset-0 z-0">
        <SpaceScene cameraRef={cameraRef} controlRef={controlRef} />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <Container className="py-8 space-y-8">
          {/* Hero Section - Compact like original */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6 pt-8"
          >
            {/* Main Heading - "Catch the flow!" style */}
            <AnimatePresence mode="wait">
              {!showSecret && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight text-left">
                    {greeting || "Catch the flow!"}
                  </h1>
                  {/* <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Discover, trade, and create tokens on the most advanced
                    bonding curve DEX
                  </p> */}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Search Section - More prominent like original */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <SearchContainer
              searchMode={searchMode}
              setSearchMode={setSearchMode}
              cameraRef={cameraRef}
              controlRef={controlRef}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setActiveCategory={setCategory}
              onSecretFound={handleSecretFound}
              showSecret={showSecret}
            />
          </motion.div>

          {/* Token Grid - Main focus like original */}
          {!showSecret && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <TokenContainer
                tokens={filteredTokens}
                isLoading={isLoading}
                error={error}
              />
            </motion.div>
          )}

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center py-12"
          >
            <Card className="unified-card max-w-2xl mx-auto">
              <CardContent className="p-8 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    🚀 Ready to Launch?
                  </h3>
                  {/* <p className="text-muted-foreground">
                    Join thousands of creators building the future of
                    decentralized finance
                  </p> */}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="btn-primary group"
                    onClick={() => (window.location.href = "/dex/factory")}
                  >
                    <Rocket className="h-5 w-5 mr-2 group-hover:translate-y-[-2px] transition-transform duration-300" />
                    Launch Now
                  </Button>

                  <Button size="lg" variant="outline" className="btn-secondary">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </div>
    </div>
  );
}
