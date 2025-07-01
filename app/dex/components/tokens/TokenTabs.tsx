// components/tokens/TokenTabs.tsx
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TokenTabsProps {
  onCategoryChange: (category: string) => void;
}

export const TokenTabs = ({ onCategoryChange }: TokenTabsProps) => (
  <Tabs defaultValue="all" className="mb-8">
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="all" onClick={() => onCategoryChange("all")}>
        We
      </TabsTrigger>
      <TabsTrigger value="all" onClick={() => onCategoryChange("all")}>
        All
      </TabsTrigger>
      <TabsTrigger value="all" onClick={() => onCategoryChange("all")}>
        Gone
      </TabsTrigger>
      <TabsTrigger value="all" onClick={() => onCategoryChange("all")}>
        Makeit
      </TabsTrigger>
    </TabsList>
  </Tabs>
);
