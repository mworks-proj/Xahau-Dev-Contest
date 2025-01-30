"use server";

import { cookies } from "next/headers";
import { products } from "@/lib/products";
import { clearCart } from "@/lib/actions";

// Define CartItem Type
interface CartItem {
  cartItemId: string;
  productId: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

// Fetch XAH Price from API
async function fetchXAHPrice(): Promise<number> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/get-xah-price`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      console.error(`[fetchXAHPrice] Failed response: ${response.statusText}`);
      throw new Error("Failed to fetch XAH price from API.");
    }

    const { price } = await response.json();
    console.log(`[fetchXAHPrice] Fetched XAH price: ${price}`);
    return price;
  } catch (error) {
    console.error("[fetchXAHPrice] Error:", error);
    throw new Error("Unable to fetch XAH price.");
  }
}

// Build Transaction Payload
export async function buildPayload() {
  try {
    const cookieStore = await cookies();

    // Retrieve wallet address
    const walletAddress = cookieStore.get("wallet_address")?.value;
    if (!walletAddress) throw new Error("Wallet address is missing.");

    // Retrieve cart items
    const cartCookie = cookieStore.get("cart");
    const cartItems: CartItem[] = cartCookie?.value ? JSON.parse(cartCookie.value) : [];
    if (cartItems.length === 0) throw new Error("Cart is empty.");

    // Fetch the current XAH price
    const xahPrice = await fetchXAHPrice();

    // Calculate cart subtotal and fees
    const subtotal = cartItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product with ID ${item.productId} not found.`);
      return total + product.price * item.quantity;
    }, 0);

    const shippingFee = 0.01; // USD
    const handlingFee = 0.01 * subtotal; // USD
    const totalUSD = subtotal + shippingFee + handlingFee;
    const totalXAH = totalUSD / xahPrice;
    const roundedTotalXAH = Math.round(totalXAH * 1_000_000).toString(); // Convert to drops (6 decimal places)

    if (Number(roundedTotalXAH) <= 0) {
      throw new Error("Total amount cannot be zero or negative.");
    }

    // Build memo data
    const memoData = {
      cart: cartItems,
      fees: {
        shippingFee,
        handlingFee,
        subtotal,
        totalUSD,
      },
    };
    const memoDataHex = Buffer.from(JSON.stringify(memoData)).toString("hex");

    // Define the transaction object
    const tx = {
      TransactionType: "Payment",
      Account: walletAddress,
      Destination: process.env.XUMM_DESTINATION_ADDRESS || "",
      Amount: roundedTotalXAH,
      Fee: "100000", // Hardcoded fee for Xahau
      NetworkID: 21337, // Specific to Xahau
      Flags: 2147483648, // XRP flag
      Memos: [
        {
          Memo: {
            MemoData: memoDataHex,
          },
        },
      ],
    };

    // Build the full payload
    const payload = {
      txjson: tx,
      custom_meta: {
        identifier: `order-${new Date().getTime()}`,
        blob: {
          items: cartItems,
          subtotal: totalUSD,
        },
        instruction: "Complete this transaction and we'll start your order.",
      },
      options: {
        return_url: {
          app: `${process.env.NEXT_PUBLIC_BASE_URL}/orders`,
          web: `${process.env.NEXT_PUBLIC_BASE_URL}/orders`,
        },
      },
    };

    console.log("[buildPayload] Payload built successfully:", JSON.stringify(payload, null, 2));
    return payload;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred in buildPayload.";
    console.error(`[buildPayload] Error: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

// Send Payload to Create Transaction
export async function sendPayload(payload: object): Promise<{ tx_hash: string; nextUrl: string; qr_png: string }> {
  try {
    const tokenCookie = (await cookies()).get("xumm_token")?.value;
    if (!tokenCookie) throw new Error("XUMM token is missing for sending payload.");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/xumm/create-payload/xahau-payload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCookie}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[sendPayload] XUMM API Error Response:", error);
      throw new Error(error.error || "Failed to create transaction payload.");
    }

    const result = await response.json();
    const tx_hash = result?.uuid || result?.tx_hash || "";
    const nextUrl = result?.next?.always || result?.nextUrl || "";
    const qr_png = result?.refs?.qr_png || "";

    if (!tx_hash || !nextUrl) throw new Error("Invalid response from XUMM API.");

    console.log("[sendPayload] Transaction details:", { tx_hash, nextUrl, qr_png });

    // Clear cart here
    await clearCart();
    console.log("[sendPayload] Cart cleared successfully.");

    return { tx_hash, nextUrl, qr_png };
  } catch (error) {
    console.error("[sendPayload] Error:", error);
    throw new Error("Failed to send transaction payload.");
  }
}
