"use client";
import React from "react";
import TokenPage from "../components/TokenPage";
import { TokenProvider } from "@/contexts/TokenContext";
import { useParams } from "next/navigation";
import { useFactoryConfigContext } from "@/contexts/FactoryConfigProvider";

type Props = {};

function PageWrapper({}: Props) {
  const { tokenAddress } = useParams();
  const { config, isLoading } = useFactoryConfigContext();

  if (isLoading) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="text-center">Loading factory configuration...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="text-center text-red-500">
          Failed to load factory configuration. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div>
      <TokenProvider>
        <TokenPage tokenAddress={tokenAddress as string} />
      </TokenProvider>
    </div>
  );
}

export default PageWrapper;
