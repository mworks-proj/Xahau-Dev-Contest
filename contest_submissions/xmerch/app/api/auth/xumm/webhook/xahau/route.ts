import { supabase } from "@/lib/supabaseClient";
import { type NextRequest, NextResponse } from "next/server";

// Utility function to fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Utility function for retries
async function fetchWithRetry(url: string, options: RequestInit, retries: number, timeout: number): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed after ${retries + 1} attempts: ${error instanceof Error ? error.message : String(error)}`);
      }
      console.warn(`Retrying (${attempt + 1}/${retries}) after error: ${error instanceof Error ? error.message : String(error)}`);
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000)); // Exponential backoff
    }
  }
  throw new Error("This should never be reached.");
}

export async function POST(req: NextRequest) {
  try {
    console.log("[XAMAN XAH INCOMING] Webhook triggered...");

    // Parse incoming payload from Xaman
    const body = await req.json();
    const { payloadResponse } = body;
    const { txid } = payloadResponse || {};

    if (!txid) {
      throw new Error("Transaction ID (txid) is missing from payload.");
    }

    console.log("[XAMAN XAH INCOMING] Received txid:", txid);

    // Step 1: Query Xahau RPC for transaction details
    const rpcUrl = "https://xahau.network";
    const rpcResponse = await fetchWithRetry(
      rpcUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "tx",
          params: [
            {
              transaction: txid,
              binary: false,
            },
          ],
        }),
      },
      2, // Number of retries
      5000 // Timeout in milliseconds
    );

    const { result } = await rpcResponse.json();

    console.log("[Xahau RPC] Transaction Details:", result);

    // Step 2: Validate Transaction Result
    const transactionResult = result?.meta?.TransactionResult;
    if (transactionResult !== "tesSUCCESS") {
      throw new Error(`Transaction failed with result: ${transactionResult}`);
    }

    // Step 3: Extract necessary data from transaction
    const { Account, Destination, Amount, Memos, NetworkID } = result;
    const deliveredAmount = result?.meta?.delivered_amount;

    if (!Account || !Destination || !deliveredAmount || !NetworkID) {
      throw new Error("Transaction data is incomplete or invalid.");
    }

    // Decode memos
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const decodedMemos = Memos?.map((memoObj: any) => {
      const MemoData = memoObj.Memo?.MemoData
        ? Buffer.from(memoObj.Memo.MemoData, "hex").toString()
        : null;
      return MemoData;
    }) || [];

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const itemsOrdered = decodedMemos.map((memo: any) => {
      try {
        return JSON.parse(memo || "{}");
      } catch {
        return { details: memo || "No items data available" };
      }
    });

    const dollarsSpent = deliveredAmount
      ? Number.parseFloat((Number(deliveredAmount) / 1000000).toFixed(6))
      : 0;

    if (dollarsSpent <= 0) {
      throw new Error("Calculated dollars spent is zero or negative.");
    }

    // Step 4: Save data to Supabase
    const { error: customerError } = await supabase.from("customers").upsert(
      { wallet_address: Account, created_at: new Date().toISOString() },
      { onConflict: "wallet_address" }
    );
    if (customerError) {
      throw new Error("Failed to save customer details.");
    }

    const { error: orderError } = await supabase.from("orders").insert({
      tx_hash: txid,
      wallet_address: Account,
      items_ordered: itemsOrdered.length > 0 ? itemsOrdered : null,
      dollars_spent: dollarsSpent,
      created_at: new Date().toISOString(),
      status: "Processed",
      fulfilment_status: "Awaiting Fulfilment",
      network_id: NetworkID, // Include NetworkID here
    });
    if (orderError) {
      throw new Error("Failed to save order details.");
    }

    console.log("[Xahau Webhook] Transaction processed successfully.");

    // Step 5: Determine redirection based on user-agent
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
    console.error("Webhook processing error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


