import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const walletAddress = url.searchParams.get("wallet_address");

    if (!walletAddress) {
      console.error("Missing wallet address in request.");
      return NextResponse.json(
        { error: "Wallet address is required to fetch orders" },
        { status: 400 }
      );
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "tx_hash, created_at, dollars_spent, wallet_address, items_ordered, status, fulfilment_status, network_id" // Include network_id
      )
      .eq("wallet_address", walletAddress)
      .order("created_at", { ascending: false });

    if (error || !orders) {
      console.error("Failed to fetch orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
