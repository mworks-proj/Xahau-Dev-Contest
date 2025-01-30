import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const walletAddress = cookieStore.get("wallet_address")?.value;
    const token = cookieStore.get("xumm_token")?.value;
    const network = cookieStore.get("network")?.value || "xrpl"; // Default to XRPL

    if (!walletAddress || !token) {
      // Not logged in
      return NextResponse.json({
        success: false,
        loggedIn: false,
      });
    }

    return NextResponse.json({
      success: true,
      loggedIn: true,
      walletAddress,
      token,
      network, // Include network state
    });
  } catch (error) {
    console.error("Error getting wallet info:", error);
    return NextResponse.json(
      { error: "Failed to get wallet info" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { walletAddress, token, network } = await req.json();

    // If walletAddress or token are not provided, reuse existing cookies
    const cookieStore = await cookies();
    const existingWalletAddress = walletAddress || cookieStore.get("wallet_address")?.value;
    const existingToken = token || cookieStore.get("xumm_token")?.value;

    if (!existingWalletAddress || !existingToken || !network) {
      return NextResponse.json(
        {
          error: "Wallet address, token, and network are required",
        },
        { status: 400 }
      );
    }

    // Set wallet address cookie (only if provided)
    cookieStore.set("wallet_address", existingWalletAddress, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "strict",
    });

    // Set token cookie (only if provided)
    cookieStore.set("xumm_token", existingToken, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "strict",
    });

    // Set network cookie
    cookieStore.set("network", network, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "strict",
    });

    console.log("Wallet address, token, and network saved in cookies:", {
      walletAddress: existingWalletAddress,
      token: existingToken,
      network,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Error setting wallet address, token, and network in cookies:",
      error
    );
    return NextResponse.json(
      { error: "Failed to set wallet address, token, and network" },
      { status: 500 }
    );
  }
}



