// Fix for app/dex/factory/page.tsx

"use client";

import { useState, useEffect } from "react";
import { storage } from "@/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/craft";
import { TokenInfoForm } from "./TokenInfoForm";
import { TokenomicsForm } from "./TokenomicsForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { zeroAddress } from "viem";
import { useToast } from "@/hooks/use-toast";
import { AddressComponent } from "@/components/AddressComponent";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

import { TokenCreationInfo, DEFAULT_IMAGE_POSITION } from "@/types";
import {
  Rocket,
  Sparkles,
  Zap,
  Star,
  Upload,
  CheckCircle,
  ArrowRight,
  Coins,
  Flame,
  Target,
  Trophy,
  Wand2,
  Users,
  TrendingUp,
  Lightbulb,
  Wand,
  Crown,
} from "lucide-react";

function Page() {
  const [mounted, setMounted] = useState(false);

  // ✅ Use TokenCreationInfo instead of TokenInfo
  const [tokenInfo, setTokenInfo] = useState<TokenCreationInfo>({
    name: "",
    ticker: "",
    description: "",
    image: null,
    imagePosition: DEFAULT_IMAGE_POSITION, // Use the default from types
    burnManager: undefined,
  });

  const [tokenomics, setTokenomics] = useState({
    fundingGoal: 5,
    maxSupply: 1000000000,
    initialSupply: 200000000,
    bondingCurve: "linear",
    liquidityPool: "uniswap",
  });

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Handle image preview
  useEffect(() => {
    if (tokenInfo.image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(tokenInfo.image);
    } else {
      setBackgroundImage(null);
    }
  }, [tokenInfo.image]);

  // Simple upload function that returns URL
  const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `temp-uploads/${Date.now()}-${file.name}`);
    const uploadTask = await uploadBytes(storageRef, file);
    return await getDownloadURL(uploadTask.ref);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mounted) return;

    try {
      setIsCreating(true);
      setUploadingImage(true);
      let imageUrl = "";

      if (tokenInfo.image) {
        try {
          imageUrl = await uploadImage(tokenInfo.image);
          toast({
            title: "📸 Image uploaded!",
            description: "Your token image is ready for launch",
          });
        } catch (error) {
          console.error("Error uploading image:", error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      setUploadingImage(false);

      toast({
        title: "🚀 Launching Token...",
        description: "Prepare for takeoff! Your token is being created.",
      });

      writeContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "createToken",
        args: [
          tokenInfo.name,
          tokenInfo.ticker,
          imageUrl,
          tokenInfo.burnManager || zeroAddress,
        ],
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Launch Failed",
        description: "Failed to create token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
      setUploadingImage(false);
    }
  };

  // Handle successful transaction
  useEffect(() => {
    if (receipt && !isConfirming) {
      toast({
        title: "🎉 Token Created Successfully!",
        description: "Your token is now live and ready for trading!",
      });
    }
  }, [receipt, isConfirming, toast]);

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    let completed = 0;
    if (tokenInfo.name) completed += 25;
    if (tokenInfo.ticker) completed += 25;
    if (tokenInfo.description) completed += 25;
    if (tokenInfo.image) completed += 25;
    return completed;
  };

  const isFormValid =
    tokenInfo.name && tokenInfo.ticker && tokenInfo.description;

  // Handle hydration
  if (!mounted) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <div className="relative z-10 container mx-auto p-6 pt-24">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Rocket className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
              <p className="text-white text-lg">Loading Token Factory...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg floating-particles">
      {/* Dynamic Background */}
      {backgroundImage && (
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black/70 to-blue-900/50" />
        </div>
      )}

      <div className="relative z-10">
        <Container className="py-8">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="space-y-6 hidden">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="flex items-center justify-center gap-4"
              >
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
                  <Rocket className="h-12 w-12 text-purple-400" />
                </div>
                <h1 className="text-6xl font-bold text-gradient bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Token Factory
                </h1>
                <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30">
                  <Sparkles className="h-12 w-12 text-blue-400 animate-pulse" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <p className="text-2xl text-gray-300 font-medium">
                  ✨ Create the next big thing in DeFi ✨
                </p>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  Launch your token with bonding curves, liquidity automation,
                  and instant trading
                </p>
              </motion.div>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-8 text-sm"
              >
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Instant Launch</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                  <Zap className="h-4 w-4" />
                  <span>Auto Liquidity</span>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <Crown className="h-4 w-4" />
                  <span>No Code Required</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="unified-card border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-400" />
                    <span className="text-white font-medium text-4xl">
                      Token Factory
                    </span>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {getCompletionPercentage()}% Complete
                  </Badge>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${getCompletionPercentage()}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="token-info" className="space-y-8">
                <TabsList className="glass-card p-2 border border-border/50 w-full">
                  <TabsTrigger
                    value="token-info"
                    className="flex items-center gap-2 flex-1"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Token Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="tokenomics"
                    className="flex items-center gap-2 flex-1"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Economics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="token-info">
                  <Card className="unified-card">
                    <CardHeader className="text-center">
                      <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                        <Wand2 className="h-6 w-6 text-purple-400" />
                        Token Information
                      </CardTitle>
                      <CardDescription>
                        Give your token personality and make it unforgettable
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* ✅ This will now work correctly with TokenCreationInfo */}
                      <TokenInfoForm
                        tokenInfo={tokenInfo}
                        onTokenInfoChange={setTokenInfo}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tokenomics">
                  <Card className="unified-card">
                    <CardHeader className="text-center">
                      <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                        <Coins className="h-6 w-6 text-yellow-400" />
                        Tokenomics
                      </CardTitle>
                      <CardDescription>
                        Configure your token's economic foundation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TokenomicsForm tokenomics={tokenomics} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Launch Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-12"
              >
                <Card className="unified-card border-purple-500/20 bg-purple-500/5">
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="space-y-3">
                      <motion.div
                        animate={{ rotate: isCreating ? 360 : 0 }}
                        transition={{
                          duration: 2,
                          repeat: isCreating ? Infinity : 0,
                        }}
                      >
                        <Rocket className="h-16 w-16 text-purple-400 mx-auto" />
                      </motion.div>

                      <h3 className="text-3xl font-bold text-gradient">
                        {isCreating ? "🚀 Launching..." : "Ready for Launch?"}
                      </h3>

                      {!isFormValid ? (
                        <p className="text-gray-400">
                          Complete the form above to launch your token
                        </p>
                      ) : (
                        <p className="text-green-400 flex items-center justify-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          All systems go! Ready to launch
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={
                        !isFormValid ||
                        isPending ||
                        uploadingImage ||
                        isConfirming ||
                        isCreating
                      }
                      className={`
                        px-12 py-6 text-xl font-bold rounded-2xl transition-all duration-500 group
                        ${
                          isFormValid && !isCreating
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/25 hover:scale-105 border-2 border-purple-500/30"
                            : "bg-gray-700 text-gray-400 cursor-not-allowed"
                        }
                      `}
                    >
                      <AnimatePresence mode="wait">
                        {uploadingImage ? (
                          <motion.div
                            key="uploading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                          >
                            <Upload className="h-6 w-6 animate-bounce" />
                            Uploading Image...
                          </motion.div>
                        ) : isPending || isCreating ? (
                          <motion.div
                            key="creating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                          >
                            <Flame className="h-6 w-6 animate-pulse" />
                            Creating Token...
                          </motion.div>
                        ) : isConfirming ? (
                          <motion.div
                            key="confirming"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                          >
                            <Zap className="h-6 w-6 animate-spin" />
                            Confirming...
                          </motion.div>
                        ) : (
                          <motion.div
                            key="launch"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                          >
                            <Rocket className="h-6 w-6 group-hover:translate-y-[-4px] transition-transform duration-300" />
                            Launch Token
                            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>

                    {/* Status Messages */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                        >
                          <p className="text-red-400 text-sm">
                            <strong>Launch Failed:</strong>{" "}
                            {error.message || "An error occurred"}
                          </p>
                        </motion.div>
                      )}

                      {receipt && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="mt-6 p-6 bg-green-500/10 border border-green-500/30 rounded-xl"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2 text-green-400">
                              <Trophy className="h-6 w-6" />
                              <h3 className="text-xl font-bold">
                                Token Created Successfully!
                              </h3>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Name:</span>
                                <span className="text-white font-medium">
                                  {tokenInfo.name}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Symbol:</span>
                                <span className="text-white font-medium">
                                  {tokenInfo.ticker}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">
                                  Funding Goal:
                                </span>
                                <span className="text-white font-medium">
                                  {tokenomics.fundingGoal} AVAX
                                </span>
                              </div>
                              {tokenInfo.burnManager && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">
                                    Burn Manager:
                                  </span>
                                  <span className="text-white font-medium">
                                    {tokenInfo.burnManager}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-center pt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">
                                  Transaction:
                                </span>
                                <AddressComponent
                                  hash={`${transactionData}`}
                                  type="tx"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </form>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card className="unified-card text-center">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 w-fit mx-auto">
                  <Zap className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Instant Trading
                </h3>
                <p className="text-gray-400">
                  Your token is immediately tradeable with built-in liquidity
                </p>
              </CardContent>
            </Card>

            <Card className="unified-card text-center">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30 w-fit mx-auto">
                  <Users className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Community Driven
                </h3>
                <p className="text-gray-400">
                  Bonding curves ensure fair price discovery for all
                  participants
                </p>
              </CardContent>
            </Card>

            <Card className="unified-card text-center">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30 w-fit mx-auto">
                  <Wand className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Zero Complexity
                </h3>
                <p className="text-gray-400">
                  No coding, no contracts to deploy. Just fill out the form and
                  launch!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </div>
    </div>
  );
}

export default Page;
