export {};
// "use client";

// import { useState, useEffect } from "react";
// import { useWriteContract, useReadContract } from "wagmi";
// import { parseEther } from "viem";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { Canvas } from "@react-three/fiber";
// import { Box, OrbitControls } from "@react-three/drei";
// import tokenFactoryABI from "@/contracts/token-factory/TokenFactory_abi.json";

// const FACTORY_ADDRESS = "0x7713A39875A5335dc4Fc4f9359908afb55984b1F";

// export function SacrificeForm() {
//   const [sacrificeAmount, setSacrificeAmount] = useState("");
//   const { toast } = useToast();

//   const { data: requiredSacrificeAmount } = useReadContract({
//     address: FACTORY_ADDRESS,
//     abi: tokenFactoryABI,
//     functionName: "requiredSac",
//   });

//   const { writeContract, isPending, isSuccess, isError, error } =
//     useWriteContract();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       writeContract(
//         {
//           address: FACTORY_ADDRESS,
//           abi: tokenFactoryABI,
//           functionName: "sacrifice",
//           value: parseEther(sacrificeAmount),
//         },
//         {
//           onSuccess(data) {
//             toast({
//               title: "Sacrifice Successful",
//               description: `Transaction hash: ${data}`,
//             });
//           },
//           onError(err) {
//             console.error("Failed to sacrifice:", err);
//             toast({
//               title: "Error",
//               description: "Failed to sacrifice. Please try again.",
//               variant: "destructive",
//             });
//           },
//         }
//       );
//     } catch (err) {
//       console.error("Unexpected error:", err);
//       toast({
//         title: "Error",
//         description: "An unexpected error occurred. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="text-primary-foreground p-4 rounded-lg">
//         <p>
//           By sacrificing ETH, you&apos;ll receive an NFT (to be fully
//           implemented later). This NFT will represent your contribution to the
//           project.
//         </p>
//       </div>

//       <div className="h-64 w-full">
//         <Canvas>
//           <ambientLight />
//           {/* <pointLight position={[10, 10, 10]} /> */}
//           <directionalLight position={[0, 10, 5]} />
//           <Box scale={2}>
//             <meshStandardMaterial color="hotpink" />
//           </Box>
//           <OrbitControls autoRotate />
//         </Canvas>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <Label htmlFor="sacrificeAmount">Sacrifice Amount (ETH)</Label>
//           <Input
//             id="sacrificeAmount"
//             type="number"
//             step="0.01"
//             value={sacrificeAmount}
//             onChange={(e) => setSacrificeAmount(e.target.value)}
//             placeholder="Enter amount to sacrifice"
//             required
//           />
//         </div>
//         <div>
//           <p>
//             Required Sacrifice Amount:{" "}
//             {requiredSacrificeAmount
//               ? parseFloat(requiredSacrificeAmount.toString()) / 1e18
//               : "Loading..."}{" "}
//             ETH
//           </p>
//         </div>
//         <Button type="submit" className="w-full" disabled={isPending}>
//           {isPending ? "Sacrificing..." : "Sacrifice"}
//         </Button>
//       </form>

//       {isSuccess && <p className="text-green-600">Sacrifice successful!</p>}
//       {isError && (
//         <p className="text-red-600">
//           Error: {error?.message || "Failed to sacrifice"}
//         </p>
//       )}
//     </div>
//   );
// }
