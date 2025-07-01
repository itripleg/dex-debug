// // First, add the utility function to get price from contract
// import { config } from "@/wagmi-config";
// import { formatEther } from "viem";
// import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

// async function getContractPrice(tokenAddress: string): Promise<string> {
//   const { publicClient } = config;
//   try {
//     const price = await publicClient.readContract({
//       address: FACTORY_ADDRESS,
//       abi: FACTORY_ABI,
//       functionName: 'getCurrentPrice',
//       args: [tokenAddress]
//     });
//     return formatEther(price);
//   } catch (error) {
//     console.error('Error getting token price:', error);
//     return "0";
//   }
// }

// // Then add a new hook for real-time price
// export function useTokenPrice(address: string) {
//   const [price, setPrice] = useState<string>("0");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let isMounted = true;

//     async function fetchPrice() {
//       try {
//         setLoading(true);
//         const contractPrice = await getContractPrice(address);
//         if (isMounted) {
//           setPrice(contractPrice);
//           setError(null);
//         }
//       } catch (err) {
//         if (isMounted) {
//           setError(err instanceof Error ? err.message : "Failed to fetch price");
//         }
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     }

//     // Initial fetch
//     fetchPrice();

//     // Set up periodic refresh (every 10 seconds)
//     const interval = setInterval(fetchPrice, 10000);

//     return () => {
//       isMounted = false;
//       clearInterval(interval);
//     };
//   }, [address]);

//   return { price, loading, error };
// }

// // Update mapTokenData to include contract price
// const mapTokenData = async (address: string, data: any): Promise<Token> => {
//   const contractPrice = await getContractPrice(address);

//   return {
//     // ... rest of your existing mapping
//     stats: {
//       ...safeGet(data, "statistics", {}),
//       currentPrice: contractPrice, // Use contract price instead of Firestore price
//     },
//     // ... rest of your existing mapping
//   };
// };
