// This should be saved as: app/debug/layout.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Home,
  Settings,
  Database,
  Factory,
  Coins,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";

// Import providers
import { FactoryConfigProvider } from "@/contexts/FactoryConfigProvider";
import { TokenProvider } from "@/contexts/TokenContext";
import { TradesProvider } from "@/contexts/TradesContext";

interface DebugLayoutProps {
  children: React.ReactNode;
}

const DEBUG_PAGES = [
  { path: "/debug", title: "Debug Home", icon: Home },
  { path: "/debug/contexts", title: "Contexts", icon: Database },
  { path: "/debug/factory", title: "Factory", icon: Factory },
  { path: "/debug/token", title: "Token", icon: Coins },
];

function DebugLayoutContent({ children }: DebugLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [testToken, setTestToken] = useState("");
  const [isValidToken, setIsValidToken] = useState(true);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { address: userAddress, isConnected } = useAccount();

  // Handle hydration
  useEffect(() => {
    setMounted(true);

    // Get token from URL params
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setTestToken(tokenParam);
      setIsValidToken(isAddress(tokenParam));
    }
  }, [searchParams]);

  const handleTokenChange = (value: string) => {
    setTestToken(value);
    setIsValidToken(!value || isAddress(value));

    // Update URL without page reload
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("token", value);
    } else {
      url.searchParams.delete("token");
    }
    window.history.replaceState({}, "", url.toString());
  };

  const getCurrentPageInfo = () => {
    const currentPage = DEBUG_PAGES.find((page) => page.path === pathname);
    return currentPage || { title: "Debug", icon: Settings };
  };

  const currentPage = getCurrentPageInfo();
  const Icon = currentPage.icon;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-32">
            <Settings className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Debug Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Navigation */}
            <div className="flex items-center gap-4">
              <Link href="/dex">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to DEX
                </Button>
              </Link>

              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">Debug</span>
                {pathname !== "/debug" && (
                  <>
                    <span>/</span>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium text-foreground">
                      {currentPage.title}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Status */}
            <div className="flex items-center gap-3">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>

              {isValidToken && testToken && (
                <Badge variant="outline" className="font-mono text-xs">
                  {testToken.slice(0, 6)}...{testToken.slice(-4)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-1">
            {DEBUG_PAGES.map((page) => {
              const PageIcon = page.icon;
              const isActive = pathname === page.path;
              const href = testToken
                ? `${page.path}?token=${encodeURIComponent(testToken)}`
                : page.path;

              return (
                <Link key={page.path} href={href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 rounded-none border-b-2 ${
                      isActive
                        ? "border-primary bg-background"
                        : "border-transparent hover:border-muted-foreground/20"
                    }`}
                  >
                    <PageIcon className="h-4 w-4" />
                    {page.title}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Global Token Input (only show on non-home pages) */}
      {pathname !== "/debug" && (
        <div className="border-b bg-muted/10">
          <div className="container mx-auto px-6 py-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Test Token Address
                      </span>
                      {isValidToken ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : testToken ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>

                    <Input
                      value={testToken}
                      onChange={(e) => handleTokenChange(e.target.value)}
                      placeholder="Enter token address for testing (0x...)"
                      className={`${
                        !isValidToken && testToken ? "border-red-500" : ""
                      }`}
                    />

                    {!isValidToken && testToken && (
                      <p className="text-red-500 text-xs mt-1">
                        Invalid address format
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      <strong>User:</strong>{" "}
                      {userAddress ? `${userAddress.slice(0, 6)}...` : "None"}
                    </div>
                    <div>
                      <strong>Network:</strong> testnet
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">{children}</main>

      {/* Debug Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>🔧 Debug Environment</span>
              {testToken && (
                <span className="font-mono">Testing: {testToken}</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span>
                Factory:{" "}
                {process.env.NEXT_PUBLIC_TESTNET_FACTORY_ADDRESS?.slice(0, 8)}
                ...
              </span>
              <span>Network: testnet</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Main layout component with providers
export default function DebugLayout({ children }: DebugLayoutProps) {
  return (
    <FactoryConfigProvider>
      <TokenProvider>
        <TradesProvider>
          <DebugLayoutContent>{children}</DebugLayoutContent>
        </TradesProvider>
      </TokenProvider>
    </FactoryConfigProvider>
  );
}
