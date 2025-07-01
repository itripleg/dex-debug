"use client";

import { Container } from "@/components/craft";
import { TokensCreated } from "./TokensCreated";
import { CoinTransactions } from "./CoinTransactions";
// import { HoldingsOverview } from "./HoldingsOverview";
// import { BundledTokensMap } from "./BundledTokensMap";
import { AuthWrapper } from "@/components/AuthWrapper";
import TokenBalanceLookup from "./TokenBalanceLookup";
// import BalanceOverview from "./components/BalanceOverview";
// import { BudgetManager } from "./components/BudgetManager";

export default function Dashboard() {
  return (
    <AuthWrapper>
      <Container className="lg:pt-20 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <TokenBalanceLookup />
        </div>
        <TokensCreated />
        <CoinTransactions />
        {/* <UserTrades /> */}
        {/* <HoldingsOverview /> */}
        {/* <BundledTokensMap /> */}
      </Container>
    </AuthWrapper>
  );
}
