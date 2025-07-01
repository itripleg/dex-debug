"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import { AddressComponent } from "@/components/AddressComponent";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";

export function BuyTokenForm({ onAmountChange, maxAmount }: any) {
  const pathname = usePathname();
  const tokenAddress = pathname.split("/").pop() || "";

  const [amount, setAmount] = useState("");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [receiptDetails, setReceiptDetails] = useState<{
    pricePaid?: string;
    tokensReceived?: string;
  }>({});

  const { toast } = useToast();

  const {
    data: transactionData,
    error,
    isPending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, data: receipt } =
    useWaitForTransactionReceipt({
      hash: transactionData,
    });

  // Helper function to extract revert reason
  const extractRevertReason = (error: any): string => {
    if (!error) return "Unknown error";

    const errorMessage = error.message || error.toString();
    console.log("Full error object:", error);
    console.log("Error message:", errorMessage);

    // Extract revert reason from different error formats
    if (errorMessage.includes("execution reverted:")) {
      const match = errorMessage.match(/execution reverted: (.+)/);
      return match ? match[1] : "Transaction reverted";
    }

    if (errorMessage.includes("revert")) {
      const match = errorMessage.match(/revert (.+)/);
      return match ? match[1] : "Transaction reverted";
    }

    // Check for specific contract errors
    if (errorMessage.includes("Invalid amount")) {
      return "Invalid purchase amount - check min/max limits";
    }

    if (errorMessage.includes("Max supply")) {
      return "Transaction would exceed maximum token supply";
    }

    if (errorMessage.includes("Exceeds max wallet")) {
      return "Purchase would exceed maximum wallet percentage (5%)";
    }

    if (errorMessage.includes("Not trading")) {
      return "Token is not currently trading";
    }

    // Check for gas/value issues
    if (errorMessage.includes("insufficient funds")) {
      return "Insufficient AVAX balance for this purchase";
    }

    if (
      errorMessage.includes("gas required exceeds allowance") ||
      errorMessage.includes("intrinsic gas too low")
    ) {
      return "Transaction would fail - check AVAX balance and purchase amount";
    }

    // Return simplified error message
    return errorMessage.split("\n")[0] || "Transaction failed";
  };

  // Clear error when amount changes
  useEffect(() => {
    setErrorDetails(null);
  }, [amount]);

  // Handle errors
  useEffect(() => {
    if (error) {
      const revertReason = extractRevertReason(error);
      setErrorDetails(revertReason);
      toast({
        title: "Transaction Failed",
        description: revertReason,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenAddress) {
      toast({
        title: "Error",
        description: "Token address is not available.",
        variant: "destructive",
      });
      return;
    }

    try {
      setErrorDetails(null);

      writeContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "buy",
        args: [tokenAddress],
        value: parseEther(amount || "1"),
      });

      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
      });
    } catch (error) {
      console.error("Error:", error);
      const revertReason = extractRevertReason(error);
      setErrorDetails(revertReason);
      toast({
        title: "Error",
        description: revertReason,
        variant: "destructive",
      });
    }
  };

  const [hasHandledReceipt, setHasHandledReceipt] = useState(false);

  useEffect(() => {
    if (receipt && !hasHandledReceipt) {
      const pricePaid = amount;
      const tokensReceivedLog = receipt.logs?.find(
        (log: any) =>
          log.topics[0] ===
          "0x377aadedb6b2a771959584d10a6a36eccb5f56b4eb3a48525f76108d2660d8d4"
      );

      if (tokensReceivedLog) {
        const tokensReceived = BigInt(tokensReceivedLog.data).toString();
        setReceiptDetails({
          pricePaid,
          tokensReceived,
        });

        setErrorDetails(null);
        toast({
          title: "Purchase Confirmed",
          description: `You purchased ${(Number(tokensReceived) / 1e18).toFixed(
            2
          )} tokens for ${pricePaid} AVAX.`,
        });

        setHasHandledReceipt(true);
      }
    }
  }, [receipt, hasHandledReceipt, amount, toast]);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="amount">Amount (AVAX)</Label>
              <span
                className="text-sm text-muted-foreground cursor-pointer hover:text-primary"
                onClick={() => {
                  setAmount(maxAmount);
                  onAmountChange(maxAmount);
                }}
              >
                Max
              </span>
            </div>
            <Input
              id="amount"
              onScroll={(e) => e.stopPropagation()}
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                onAmountChange(e.target.value);
              }}
              onWheel={(e) => e.currentTarget.blur()}
              className="text-center pr-2 dark:bg-black/80"
            />
          </div>
        </div>
        <Button
          type="submit"
          className="mt-4 w-full"
          disabled={isPending || !tokenAddress}
        >
          {isPending ? "Processing..." : "Buy Tokens"}
        </Button>

        {isConfirming && (
          <div className="mt-2 text-center">Waiting for confirmation...</div>
        )}

        {/* Enhanced Error Display */}
        {errorDetails && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-600 dark:text-red-400 font-medium text-sm">
              Error Details:
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              {errorDetails}
            </p>
          </div>
        )}

        {receiptDetails.tokensReceived && (
          <div className="mt-4">
            <p className="font-semibold">Transaction Receipt:</p>
            <ul className="mt-2 space-y-1">
              <li>Price Paid: {receiptDetails.pricePaid} AVAX</li>
              <li>
                Tokens Received:{" "}
                {(Number(receiptDetails.tokensReceived) / 1e18).toFixed(2)}
              </li>
              <li className="flex items-center">
                Transaction:{" "}
                <AddressComponent hash={`${transactionData}`} type="tx" />
              </li>
            </ul>
          </div>
        )}
      </form>
    </>
  );
}
