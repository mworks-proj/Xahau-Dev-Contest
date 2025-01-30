import { NextResponse } from "next/server";

// Environment variables
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const FALLBACK_XAH_PRICE = 0.1; // Default fallback price in USD

function validateEnvironmentVariables() {
  if (!COINMARKETCAP_API_KEY) {
    console.error("Error: COINMARKETCAP_API_KEY is not set.");
    throw new Error("Missing required environment variable: COINMARKETCAP_API_KEY.");
  }
}

export async function POST() {
  try {
    // Validate environment variables
    validateEnvironmentVariables();

    // API configuration
    const apiUrl = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";
    const symbol = "XAH"; // The cryptocurrency symbol
    const convert = "USD"; // Convert to USD

    console.log("[get-xah-price] Fetching XAH price from CoinMarketCap...");

    // Fetch price from CoinMarketCap API
    const response = await fetch(`${apiUrl}?symbol=${symbol}&convert=${convert}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
      },
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error(
        `[get-xah-price] Failed to fetch XAH price. Status: ${response.status}, Details: ${errorDetails}`
      );
      throw new Error(`Failed to fetch XAH price. Status: ${response.status}`);
    }

    const data = await response.json();

    // Extract the USD price or use the fallback
    const xahPrice = data?.data?.XAH?.quote?.USD?.price;

    if (!xahPrice || Number.isNaN(xahPrice)) {
      console.warn(
        `[get-xah-price] XAH price not found in API response. Using fallback price: ${FALLBACK_XAH_PRICE}`
      );
      return NextResponse.json({ price: FALLBACK_XAH_PRICE, fallback: true });
    }

    console.log(`[get-xah-price] Fetched XAH price successfully: ${xahPrice} USD`);
    return NextResponse.json({ price: xahPrice, fallback: false });
  } catch (error) {
    console.error("[get-xah-price] Error fetching XAH price:", error instanceof Error ? error.message : error);

    // Return a fallback price to ensure continuity in case of an error
    return NextResponse.json({ price: FALLBACK_XAH_PRICE, fallback: true });
  }
}
