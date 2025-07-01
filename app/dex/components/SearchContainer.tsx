// src/pages/dex/components/SearchContainer.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { moveCamPosition } from "@/hooks/CamTools";
import { TokenSearch } from "./tokens/TokenSearch";
import { CameraSearch } from "./CameraSearch";
import { OuijaSearch } from "./OuijaSearch";
import { TokenPriceCategory } from "@/hooks/token/useTokenList";
import { motion } from "framer-motion";

interface SearchContainerProps {
  searchMode: string;
  setSearchMode: (mode: string) => void;
  cameraRef?: React.RefObject<any>;
  controlRef?: React.RefObject<any>;
  searchQuery: string;
  setSearchQuery: (query: TokenPriceCategory) => void;
  setActiveCategory: (category: TokenPriceCategory) => void;
  onSecretFound: () => void;
  showSecret: boolean;
}

export const SearchContainer = ({
  searchMode,
  setSearchMode,
  cameraRef,
  controlRef,
  searchQuery,
  setSearchQuery,
  setActiveCategory,
  onSecretFound,
  showSecret,
}: SearchContainerProps) => {
  const handleSearchModeChange = () => {
    if (searchMode === "token") {
      setSearchMode("camera");
    } else if (searchMode === "camera") {
      setSearchMode("ouija");
    } else {
      setSearchMode("token");
      moveCamPosition({ cameraRef, x: 0, y: 0, z: -7, scale: 1 });
      if (controlRef?.current) {
        controlRef.current.autoRotateSpeed = 1;
      }
    }
  };

  const handleOuijaInput = (key: string) => {
    if (key === "submit") {
      // Handle submission
      return;
    }
    if (key === "clear") {
      // Handle clear
      return;
    }
    console.log("Ouija key pressed:", key);
  };

  return (
    <div>
      <motion.div
        className="z-30 flex gap-2 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button className="z-60" onClick={handleSearchModeChange}>
          {searchMode === "token"
            ? "👀"
            : searchMode === "camera"
            ? "🔮"
            : "🔎"}
        </Button>
        {searchMode === "camera" && (
          <Button
            className="z-60"
            onClick={() => {
              moveCamPosition({ cameraRef, x: 0, y: 0, z: -7, scale: 1 });
              if (controlRef?.current) {
                controlRef.current.autoRotateSpeed = 1;
              }
            }}
          >
            Default
          </Button>
        )}
      </motion.div>

      {searchMode === "camera" ? (
        <CameraSearch
          cameraRef={cameraRef}
          onSecretFound={onSecretFound}
          showSecret={showSecret}
        />
      ) : searchMode === "ouija" ? (
        <div className="">
          <OuijaSearch onOuijaInput={handleOuijaInput} />
        </div>
      ) : (
        // <div>Token Search</div>
        <TokenSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setActiveCategory={setActiveCategory}
        />
      )}
    </div>
  );
};
