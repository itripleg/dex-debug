// TokenomicsForm.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TokenomicsFormProps {
  tokenomics: {
    fundingGoal: number;
    maxSupply?: number;
    initialSupply?: number;
    bondingCurve?: string;
    liquidityPool?: string;
  };
  onTokenomicsChange?: (tokenomics: TokenomicsFormProps["tokenomics"]) => void;
}

export function TokenomicsForm({
  tokenomics,
  onTokenomicsChange,
}: TokenomicsFormProps) {
  const handleChange = (field: string, value: string) => {
    if (onTokenomicsChange) {
      onTokenomicsChange({ ...tokenomics, [field]: value });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="fundingGoal">Funding Goal (AVAX)</Label>
        <Input id="fundingGoal" value={tokenomics.fundingGoal} disabled />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="maxSupply">Max Supply</Label>
        <Input id="maxSupply" value={tokenomics.maxSupply || ""} disabled />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="initialSupply">Initial Supply</Label>
        <Input
          id="initialSupply"
          value={tokenomics.initialSupply || ""}
          disabled
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="bondingCurve">Bonding Curve Type</Label>
        <Select
          value={tokenomics.bondingCurve}
          onValueChange={(value) => handleChange("bondingCurve", value)}
          disabled
        >
          <SelectTrigger id="bondingCurve">
            <SelectValue placeholder="Select bonding curve type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="exponential">Exponential</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="liquidityPool">Liquidity Pool Target</Label>
        <Select
          value={tokenomics.liquidityPool}
          onValueChange={(value) => handleChange("liquidityPool", value)}
          disabled
        >
          <SelectTrigger id="liquidityPool">
            <SelectValue placeholder="Select liquidity pool" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uniswap">Uniswap</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
