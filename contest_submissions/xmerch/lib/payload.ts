"use server";

import { buildPayload as buildXahauPayload, sendPayload as sendXahauPayload } from "./payloads/xahau-payload";
import { buildPayload as buildXRPLPayload, sendPayload as sendXRPLPayload } from "./payloads/xrpl-payload";
import { cookies } from "next/headers";

export async function placeOrder() {
  try {
    const cookieStore = await cookies();
    const network = cookieStore.get("network")?.value || "xrpl"; // Default to XRPL

    // Select the appropriate payload builder and sender based on the network
    const buildPayload = network === "xahau" ? buildXahauPayload : buildXRPLPayload;
    const sendPayload = network === "xahau" ? sendXahauPayload : sendXRPLPayload;

    // Build the payload
    const payload = await buildPayload();

    // Send the payload and retrieve transaction details
    const { tx_hash, nextUrl, qr_png } = await sendPayload(payload);

    console.log(`[placeOrder] Transaction Sent to Xaman: ${tx_hash}`);
    return { tx_hash, nextUrl, qr_png };
  } catch (error) {
    console.error("[placeOrder] Error placing order:", error);
    throw error;
  }
}
