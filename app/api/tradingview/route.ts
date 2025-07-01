// app/api/tradingview/route.ts
import { NextResponse } from "next/server";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: Request) {
  console.log("Starting webhook processing...");

  try {
    // Log the raw request
    console.log("Request headers:", Object.fromEntries(request.headers));

    // Get and parse the body
    const bodyText = await request.text();
    console.log("Raw body:", bodyText);

    // Parse JSON
    let alertData = {};
    if (bodyText) {
      try {
        alertData = JSON.parse(bodyText);
        console.log("Parsed alert data:", alertData);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        return NextResponse.json(
          {
            success: false,
            error: "Invalid JSON payload",
          },
          { status: 400 }
        );
      }
    }

    // Save to Firestore
    console.log("Attempting to save to Firestore...");
    const alertsRef = collection(db, "tradingview_alerts");

    const docData = {
      ...alertData,
      timestamp: serverTimestamp(),
      receivedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(alertsRef, docData);
    console.log("Alert saved to Firestore with ID:", docRef.id);

    return NextResponse.json({
      success: true,
      message: "Alert received and stored",
      alertId: docRef.id,
      data: alertData,
    });
  } catch (error: any) {
    // Detailed error logging
    console.error("Webhook processing error:");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Simple GET endpoint for testing
export async function GET() {
  return new Response("TradingView webhook endpoint is running", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export const dynamic = "force-dynamic";
