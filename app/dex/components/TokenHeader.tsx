import React from "react";
import { useTokenContext } from "@/contexts/TokenContext";
import { TokenDebugView } from "./TokenDebugView";
import { TokenHeaderStyled } from "./TokenHeaderStyled";

const DEBUG = false;

interface TokenHeaderProps {
  address: string;
}

export const TokenHeader: React.FC<TokenHeaderProps> = ({ address }) => {
  const context = useTokenContext();
  console.log("Token header context", context);

  return DEBUG ? (
    <TokenDebugView address={address} />
  ) : (
    <TokenHeaderStyled address={address} />
  );
};
