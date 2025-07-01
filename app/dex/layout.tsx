// app/dex/layout.tsx
"use client";
import { TokenProvider } from "@/contexts/TokenContext";
import { FactoryConfigProvider } from "@/contexts/FactoryConfigProvider";

export default function DexLayout({ children }: { children: React.ReactNode }) {
  return (
    <FactoryConfigProvider>
      <TokenProvider>{children}</TokenProvider>
    </FactoryConfigProvider>
  );
}
