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

// Fetch XRP Price from API
async function fetchXRPPrice(): Promise<number> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/get-xrp-price`;

    console.log(`[fetchXRPPrice] Fetching XRP price from: ${apiUrl}`); // Debug log
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Ensure cookies are included
    });

    if (!response.ok) {
      console.error(`[fetchXRPPrice] Failed response: ${response.statusText}`); // Error log
      throw new Error("Failed to fetch XRP price from API.");
    }

    const { price } = await response.json();
    console.log(`[fetchXRPPrice] XRP price fetched successfully: ${price}`); // Success log
    return price;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while fetching XRP price.";
    console.error(`[fetchXRPPrice] Error: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

// Validate Cart for Network Requirements
function validateCartForNetwork(cartItems: CartItem[], network: string): { isValid: boolean; message?: string } {
  console.log(`[validateCartForNetwork] Validating cart for network: ${network}`); // Debug log

  const requiresXahau = cartItems.some((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product?.requiresXahau;
  });

  if (requiresXahau && network !== "xahau") {
    console.warn("[validateCartForNetwork] Network validation failed. Requires Xahau."); // Warning log
    return {
      isValid: false,
      message: "Your cart contains subscription products that require the Xahau network. Please switch to the Xahau network.",
    };
  }

  console.log("[validateCartForNetwork] Cart validation passed."); // Success log
  return { isValid: true };
}

// Build Transaction Payload
export async function buildPayload() {
  try {
    const cookieStore = await cookies();

    console.log("[buildPayload] Retrieving cookies..."); // Debug log
    const walletCookie = cookieStore.get("wallet_address");
    const tokenCookie = cookieStore.get("xumm_token");

    if (!walletCookie?.value) throw new Error("Wallet address is missing.");
    if (!tokenCookie?.value) throw new Error("XUMM token is missing.");

    console.log("[buildPayload] Wallet and token retrieved."); // Debug log

    const cartCookie = cookieStore.get("cart");
    const cartItems: CartItem[] = cartCookie?.value ? JSON.parse(cartCookie.value) : [];
    if (cartItems.length === 0) throw new Error("Cart is empty.");

    const networkCookie = cookieStore.get("network");
    const network = networkCookie?.value || "xrpl";
    const { isValid, message } = validateCartForNetwork(cartItems, network);

    if (!isValid) throw new Error(message || "Network validation failed.");

    const xrpPrice = await fetchXRPPrice();
    console.log("[buildPayload] XRP Price:", xrpPrice); // Debug log

    const cart = cartItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product with ID ${item.productId} not found.`);
      return {
        ...item,
        title: product.title,
        totalPrice: product.price * item.quantity, // Calculate totalPrice
        product, // Include product details if needed
      };
    });

    const subtotal = cart.reduce((total, item) => total + item.totalPrice, 0);
    const shippingFee = 0.01; //TO:DO list - Automatic Shipping Rates based on geo location coming later feb 25
    const handlingFee = 0.1 * subtotal;
    const totalUSD = subtotal + shippingFee + handlingFee;
    const totalXRP = totalUSD / xrpPrice;
    const roundedTotalXRP = Number.parseFloat(totalXRP.toFixed(6));

    if (roundedTotalXRP <= 0) throw new Error("Total amount cannot be zero or negative.");

    const memoData = {
      cart,
      fees: {
        shippingFee,
        handlingFee,
        subtotal,
        totalUSD,
      },
    };
    const memoDataHex = Buffer.from(JSON.stringify(memoData)).toString("hex");

    const networkId = network === "xahau" ? "21337" : undefined;

    const payload = {
      txjson: {
        TransactionType: "Payment",
        Account: walletCookie.value,
        Destination: process.env.XUMM_DESTINATION_ADDRESS,
        Amount: Math.round(roundedTotalXRP * 1000000).toString(),
        Fee: "15",
        ...(networkId && { NetworkID: networkId }),
        Memos: [
          {
            Memo: {
              MemoData: memoDataHex,
            },
          },
        ],
      },
      custom_meta: {
        identifier: `order-${new Date().getTime()}`,
        blob: {
          items: cart,
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

    console.log("[buildPayload] Payload built successfully:", JSON.stringify(payload, null, 2)); // Success log
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
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("xumm_token");
    const xummToken = tokenCookie?.value;

    if (!xummToken) {
      throw new Error("XUMM token is missing for sending payload.");
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/orders`;

    const fullPayload = {
      ...payload,
      options: {
        return_url: {
          app: redirectUri,
          web: redirectUri,
        },
      },
    };

    // Make the API request to XUMM
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/xumm/create-payload/xrpl-payload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${xummToken}`,
        },
        credentials: "include",
        body: JSON.stringify(fullPayload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create transaction payload.");
    }

    const result = await response.json();

    // Validate the structure of the response
    const tx_hash = result?.uuid || result?.tx_hash;
    const nextUrl = result?.next?.always || result?.nextUrl;
    const qr_png = result?.refs?.qr_png || "";

    if (!tx_hash || !nextUrl) {
      throw new Error("Invalid response from XUMM API.");
    }

    // Clear the cart after successful payload creation
    await clearCart();
    console.log("[sendPayload] Cart cleared successfully after sending payload.");

    return { tx_hash, nextUrl, qr_png };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred in sendPayload.";
    console.error(`[sendPayload] Error: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}
