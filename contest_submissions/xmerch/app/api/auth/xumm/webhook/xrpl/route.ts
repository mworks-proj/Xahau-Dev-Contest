import { supabase } from "@/lib/supabaseClient";
import { type NextRequest, NextResponse } from "next/server";
import { Client, type Payment } from "xrpl";
import { cartSuccess } from "@/lib/actions"; // Import the cartSuccess function
import type { PaymentMetadata } from "xrpl/dist/npm/models/transactions/payment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const txHash = body?.payloadResponse?.txid;

    if (!txHash) {
      throw new Error("Transaction hash (txid) is missing.");
    }

    // Connect to XRPL
    const client = new Client("wss://xrplcluster.com");
    await client.connect();

    const txResponse = await client.request({
      command: "tx",
      transaction: txHash,
      binary: false,
    });

    await client.disconnect();

    const result = txResponse.result as { tx_json: Payment; meta: PaymentMetadata };
    const txData = result.tx_json;
    const meta = result.meta;

    if (txData.TransactionType !== "Payment") {
      throw new Error("Invalid Transaction Type. Expected 'Payment'.");
    }

    const Account = txData.Account;
    const Destination = txData.Destination;
    const Amount = typeof txData.Amount === "object" ? txData.Amount.value : txData.Amount;
    const deliveredAmount = meta.delivered_amount;

    if (!Account || !Destination || !deliveredAmount) {
      throw new Error("Transaction data is incomplete or invalid.");
    }

    const Memos = txData.Memos?.map((memoObj) => {
      const MemoData = memoObj.Memo?.MemoData
        ? Buffer.from(memoObj.Memo.MemoData, "hex").toString()
        : null;
      return MemoData;
    }) ?? [];

    const itemsOrdered = Memos.map((memo) => {
      try {
        return JSON.parse(memo || "{}");
      } catch {
        return { details: memo || "No items data available" };
      }
    }).filter(Boolean);

    const dollarsSpent = deliveredAmount
      ? Number.parseFloat((Number(deliveredAmount) / 1000000).toFixed(6))
      : 0;

    if (dollarsSpent <= 0) {
      throw new Error("Calculated dollars spent is zero or negative.");
    }

    // Save customer data
    const { error: customerError } = await supabase.from("customers").upsert(
      { wallet_address: Account, created_at: new Date().toISOString() },
      { onConflict: "wallet_address" }
    );
    if (customerError) {
      console.error("Error upserting customer data.");
      throw new Error("Failed to save customer details.");
    }

    // Save order data
    const { error: orderError } = await supabase.from("orders").insert({
      tx_hash: txHash,
      wallet_address: Account,
      items_ordered: itemsOrdered.length > 0 ? itemsOrdered : null,
      dollars_spent: dollarsSpent,
      created_at: new Date().toISOString(),
      status: meta.TransactionResult,
      fulfilment_status: "Awaiting Fulfilment",
    });

    if (orderError) {
      console.error("Error inserting order data.");
      throw new Error("Failed to save order details.");
    }

    // Clear the cart after successful order processing
    await cartSuccess();

    // Determine if it's a mobile or web request for the redirect
    const userAgent = req.headers.get("user-agent")?.toLowerCase() || "";
    const isMobile = /mobile|android|iphone|ipad|ipod/.test(userAgent);

    const redirectUrl = isMobile
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/orders`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/orders`;

    return NextResponse.json({
      success: true,
      redirect: redirectUrl,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
