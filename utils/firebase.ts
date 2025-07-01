import { db } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { CryptoAddress, FirebaseError } from "../types";

const COLLECTION_NAME = "cryptoAddresses";

export async function fetchAddresses(): Promise<CryptoAddress[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as CryptoAddress)
    );
  } catch (error) {
    console.error("Error fetching addresses:", error);
    throw error;
  }
}

export async function addAddress(
  address: Omit<CryptoAddress, "id">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), address);
    return docRef.id;
  } catch (error) {
    console.error("Error adding address:", error);
    throw error;
  }
}
