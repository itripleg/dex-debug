import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToken } from "@/contexts/TokenContext";

interface DebugTokenLoadingProps {
  tokenAddress: string;
}

export const DebugTokenLoading: React.FC<DebugTokenLoadingProps> = ({
  tokenAddress,
}) => {
  const [firebaseData, setFirebaseData] = useState<any>(null);
  const [contextData, setContextData] = useState<any>(null);
  const { token } = useToken(tokenAddress);

  const loadFirebaseData = async () => {
    try {
      console.log("🔍 Loading token from Firebase:", tokenAddress);
      const tokenDocRef = doc(db, "tokens", tokenAddress);
      const docSnap = await getDoc(tokenDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("📊 Raw Firebase data:", data);
        setFirebaseData(data);
      } else {
        console.log("❌ Document does not exist");
        setFirebaseData(null);
      }
    } catch (error) {
      console.error("❌ Error loading from Firebase:", error);
    }
  };

  useEffect(() => {
    loadFirebaseData();
  }, [tokenAddress]);

  useEffect(() => {
    if (token) {
      console.log("🎯 Token from context:", token);
      setContextData(token);
    }
  }, [token]);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Token Loading Debug
            <Button onClick={loadFirebaseData} size="sm">
              Refresh Firebase
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Firebase Data */}
          <div>
            <h3 className="font-semibold mb-2 text-blue-800">
              📊 Direct Firebase Data:
            </h3>
            <div className="bg-white border border-gray-300 p-3 rounded text-sm text-black">
              <div>
                <strong>Has imagePosition:</strong>{" "}
                {firebaseData?.imagePosition ? "✅ YES" : "❌ NO"}
              </div>
              {firebaseData?.imagePosition && (
                <div className="mt-2">
                  <strong>Position:</strong>
                  <pre className="bg-blue-50 p-2 mt-1 rounded text-xs">
                    {JSON.stringify(firebaseData.imagePosition, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <strong>Last Updated:</strong>{" "}
                {firebaseData?.lastUpdated?.seconds
                  ? new Date(
                      firebaseData.lastUpdated.seconds * 1000
                    ).toLocaleString()
                  : "None"}
              </div>
              <div>
                <strong>Updated By:</strong> {firebaseData?.updatedBy || "None"}
              </div>
            </div>
          </div>

          {/* Context Data */}
          <div>
            <h3 className="font-semibold mb-2 text-purple-800">
              🎯 Token Context Data:
            </h3>
            <div className="bg-white border border-gray-300 p-3 rounded text-sm text-black">
              <div>
                <strong>Has imagePosition:</strong>{" "}
                {contextData?.imagePosition ? "✅ YES" : "❌ NO"}
              </div>
              {contextData?.imagePosition && (
                <div className="mt-2">
                  <strong>Position:</strong>
                  <pre className="bg-purple-50 p-2 mt-1 rounded text-xs">
                    {JSON.stringify(contextData.imagePosition, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <strong>Token loaded:</strong>{" "}
                {contextData ? "✅ YES" : "❌ NO"}
              </div>
            </div>
          </div>

          {/* Raw Data Comparison */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">🔍 Raw Data:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1 text-blue-700">
                  Firebase Raw:
                </h4>
                <pre className="bg-black text-green-400 p-3 rounded text-xs overflow-auto max-h-40 border">
                  {JSON.stringify(firebaseData, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-1 text-purple-700">
                  Context Raw:
                </h4>
                <pre className="bg-black text-green-400 p-3 rounded text-xs overflow-auto max-h-40 border">
                  {JSON.stringify(contextData, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Quick Fix Instructions */}
          <div className="bg-yellow-100 border-2 border-yellow-400 p-4 rounded">
            <h3 className="font-bold mb-3 text-yellow-800">
              🔧 Possible Issues:
            </h3>
            <ul className="text-sm space-y-2 text-yellow-900">
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">•</span>
                <span>
                  <strong>
                    If Firebase has imagePosition but Context doesn't:
                  </strong>{" "}
                  The token context isn't reading the imagePosition field
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">•</span>
                <span>
                  <strong>If Firebase doesn't have imagePosition:</strong> The
                  save isn't working properly
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">•</span>
                <span>
                  <strong>If both are missing:</strong> Check if you're using
                  the correct token address
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
