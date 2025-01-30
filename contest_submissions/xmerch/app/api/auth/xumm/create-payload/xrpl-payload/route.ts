import { NextResponse } from "next/server";
import { Xumm } from "xumm";

// Initialize XUMM SDK
const xumm = new Xumm(
  process.env.NEXT_PUBLIC_XUMM_XRPL_API_KEY || "",
  process.env.XUMM_XRPL_API_SECRET || ""
);

export async function POST(req: Request) {
  try {
    // Parse the incoming request payload
    const payload = await req.json();
    console.log("Incoming Payload:", payload); // Debug log for payload

    // Validate payload structure
    if (
      !payload.txjson ||
      typeof payload.txjson.TransactionType !== "string" ||
      typeof payload.txjson.Amount !== "string"
    ) {
      throw new Error("Invalid or missing payload fields.");
    }

    // Ensure XUMM SDK is initialized correctly
    if (!xumm.payload) {
      throw new Error("XUMM SDK not initialized correctly.");
    }

    // Create payload using XUMM SDK
    const response = await xumm.payload.create(payload);

    // Validate XUMM SDK Response
    if (!response || !response.next || !response.uuid) {
      console.error("XUMM Response Error:", response);
      throw new Error("Failed to create payload.");
    }

    console.log("XUMM Payload Response:", response); // Debug log for XUMM response

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

    //payload cookies set
    console.log("[create-payload] Payload created and cookie set.");

    return res;
  } catch (error: unknown) {
    console.error(
      "Payload creation error:",
      error instanceof Error ? error.message : "Unknown error occurred"
    );

    // Return an error response
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create transaction payload.",
      },
      { status: 500 }
    );
  }
}
