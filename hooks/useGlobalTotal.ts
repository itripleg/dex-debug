import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

export function useGlobalTotal() {
  const [globalTotal, setGlobalTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const globalTotalRef = doc(db, "globalValues", "total");

    const unsubscribe = onSnapshot(globalTotalRef, (doc) => {
      if (doc.exists()) {
        setGlobalTotal(doc.data().value);
      } else {
        // Initialize the document if it doesn't exist
        setDoc(globalTotalRef, { value: 0 });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateGlobalTotal = async (newTotal: number) => {
    const globalTotalRef = doc(db, "globalValues", "total");
    await setDoc(globalTotalRef, { value: newTotal });
  };

  return { globalTotal, updateGlobalTotal, loading };
}
