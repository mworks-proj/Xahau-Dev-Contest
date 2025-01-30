import { NextResponse } from "next/server";
import { Xumm } from "xumm";

// Initialize XUMM SDK with hardcoded API keys for Xahau
const xumm = new Xumm(
  process.env.NEXT_PUBLIC_XUMM_XAHAU_API_KEY || "",
  process.env.XUMM_XAHAU_API_SECRET || ""
);

export async function POST(req: Request) {
  try {
    console.log("[create-payload] Received request to create payload...");

    // Parse the incoming request payload
    const payload = await req.json();
    console.log("[create-payload] Incoming Payload:", payload);

    // Validate payload structure
    if (
      !payload.txjson ||
      !payload.txjson.TransactionType ||
      !payload.txjson.Account ||
      !payload.txjson.Destination ||
      !payload.txjson.Amount
    ) {
      console.error("[create-payload] Invalid or missing payload fields.");
      throw new Error("Invalid or missing payload fields.");
    }

    console.log("[create-payload] Validated payload structure:", payload);

    // Add return_url to ensure redirection works
    const fullPayload = {
      ...payload,
      options: {
        return_url: {
          app: `${process.env.NEXT_PUBLIC_BASE_URL}/orders`,
          web: `${process.env.NEXT_PUBLIC_BASE_URL}/orders`,
        },
      },
    };

    console.log("[create-payload] Full Payload with return_url:", fullPayload);

    // Ensure XUMM SDK is initialized correctly
    if (!xumm.payload) {
      console.error("[create-payload] XUMM SDK not initialized correctly.");
      throw new Error("XUMM SDK not initialized correctly.");
    }

    // Create payload using XUMM SDK
    console.log("[create-payload] Sending full payload to XUMM...");
    const response = await xumm.payload.create(fullPayload);

    // Validate XUMM SDK Response
    if (!response || !response.next || !response.uuid) {
      console.error("[create-payload] XUMM Response Error:", response);
      throw new Error("Failed to create payload.");
    }

    console.log("[create-payload] XUMM Payload Response:", response);

    // Build the response object
    const res = NextResponse.json(
      {
        tx_hash: response.uuid, // Unique transaction hash from XUMM
        nextUrl: response.next.always, // XUMM wallet redirection URL
      },
      { status: 200 }
    );

    // Set secure cookie for transaction tracking
    res.headers.append(
      "Set-Cookie",
      `xummTx=${response.uuid}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${60 * 60 * 24}`
    );

    console.log("[create-payload] Payload created and cookie set successfully.");
    return res;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("[create-payload] Error:", errorMessage);

    // Return an error response
    return NextResponse.json(
      {
        error: errorMessage || "Failed to create transaction payload.",
      },
      { status: 500 }
    );
  }
}
