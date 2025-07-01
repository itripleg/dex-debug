export {};
// // pages/AllTokensDisplay.tsx
// "use client";

// import { useState, useEffect, useRef } from "react";
// import { Container } from "@/components/craft";
// import {
//   collection,
//   query,
//   limit,
//   orderBy,
//   onSnapshot,
// } from "firebase/firestore";
// import { db } from "@/firebase";
// import { SpaceScene } from "./scene/SpaceScene";
// import { TokenSearch } from "./tokens/TokenSearch";
// import { TokenTabs } from "./tokens/TokenTabs";
// import { TokenGrid } from "./tokens/TokenGrid";
// import { Token } from "@/types";
// import { Button } from "@/components/ui/button";
// import { defaultCam, moveCamPosition } from "@/hooks/CamTools";
// import { getAddressGreeting } from "@/hooks/addressGreetings";
// import { useAccount } from "wagmi";
// import { CameraSearch } from "./CameraSearch";
// import OuijaSearch from "./OuijaSearch";

// export default function AllTokensDisplay() {
//   const account = useAccount();
//   const [tokens, setTokens] = useState<Token[]>([]);
//   const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activeCategory, setActiveCategory] = useState("all");
//   const [showCameraSearch, setShowCameraSearch] = useState(false);
//   const [greeting, setGreeting] = useState("");
//   const [showSecret, setShowSecret] = useState(false);
//   const [searchMode, setSearchMode] = useState("token"); // "token", "camera", or "ouija"

//   const handleOuijaInput = (key: string) => {
//     if (key === "submit") {
//       // Handle submission
//       return;
//     }
//     if (key === "clear") {
//       // Handle clear
//       return;
//     }
//     // Handle individual key presses for Flecha movement
//     console.log("Ouija key pressed:", key);
//   };

//   const handleSecretFound = () => {
//     setShowSecret(true);
//     setTimeout(() => setShowSecret(false), 160000);
//     // Hide the greeting and other components
//     setShowCameraSearch(true);
//   };

//   useEffect(() => {
//     setGreeting(getAddressGreeting(account?.address));
//   }, [account?.address]);

//   useEffect(() => {
//     const tokensQuery = query(
//       collection(db, "tokens"),
//       orderBy("timestamp", "desc"),
//       limit(25)
//     );

//     const unsubscribe = onSnapshot(tokensQuery, (snapshot) => {
//       const updatedTokens = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       })) as Token[];
//       setTokens(updatedTokens);
//     });

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const filtered = tokens.filter(
//       (token) =>
//         token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         token.address.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//     setFilteredTokens(filtered);
//   }, [searchQuery, tokens]);

//   const filterTokensByCategory = (category: string) => {
//     setActiveCategory(category);
//     if (category === "all") {
//       setFilteredTokens(tokens);
//     } else {
//       const filtered = tokens.filter((token) => {
//         if (category === "high") return token.currentPrice >= 100;
//         if (category === "medium")
//           return token.currentPrice >= 10 && token.currentPrice < 100;
//         if (category === "low") return token.currentPrice < 10;
//         return true;
//       });
//       setFilteredTokens(filtered);
//     }
//   };
//   const cameraRef = useRef<any>(null);
//   const controlRef = useRef<any>(null);

//   const CameraAngles = () => {
//     const handleSearchModeChange = () => {
//       if (searchMode === "token") {
//         setSearchMode("camera");
//       } else if (searchMode === "camera") {
//         setSearchMode("ouija");
//       } else {
//         setSearchMode("token");
//         // Reset camera to default when switching back to token search
//         moveCamPosition({ cameraRef, x: 0, y: 0, z: -7, scale: 1 });
//         if (controlRef.current) {
//           controlRef.current.autoRotateSpeed = 1;
//         }
//       }
//     };

//     return (
//       <div className="z-30 flex gap-2 py-2">
//         <Button className="z-60" onClick={handleSearchModeChange}>
//           {searchMode === "token"
//             ? "👀"
//             : searchMode === "camera"
//             ? "🔮"
//             : "🔎"}
//         </Button>
//         {searchMode === "camera" && (
//           <Button
//             className="z-60"
//             onClick={() => {
//               moveCamPosition({ cameraRef, x: 0, y: 0, z: -7, scale: 1 });
//               console.log((controlRef.current.autoRotateSpeed = 1));
//             }}
//           >
//             Default
//           </Button>
//         )}
//       </div>
//     );
//   };

//   return (
//     <Container className="">
//       <SpaceScene cameraRef={cameraRef} controlRef={controlRef} />
//       <div className="container mx-auto py-8 relative">
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
//           <div className="z-30">
//             {!showSecret && (
//               <h1 className="text-4xl font-bold mb-8 text-center">
//                 {greeting}
//               </h1>
//             )}
//           </div>
//         </div>
//         <CameraAngles />

//         {searchMode === "camera" ? (
//           <CameraSearch
//             cameraRef={cameraRef}
//             onSecretFound={handleSecretFound}
//             showSecret={showSecret}
//           />
//         ) : searchMode === "ouija" ? (
//           <OuijaSearch onOuijaInput={handleOuijaInput} />
//         ) : (
//           <TokenSearch
//             searchQuery={searchQuery}
//             setSearchQuery={setSearchQuery}
//             setActiveCategory={setActiveCategory}
//           />
//         )}

//         {!showSecret && (
//           <>
//             <TokenTabs onCategoryChange={filterTokensByCategory} />
//             <TokenGrid tokens={filteredTokens} />
//           </>
//         )}
//       </div>
//     </Container>
//   );
// }
