"use client";
import React, { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/craft";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

import FAUCET_ABI from "@/contracts/nu-nu/Faucet_abi.json";
const FAUCET_ADDRESS = "0x0B50C987D357a8000FCD88f7eC6D35A88775AfD2";

const FaucetAdmin = () => {
  const { address } = useAccount();
  const { toast } = useToast();
  const [newAmount, setNewAmount] = useState("");
  const [newInterval, setNewInterval] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [batchAddresses, setBatchAddresses] = useState("");
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const { writeContract, data: hash } = useWriteContract();

  // Read contract data
  const { data: ownerAddress } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "owner",
  });

  const isOwner = ownerAddress === address;

  const { data: currentAmount } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "dripAmount",
  });

  const { data: currentInterval } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "dripInterval",
  });

  // Transaction receipt handling
  const { isLoading: isPending } = useWaitForTransactionReceipt({
    hash,
  });

  // Reset form fields after successful transaction
  useEffect(() => {
    if (!isPending && hash) {
      toast({
        title: "Success",
        description: "Transaction completed successfully",
      });

      // Reset relevant form field based on the transaction type
      if (hash) {
        setNewAmount("");
        setNewInterval("");
        setNewAddress("");
        setBatchAddresses("");
      }
    }
  }, [isPending, hash, toast]);

  // Transaction handlers
  const handleSetAmount = () => {
    if (!newAmount) return;
    try {
      const amount = parseEther(newAmount);
      writeContract({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: "setDripAmount",
        args: [amount],
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid amount format",
        variant: "destructive",
      });
    }
  };

  const handleSetInterval = () => {
    if (!newInterval) return;
    const blocks = (parseInt(newInterval) * 3600) / 2;
    writeContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "setDripInterval",
      args: [BigInt(blocks)],
    });
  };

  const handleUpdateWhitelist = (add: boolean) => {
    if (!newAddress) return;
    writeContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "updateWhitelist",
      args: [newAddress as `0x${string}`, add],
    });
  };

  const handleBatchWhitelist = (add: boolean) => {
    if (!batchAddresses) return;
    const addresses = batchAddresses
      .split("\n")
      .map((addr) => addr.trim())
      .filter(Boolean) as `0x${string}`[];

    writeContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "batchUpdateWhitelist",
      args: [addresses, add],
    });
  };

  const handleWithdraw = () => {
    writeContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "withdrawAll",
    });
  };

  // Handle hydration
  if (!mounted) {
    return null;
  }

  if (!isOwner) {
    return (
      <Container className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You must be the contract owner to access this panel
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Faucet Administration
          </CardTitle>
          <CardDescription>
            Manage faucet settings and whitelist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drip Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Drip Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Current Amount:{" "}
                  {currentAmount ? formatEther(currentAmount as bigint) : "0"}{" "}
                  AVAX
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="New amount in AVAX"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                  <Button onClick={handleSetAmount} disabled={isPending}>
                    Update
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Current Interval:{" "}
                  {currentInterval ? (Number(currentInterval) * 2) / 3600 : "0"}{" "}
                  hours
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="New interval in hours"
                    value={newInterval}
                    onChange={(e) => setNewInterval(e.target.value)}
                  />
                  <Button onClick={handleSetInterval} disabled={isPending}>
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Whitelist Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Whitelist Management</h3>

            <div className="space-y-2">
              <Label>Add/Remove Single Address</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Address (0x...)"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
                <Button
                  onClick={() => handleUpdateWhitelist(true)}
                  disabled={isPending}
                  variant="secondary"
                >
                  Add
                </Button>
                <Button
                  onClick={() => handleUpdateWhitelist(false)}
                  disabled={isPending}
                  variant="destructive"
                >
                  Remove
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Add/Remove Batch Addresses</Label>
              <div className="flex gap-2 flex-col">
                <Input
                  placeholder="Enter addresses, one per line"
                  value={batchAddresses}
                  onChange={(e) => setBatchAddresses(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBatchWhitelist(true)}
                    disabled={isPending}
                    variant="secondary"
                  >
                    Add Batch
                  </Button>
                  <Button
                    onClick={() => handleBatchWhitelist(false)}
                    disabled={isPending}
                    variant="destructive"
                  >
                    Remove Batch
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Withdraw Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Withdraw Funds</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleWithdraw}
                disabled={isPending}
                variant="destructive"
              >
                Withdraw All Funds
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
};

export default FaucetAdmin;
