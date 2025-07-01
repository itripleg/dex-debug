import { SearchContainer } from "./SearchContainer";
import { TokenContainer } from "./tokens/TokenContainer";
import { useTokenList } from "@/hooks/token/useTokenList";

export function TokenNotFound({ address }: { address: string }) {
  const {
    filteredTokens,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setCategory,
    isLoading,
    error,
  } = useTokenList();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-red-500 mb-4">Token not found</h1>
      <p className="mb-4">The token with address {address} was not found.</p>
      <h2 className="text-xl font-semibold mb-2">Search for other tokens:</h2>
      <SearchContainer
        searchMode="token"
        setSearchMode={() => {}}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setActiveCategory={setCategory}
        onSecretFound={() => {}}
        showSecret={false}
      />
      <div className="mt-4">
        <TokenContainer
          tokens={filteredTokens}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
