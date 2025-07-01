// hooks/useImagePosition.ts
import { useState } from "react";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fit?: "cover" | "contain" | "fill";
}

export const useImagePosition = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updatePosition = async (
    tokenAddress: string,
    position: ImagePosition,
    userAddress: string
  ): Promise<boolean> => {
    console.log("🔄 Starting position update...", {
      tokenAddress,
      position,
      userAddress,
    });

    if (!tokenAddress || !userAddress) {
      console.error("❌ Missing required data:", { tokenAddress, userAddress });
      toast({
        title: "Error",
        description: "Missing token address or user address",
        variant: "destructive",
      });
      return false;
    }

    setIsUpdating(true);

    try {
      // First, check if the document exists and get current data
      const tokenDocRef = doc(db, "tokens", tokenAddress);
      console.log("📖 Reading document:", tokenAddress);

      const docSnap = await getDoc(tokenDocRef);
      if (!docSnap.exists()) {
        console.error("❌ Document does not exist");
        toast({
          title: "Error",
          description: "Token document not found",
          variant: "destructive",
        });
        return false;
      }

      const currentData = docSnap.data();
      console.log("📊 Current document data:", currentData);

      // Check if user is creator
      if (!currentData.creator) {
        console.error("❌ No creator field in document");
        toast({
          title: "Error",
          description: "Token has no creator",
          variant: "destructive",
        });
        return false;
      }

      const isCreator =
        userAddress.toLowerCase() === currentData.creator.toLowerCase();
      console.log("👤 Creator check:", {
        userAddress: userAddress.toLowerCase(),
        creator: currentData.creator.toLowerCase(),
        isCreator,
      });

      if (!isCreator) {
        console.error("❌ User is not creator");
        toast({
          title: "Permission Denied",
          description: "Only the token creator can edit image position",
          variant: "destructive",
        });
        return false;
      }

      // Prepare update data
      const updateData = {
        imagePosition: position,
        lastUpdated: serverTimestamp(),
        updatedBy: userAddress,
      };

      console.log("📤 Updating document with:", updateData);

      await updateDoc(tokenDocRef, updateData);

      console.log("✅ Document updated successfully");

      // Verify the update
      const updatedDoc = await getDoc(tokenDocRef);
      if (updatedDoc.exists()) {
        console.log("✅ Verified update:", updatedDoc.data().imagePosition);
      }

      toast({
        title: "✅ Position Saved!",
        description: "Image position updated successfully.",
      });

      return true;
    } catch (error) {
      console.error("❌ Firebase update error:", error);

      // More detailed error handling
      if (error instanceof Error) {
        if (error.message.includes("permission-denied")) {
          toast({
            title: "❌ Permission Denied",
            description: "Check Firebase security rules and authentication",
            variant: "destructive",
          });
        } else if (error.message.includes("not-found")) {
          toast({
            title: "❌ Document Not Found",
            description: "Token document doesn't exist in Firestore",
            variant: "destructive",
          });
        } else {
          toast({
            title: "❌ Save Failed",
            description: `Error: ${error.message}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "❌ Save Failed",
          description: "Unknown error occurred",
          variant: "destructive",
        });
      }

      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updatePosition,
    isUpdating,
  };
};
