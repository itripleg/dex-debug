// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [mounted, setMounted] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async (connectorId: number) => {
    try {
      const connector = connectors[connectorId];
      await connect({ connector });
      toast({
        title: "Connected",
        description: "Successfully connected to wallet",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to wallet",
        variant: "destructive",
      });
    }
  };

  return {
    isConnected,
    mounted,
    connectors,
    handleConnect,
  };
}
