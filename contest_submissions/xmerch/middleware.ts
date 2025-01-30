import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { unstable_precompute as precompute } from "@vercel/flags/next";
import { precomputeFlags } from "./lib/flags";

export const config = {
  matcher: ["/", "/product/:path*", "/cart", "/success", "/logout"],
};

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  let response = NextResponse.next();


  // Ensure the `__vercel_live_token` is set
  if (!request.cookies.has("__vercel_live_token")) {
    response.cookies.set("__vercel_live_token", process.env.API_TOKEN || "fallbackToken", {
      secure: process.env.NODE_ENV !== "development",
      sameSite: "none",
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }

  // Ensure the `shopper` cookie is set
  if (!request.cookies.has("shopper")) {
    const shopperId = Math.random().toString(36).substring(2);
    response.cookies.set("shopper", shopperId, {
      secure: process.env.NODE_ENV !== "development",
      sameSite: "none",
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  const context = {
    /* pass context on whatever your flag will need */
    event,
  };

  
  // decide precompute flags for the homepage only
  if (request.nextUrl.pathname === "/") {
    const code = await precompute(precomputeFlags, context);

    // rewrites the request to the variant for this flag combination
    const nextUrl = new URL(
      `/${code}${request.nextUrl.pathname}${request.nextUrl.search}`,
      request.url
    );
    response = NextResponse.rewrite(nextUrl, { request });
  }

  // Set a shopper cookie if one doesn't exist or has been cleared
  if (!request.cookies.has("shopper")) {
      const newShopperId = Math.random().toString(36).substring(2);
      console.log("Setting new shopper cookie:", newShopperId);
      response.cookies.set("shopper", newShopperId, {
      sameSite: "none", // Allows cross-site usage
      secure: process.env.NODE_ENV !== "development", // Requires HTTPS in production
      httpOnly: true, // Accessible only by the server
      path: "/", // Cookie available site-wide
      maxAge: 60 * 60 * 24 * 7, // One week
    });
  }

  if (request.nextUrl.pathname === "/logout") {
    response.cookies.delete("wallet_address");
  }
  
  return response;
}
