import React, { useEffect, useState, useRef, useCallback, FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AddressComponent } from "@/components/AddressComponent";
import { Progress } from "@/components/ui/progress";
import { useToken } from "@/contexts/TokenContext";
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { Address, formatEther } from "viem";
import { useAccount } from "wagmi";
import { useImagePosition } from "@/hooks/useImagePosition";
import {
  Edit3,
  Save,
  X,
  RotateCcw,
  Crown,
  Maximize,
  Minimize,
  Square,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Type Definitions ---
interface TokenHeaderProps {
  address: string;
}

interface StateDisplay {
  text: string;
  color: string;
}

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fit?: "cover" | "contain" | "fill";
}

// --- Constants ---
const FIT_MODES = {
  cover: { icon: Maximize, label: "Cover" },
  contain: { icon: Minimize, label: "Contain" },
  fill: { icon: Square, label: "Fill" },
} as const;

const SLIDER_CONTROLS = [
  { key: "x", label: "Horizontal", min: -100, max: 100, step: 1, suffix: "%" },
  { key: "y", label: "Vertical", min: -100, max: 100, step: 1, suffix: "%" },
  { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.1, suffix: "x" },
  {
    key: "rotation",
    label: "Rotation",
    min: -180,
    max: 180,
    step: 1,
    suffix: "°",
  },
];

// --- Main Component ---
export const TokenHeaderStyled: FC<TokenHeaderProps> = ({ address }) => {
  // --- State and Refs ---
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState<ImagePosition>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    fit: "cover",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // --- Hooks ---
  const { address: userAddress } = useAccount();
  const { updatePosition, isUpdating } = useImagePosition();
  const { token, loading } = useToken(address);
  const { useTokenState } = useFactoryContract();
  const { data: state } = useTokenState(address as Address);

  const isCreator =
    userAddress &&
    token?.creator &&
    userAddress.toLowerCase() === token.creator.toLowerCase();

  // --- Effects ---
  useEffect(() => {
    if (token?.imagePosition) {
      setPosition(token.imagePosition);
    }
  }, [token?.imagePosition]);

  // --- Callbacks for Editing Actions ---
  const savePosition = useCallback(async () => {
    if (!token?.address || !userAddress) return;
    const success = await updatePosition(token.address, position, userAddress);
    if (success) {
      setIsEditing(false);
    }
  }, [token?.address, userAddress, position, updatePosition]);

  const cancelEdit = useCallback(() => {
    setPosition(
      token?.imagePosition || {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        fit: "cover",
      }
    );
    setIsEditing(false);
  }, [token?.imagePosition]);

  const resetPosition = useCallback(() => {
    setPosition((prev) => ({ ...prev, x: 0, y: 0, scale: 1, rotation: 0 }));
  }, []);

  const setFitMode = useCallback((fit: keyof typeof FIT_MODES) => {
    setPosition((prev) => ({
      ...prev,
      fit,
      x: 0,
      y: 0,
      scale: 1,
    }));
  }, []);

  // --- Callbacks for Interactive Positioning ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (position.fit === "fill" || !isEditing) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [position.fit, isEditing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !imageContainerRef.current || position.fit === "fill")
        return;
      e.preventDefault();
      const rect = imageContainerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;
      setPosition((prev) => ({
        ...prev,
        x: Math.max(-100, Math.min(100, prev.x + deltaX)),
        y: Math.max(-100, Math.min(100, prev.y + deltaY)),
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, position.fit]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // --- Scroll Lock Effect ---
  useEffect(() => {
    const container = imageContainerRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (position.fit === "fill") return;
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      setPosition((prev) => ({
        ...prev,
        scale: Math.max(0.5, Math.min(3, prev.scale + delta)),
      }));
    };

    if (isEditing && container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [isEditing, position.fit]); // Re-attach listener if fit mode changes while editing

  // --- Style Generation ---
  const getBackgroundStyle = useCallback(() => {
    if (!token?.imageUrl) return {};
    const { x, y, scale, rotation, fit = "cover" } = position;
    const baseStyle = {
      backgroundImage: `url(${token.imageUrl})`,
      backgroundRepeat: "no-repeat",
      transform: `rotate(${rotation}deg)`,
      transformOrigin: "center center",
      transition: isDragging
        ? "none"
        : "transform 0.2s ease-out, background-position 0.2s ease-out, background-size 0.2s ease-out",
    };

    if (fit === "fill") {
      return {
        ...baseStyle,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
      };
    }

    return {
      ...baseStyle,
      backgroundSize: `${100 * scale}% auto`,
      backgroundPosition: `${50 + x}% ${50 + y}%`,
    };
  }, [token?.imageUrl, position, isDragging]);

  // --- Render Logic ---
  if (loading || !token) {
    return (
      <Card className="min-h-[300px] flex items-center justify-center">
        <div className="p-8 text-gray-400">Loading token data...</div>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Card className="relative overflow-hidden min-h-[300px]">
        {isEditing ? (
          /* --- EDITING MODE RENDER --- */
          <div
            ref={imageContainerRef}
            className="absolute inset-0 z-10"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: position.fit !== "fill" ? "move" : "default" }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={getBackgroundStyle()}
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
              <div className="w-px h-8 bg-white" />
              <div className="w-8 h-px bg-white absolute" />
            </div>
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={cancelEdit}
                    className="bg-red-500/80 border-red-400 text-white hover:bg-red-600 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancel</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={savePosition}
                    disabled={isUpdating}
                    className="bg-green-500/80 border-green-400 text-white hover:bg-green-600 h-8 w-8"
                  >
                    {isUpdating ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save Position</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-4 left-4 right-4 z-20"
            >
              <div className="bg-black/80 backdrop-blur-md rounded-lg p-4 border border-white/20 space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">
                    Image Controls
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetPosition}
                    className="text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" /> Reset
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(FIT_MODES).map(
                    ([mode, { icon: Icon, label }]) => (
                      <Button
                        key={mode}
                        variant={
                          (position.fit || "cover") === mode
                            ? "secondary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setFitMode(mode as keyof typeof FIT_MODES)
                        }
                        className="text-xs"
                      >
                        <Icon className="h-3 w-3 mr-1" /> {label}
                      </Button>
                    )
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {SLIDER_CONTROLS.map(
                    ({ key, label, min, max, step, suffix }) => {
                      const disabled =
                        position.fit === "fill" && key !== "rotation";
                      const value = position[
                        key as keyof ImagePosition
                      ] as number;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs text-white mb-1">
                            <span className={disabled ? "text-gray-500" : ""}>
                              {label}
                            </span>
                            <span className={disabled ? "text-gray-500" : ""}>
                              {key === "scale"
                                ? value.toFixed(1)
                                : value.toFixed(0)}
                              {suffix}
                            </span>
                          </div>
                          <Slider
                            value={[value]}
                            onValueChange={([val]) =>
                              setPosition((p) => ({ ...p, [key]: val }))
                            }
                            min={min}
                            max={max}
                            step={step}
                            disabled={disabled}
                          />
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* --- DISPLAY MODE RENDER --- */
          <>
            <div className="absolute inset-0 z-0">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={getBackgroundStyle()}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[300px] p-4">
              <div className="flex justify-between items-start">
                <AddressComponent hash={address} type="address" />
                <div className="flex items-center gap-2">
                  <TokenStatusBadge state={state as number} />
                  {isCreator ? (
                    <div className="flex items-center gap-2">
                      {token?.imageUrl && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setIsEditing(true)}
                              className="bg-black/50 border-white/30 text-white hover:bg-black/70 h-8 w-8"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit photo position</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1.5 bg-yellow-500/20 border border-yellow-400/30 rounded-md">
                            <Crown className="h-4 w-4 text-yellow-400" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>You are the creator</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    token?.creator && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1.5 bg-gray-500/20 border border-gray-400/30 rounded-md">
                            <User className="h-4 w-4 text-gray-300" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Created by: {token.creator}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  )}
                </div>
              </div>
              <TokenInfoDisplay token={token} />
            </div>
          </>
        )}
      </Card>
    </TooltipProvider>
  );
};

/* --- Sub-components for cleaner render logic --- */
const TokenStatusBadge: FC<{ state: number | undefined }> = ({ state }) => {
  const stateMap: Record<number, StateDisplay> = {
    0: { text: "Not Created", color: "bg-red-500/80" },
    1: { text: "Trading", color: "bg-green-600/70" },
    2: { text: "Goal Reached", color: "bg-yellow-500/80" },
    3: { text: "Halted", color: "bg-red-500/80" },
    4: { text: "Resumed", color: "bg-green-600/70" },
  };
  const display = stateMap[state as number] || {
    text: "Unknown",
    color: "bg-gray-500/80",
  };
  return (
    <Badge
      className={`${display.color} text-white px-3 py-1`}
      variant="outline"
    >
      {display.text}
    </Badge>
  );
};

const TokenInfoDisplay: FC<{ token: any }> = ({ token }) => {
  const { useCollateral, useCurrentPrice } = useFactoryContract();
  const { data: rawCollateral } = useCollateral(token.address as Address);
  const { data: rawCurrentPrice } = useCurrentPrice(token.address as Address);
  const [progress, setProgress] = useState(0);
  const formattedCollateral = rawCollateral
    ? formatTokenPrice(formatEther(rawCollateral))
    : "0.000000";
  const formattedCurrentPrice = rawCurrentPrice
    ? formatTokenPrice(formatEther(rawCurrentPrice))
    : "0.000000";
  const formattedFundingGoal = token.fundingGoal
    ? formatTokenPrice(token.fundingGoal)
    : "0.000000";

  useEffect(() => {
    if (token.fundingGoal && rawCollateral) {
      const goalAmount = parseFloat(token.fundingGoal);
      const collateralAmount = parseFloat(formatEther(rawCollateral));
      const percentage =
        goalAmount > 0 ? (collateralAmount / goalAmount) * 100 : 0;
      setProgress(Math.min(percentage, 100));
    }
  }, [token.fundingGoal, rawCollateral]);

  return (
    <div className="space-y-4">
      <CardHeader className="p-0">
        <CardTitle className="text-white text-3xl font-bold flex items-center gap-4">
          {token.name}
          {token.symbol && (
            <span className="text-2xl text-gray-300">({token.symbol})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
            <Label className="text-gray-200">Current Price</Label>
            <p className="text-white text-lg font-semibold">
              {formattedCurrentPrice}{" "}
              <span className="text-gray-300">AVAX</span>
            </p>
          </div>
        </div>
        {token.fundingGoal && token.fundingGoal !== "0" && (
          <div className="mt-6 backdrop-blur-sm bg-white/10 p-4 rounded-lg">
            <Label className="text-gray-200 mb-2 block">Funding Progress</Label>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-white text-sm font-semibold">
              {progress.toFixed(2)}% - {formattedCollateral} /{" "}
              {formattedFundingGoal} AVAX
            </p>
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default TokenHeaderStyled;
