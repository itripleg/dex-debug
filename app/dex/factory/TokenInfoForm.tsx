"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Settings,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Maximize,
  Minimize,
  Square,
} from "lucide-react";
import { isAddress } from "viem";

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fit?: "cover" | "contain" | "fill";
}

interface TokenInfo {
  name: string;
  ticker: string;
  description: string;
  image: File | null;
  imagePosition: ImagePosition;
  burnManager?: `0x${string}`;
}

interface TokenInfoFormProps {
  tokenInfo: TokenInfo;
  onTokenInfoChange: (tokenInfo: TokenInfo) => void;
}

// Constants for better maintainability
const FIT_MODES = {
  cover: { icon: Maximize, label: "Cover" },
  contain: { icon: Minimize, label: "Contain" },
  fill: { icon: Square, label: "Fill" },
} as const;

const POSITION_PRESETS = {
  fill: [
    { name: "No Rotation", values: { rotation: 0 } },
    { name: "45°", values: { rotation: 45 } },
    { name: "90°", values: { rotation: 90 } },
    { name: "180°", values: { rotation: 180 } },
  ],
  default: [
    { name: "Center", values: { x: 0, y: 0, scale: 1, rotation: 0 } },
    { name: "Top", values: { x: 0, y: -30, scale: 1.2, rotation: 0 } },
    { name: "Bottom", values: { x: 0, y: 30, scale: 1.2, rotation: 0 } },
    { name: "Zoom In", values: { x: 0, y: 0, scale: 1.5, rotation: 0 } },
    { name: "Zoom Out", values: { x: 0, y: 0, scale: 0.8, rotation: 0 } },
  ],
} as const;

const ImagePositioningControls: React.FC<{
  imageFile: File | null;
  position: ImagePosition;
  onPositionChange: (position: ImagePosition) => void;
  tokenName?: string;
  tokenSymbol?: string;
  onUploadClick: () => void;
}> = ({
  imageFile,
  position,
  onPositionChange,
  tokenName = "Your Token",
  tokenSymbol = "TOKEN",
  onUploadClick,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [isMouseOverImage, setIsMouseOverImage] = useState(false);
  const cropRef = useRef<HTMLDivElement>(null);
  const currentFit = position.fit || "cover";
  const isInteractive = currentFit !== "fill";

  // Consolidated image URL effect
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Simplified scroll prevention
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isMouseOverImage && isInteractive) e.preventDefault();
    };

    if (isMouseOverImage && isInteractive) {
      document.addEventListener("wheel", handleWheel, { passive: false });
      return () => document.removeEventListener("wheel", handleWheel);
    }
  }, [isMouseOverImage, isInteractive]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isInteractive) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isInteractive]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !cropRef.current || !isInteractive) return;

      const rect = cropRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;
      const adjustedDeltaY = currentFit === "contain" ? -deltaY : deltaY;

      onPositionChange({
        ...position,
        x: Math.max(-100, Math.min(100, position.x + deltaX)),
        y: Math.max(-100, Math.min(100, position.y + adjustedDeltaY)),
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, currentFit, position, onPositionChange, dragStart]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const resetPosition = useCallback(() => {
    onPositionChange({ x: 0, y: 0, scale: 1, rotation: 0, fit: "cover" });
  }, [onPositionChange]);

  const setFitMode = useCallback(
    (fit: "cover" | "contain" | "fill") => {
      onPositionChange({ ...position, fit });
    },
    [position, onPositionChange]
  );

  // Unified image styling function
  const getImageContainerStyle = useCallback(() => {
    const baseStyle = {
      backgroundImage: `url(${previewUrl})`,
      backgroundRepeat: "no-repeat",
      transform: `rotate(${position.rotation}deg)`,
      transformOrigin: "center center",
    };

    if (currentFit === "fill") {
      return {
        ...baseStyle,
        backgroundSize: "100% 100%",
        backgroundPosition: `${50 + position.x}% ${50 + position.y}%`,
      };
    }

    if (currentFit === "contain") {
      return {
        ...baseStyle,
        backgroundSize: `${100 * position.scale}% auto`,
        backgroundPosition: `${50 + position.x}% ${50 + position.y}%`,
      };
    }

    // Cover mode
    return {
      ...baseStyle,
      backgroundSize: `${100 * position.scale}%`,
      backgroundPosition: `${50 + position.x}% ${50 + position.y}%`,
    };
  }, [previewUrl, position, currentFit]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isInteractive) return;
      const delta = e.deltaY * -0.001;
      const newScale = Math.max(0.5, Math.min(3, position.scale + delta));
      onPositionChange({ ...position, scale: newScale });
    },
    [isInteractive, position, onPositionChange]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Position & Crop
        </Label>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(["edit", "preview"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={previewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode(mode)}
                className="rounded-none text-xs px-3 capitalize"
              >
                {mode}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetPosition}
            className="flex items-center gap-1 text-xs bg-transparent"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>

      {previewMode === "edit" ? (
        <div className="space-y-4">
          {/* Fit Mode Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(FIT_MODES).map(([mode, { icon: Icon, label }]) => (
              <Button
                key={mode}
                type="button"
                variant={currentFit === mode ? "default" : "outline"}
                size="sm"
                onClick={() => setFitMode(mode as keyof typeof FIT_MODES)}
                className="text-xs"
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>

          {/* Crop Editor */}
          <div
            ref={cropRef}
            className={`relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-300 ${
              isInteractive ? "cursor-move" : "cursor-default"
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {!previewUrl ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Button onClick={onUploadClick} type="button" className="mb-2">
                  Upload Image
                </Button>
                <p className="text-xs text-gray-400">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            ) : (
              <>
                {/* Grid overlay for cover mode */}
                {currentFit === "cover" && (
                  <div className="absolute inset-0 opacity-20">
                    <div className="grid grid-cols-3 grid-rows-3 h-full">
                      {Array.from({ length: 9 }, (_, i) => (
                        <div key={i} className="border border-white/50" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Image container */}
                <div
                  className="absolute inset-0"
                  style={
                    currentFit === "cover"
                      ? {
                          transform: `translate(${position.x}%, ${position.y}%) scale(${position.scale}) rotate(${position.rotation}deg)`,
                          transformOrigin: "center center",
                          transition: isDragging
                            ? "none"
                            : "transform 0.2s ease-out",
                        }
                      : getImageContainerStyle()
                  }
                  onWheel={handleWheel}
                  onMouseEnter={() => setIsMouseOverImage(true)}
                  onMouseLeave={() => setIsMouseOverImage(false)}
                >
                  {currentFit === "cover" && (
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${previewUrl})` }}
                    />
                  )}
                </div>

                {/* Center point for cover mode */}
                {currentFit === "cover" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-6 h-6 border-2 border-white/70 rounded-full bg-black/30" />
                  </div>
                )}

                {/* Instructions */}
                <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                  {isDragging
                    ? "Dragging..."
                    : currentFit === "fill"
                    ? "Fill mode: Only rotation available"
                    : `${FIT_MODES[currentFit].label} mode: Scroll to zoom, drag to move`}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Token Header Preview */
        <div className="space-y-2">
          <div className="relative overflow-hidden min-h-[200px] rounded-lg border">
            <div className="absolute inset-0 z-0">
              {previewUrl ? (
                <>
                  <div
                    className="absolute inset-0 bg-no-repeat bg-cover bg-center transition-all duration-300"
                    style={getImageContainerStyle()}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <Button onClick={onUploadClick} type="button">
                    Upload Image
                  </Button>
                </div>
              )}
            </div>
            <div className="relative z-10 p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-xs text-gray-300">0x1234...5678</div>
                <Badge className="bg-green-600/70 text-white">Trading</Badge>
              </div>
              <div className="space-y-3">
                <h1 className="text-white text-2xl font-bold flex items-center gap-3">
                  {tokenName}
                  <span className="text-lg text-gray-300">({tokenSymbol})</span>
                </h1>
                <div className="backdrop-blur-sm bg-white/10 p-3 rounded-lg max-w-xs">
                  <div className="text-gray-200 text-sm mb-1">
                    Current Price
                  </div>
                  <p className="text-white text-lg font-semibold">
                    0.001234 <span className="text-gray-300">AVAX</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Preview: How your image will appear in the token header
          </p>
        </div>
      )}

      {previewUrl && (
        <>
          {/* Position Controls */}
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                key: "x",
                label: "Horizontal",
                min: -100,
                max: 100,
                step: 1,
                suffix: "%",
              },
              {
                key: "y",
                label: "Vertical",
                min: -100,
                max: 100,
                step: 1,
                suffix: "%",
              },
              {
                key: "scale",
                label: "Scale",
                min: 0.5,
                max: 3,
                step: 0.1,
                suffix: "x",
              },
              {
                key: "rotation",
                label: "Rotation",
                min: -180,
                max: 180,
                step: 1,
                suffix: "°",
              },
            ].map(({ key, label, min, max, step, suffix }) => {
              const disabled = !isInteractive && key !== "rotation";
              const value = position[key as keyof ImagePosition] as number;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={disabled ? "text-gray-400" : ""}>
                      {label}
                    </span>
                    <span className={disabled ? "text-gray-400" : ""}>
                      {key === "scale" ? value.toFixed(1) : value.toFixed(0)}
                      {suffix}
                    </span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([newValue]) =>
                      onPositionChange({ ...position, [key]: newValue })
                    }
                    min={min}
                    max={max}
                    step={step}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>

          {/* Mode Info */}
          <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p>
              <strong>{FIT_MODES[currentFit].label}</strong> mode:{" "}
              {currentFit === "cover" &&
                "Image fills container, may crop edges."}
              {currentFit === "contain" &&
                "Image fits entirely within container, maintains aspect ratio."}
              {currentFit === "fill" &&
                "Image stretches to fill entire container."}
            </p>
            <p className="text-xs mt-1 text-gray-500">
              {currentFit === "fill"
                ? "Only rotation control is available in Fill mode."
                : "All positioning controls work in this mode."}
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2">
            {(currentFit === "fill"
              ? POSITION_PRESETS.fill
              : POSITION_PRESETS.default
            ).map((preset) => (
              <Button
                key={preset.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onPositionChange({
                    ...position,
                    ...preset.values,
                    fit: currentFit,
                  })
                }
                className="text-xs px-2 py-1"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export function TokenInfoForm({
  tokenInfo,
  onTokenInfoChange,
}: TokenInfoFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [burnManagerError, setBurnManagerError] = useState<string>("");
  const [showImageControls, setShowImageControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tokenInfo.image) {
      setPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(tokenInfo.image);
    setShowImageControls(true);
  }, [tokenInfo.image]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      if (name === "burnManager") {
        if (!value) {
          setBurnManagerError("");
          onTokenInfoChange({ ...tokenInfo, burnManager: undefined });
          return;
        }

        if (!value.startsWith("0x")) {
          setBurnManagerError("Address must start with 0x");
        } else if (!isAddress(value)) {
          setBurnManagerError("Invalid Ethereum address");
        } else {
          setBurnManagerError("");
        }
      }

      onTokenInfoChange({ ...tokenInfo, [name]: value });
    },
    [tokenInfo, onTokenInfoChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onTokenInfoChange({
          ...tokenInfo,
          image: file,
          imagePosition: { x: 0, y: 0, scale: 1, rotation: 0, fit: "cover" },
        });
      }
    },
    [tokenInfo, onTokenInfoChange]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeImage = useCallback(() => {
    onTokenInfoChange({
      ...tokenInfo,
      image: null,
      imagePosition: { x: 0, y: 0, scale: 1, rotation: 0, fit: "cover" },
    });
  }, [tokenInfo, onTokenInfoChange]);

  const handlePositionChange = useCallback(
    (position: ImagePosition) => {
      onTokenInfoChange({ ...tokenInfo, imagePosition: position });
    },
    [tokenInfo, onTokenInfoChange]
  );

  return (
    <div className="space-y-6">
      {/* Basic Token Info */}
      <div className="grid w-full items-center gap-4">
        {[
          {
            id: "name",
            label: "Token Name",
            placeholder: "Enter token name",
            type: "input",
          },
          {
            id: "ticker",
            label: "Ticker",
            placeholder: "Enter ticker symbol",
            type: "input",
          },
          {
            id: "description",
            label: "Token Description",
            placeholder: "Enter token description",
            type: "textarea",
          },
        ].map(({ id, label, placeholder, type }) => (
          <div key={id}>
            <Label htmlFor={id}>{label}</Label>
            {type === "textarea" ? (
              <Textarea
                id={id}
                name={id}
                value={tokenInfo[id as keyof TokenInfo] as string}
                onChange={handleChange}
                placeholder={placeholder}
                rows={4}
                className="resize-none"
              />
            ) : (
              <Input
                id={id}
                name={id}
                value={tokenInfo[id as keyof TokenInfo] as string}
                onChange={handleChange}
                placeholder={placeholder}
              />
            )}
          </div>
        ))}

        <div>
          <Label htmlFor="burnManager">Burn Manager Address (Optional)</Label>
          <Input
            id="burnManager"
            name="burnManager"
            value={tokenInfo.burnManager || ""}
            onChange={handleChange}
            placeholder="0x..."
            className={burnManagerError ? "border-red-500" : ""}
          />
          {burnManagerError && (
            <p className="text-sm text-red-500 mt-1">{burnManagerError}</p>
          )}
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="image">Token Image</Label>
          {tokenInfo.image && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowImageControls(!showImageControls)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {showImageControls ? "Hide" : "Show"} Position Controls
              {showImageControls ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          id="image"
          name="image"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />

        {/* Image Positioning Controls */}
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="p-4">
            <ImagePositioningControls
              imageFile={tokenInfo.image}
              position={tokenInfo.imagePosition}
              onPositionChange={handlePositionChange}
              tokenName={tokenInfo.name || "Your Token"}
              tokenSymbol={tokenInfo.ticker || "TOKEN"}
              onUploadClick={handleUploadClick}
            />
          </CardContent>
        </Card>

        {/* Remove image button if image exists */}
        {tokenInfo.image && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeImage}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Remove Image
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
