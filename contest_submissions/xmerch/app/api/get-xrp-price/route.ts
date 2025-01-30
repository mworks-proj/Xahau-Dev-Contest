import { NextResponse } from "next/server";

// Environment variables
const DHALI_API_URL = process.env.DHALI_API_URL || "";
const PAYMENT_CLAIM = process.env.DHALI_PAYMENT_CLAIM || "";
const FALLBACK_PRICE = 3.1; // Default fallback price in USD

function validateEnvironmentVariables() {
  if (!DHALI_API_URL) {
    console.error("Error: DHALI_API_URL is not set.");
  }
  if (!PAYMENT_CLAIM) {
    console.error("Error: PAYMENT_CLAIM is not set.");
  }

  if (!DHALI_API_URL || !PAYMENT_CLAIM) {
    throw new Error("Missing required environment variables: DHALI_API_URL or PAYMENT_CLAIM.");
  }
}

export async function POST() {
  try {
    //console.log("POST /api/get-xrp-price: Starting request.");

    // Validate environment variables
    //console.log("Validating environment variables...");
    validateEnvironmentVariables();
    //console.log("Environment variables are valid.");

    // Log Dhali API URL and payment claim (masked for security)
    //console.log("Using Dhali API URL:", DHALI_API_URL);
    //console.log("Using Payment-Claim header:", `${PAYMENT_CLAIM.substring(0, 5)}... (masked)`);

    // Fetch price from Dhali API
    //console.log("Fetching price from Dhali API...");
    const response = await fetch(DHALI_API_URL, {
      method: "GET",
      headers: {
        "Payment-Claim": PAYMENT_CLAIM,
        "Content-Type": "application/json",
      },
    });

    //console.log(`Received response. Status: ${response.status}`);

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error(`Failed to fetch price data. Status: ${response.status}, Details: ${errorDetails}`);
      throw new Error(`Failed to fetch price data. Status: ${response.status}`);
    }

    const data = await response.json();
    //console.log("Fetched data from API:", data);

    // Extract the USD price or use the fallback
    const xrpPrice = data?.currency?.USD?.Price;
    //console.log(`Extracted XRP Price: ${xrpPrice}`);

    if (!xrpPrice || Number.isNaN(xrpPrice)) {
      console.warn(`XRP price not found; using fallback price of ${FALLBACK_PRICE}.`);
      return NextResponse.json({ price: FALLBACK_PRICE, fallback: true });
    }

    //console.log(`Returning real-time XRP Price: ${xrpPrice} USD`);
    return NextResponse.json({ price: xrpPrice, fallback: false });
  } catch (error) {
    console.error("Error fetching XRP price:", error instanceof Error ? error.message : error);
    return NextResponse.json({ price: FALLBACK_PRICE, fallback: true });
  }
}
