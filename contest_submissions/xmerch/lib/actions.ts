"use server";

import optimizely from "@optimizely/optimizely-sdk";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export async function trackProductPurchase() {
  const client = optimizely.createInstance({
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    sdkKey: process.env.OPTIMIZELY_SDK_KEY!,
  });

  if (!client) {
    throw new Error("Failed to create client");
  }

  await client.onReady();

  const cookieStore = await cookies();
  const shopper = cookieStore.get("shopper")?.value;
  const context = client.createUserContext(shopper);

  if (!context) {
    throw new Error("Failed to create user context");
  }

  context.trackEvent("product_purchase");
}

interface CartItem {
  cartItemId: string;
  productId: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export async function addToCart(
  productId: string,
  selectedSize: string,
  selectedColor: string,
  quantity: number
) {
  if (quantity <= 0) return;

  const cookieStore = await cookies();
  const cartCookie = cookieStore.get("cart")?.value;
  const cartItems: CartItem[] = cartCookie ? JSON.parse(cartCookie) : [];

  // Check if identical item exists
  const existingItemIndex = cartItems.findIndex(
    (item) =>
      item.productId === productId &&
      item.selectedSize === selectedSize &&
      item.selectedColor === selectedColor
  );

  if (existingItemIndex > -1) {
    // If found, increment quantity
    cartItems[existingItemIndex].quantity += quantity;
  } else {
    // Otherwise, add a new item
    const newItem: CartItem = {
      cartItemId: uuidv4(),
      productId,
      selectedSize,
      selectedColor,
      quantity,
    };
    cartItems.push(newItem);
  }

  cookieStore.set("cart", JSON.stringify(cartItems));
}

export async function removeFromCart(cartItemId: string) {
  const cookieStore = await cookies();
  const cartCookie = cookieStore.get("cart")?.value;
  let cartItems: CartItem[] = cartCookie ? JSON.parse(cartCookie) : [];

  cartItems = cartItems.filter((item) => item.cartItemId !== cartItemId);

  cookieStore.set("cart", JSON.stringify(cartItems));
  redirect("/cart");
}


export async function setShippingAddress(address: object, walletAddress: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    `shipping_address_${walletAddress}`,
    JSON.stringify(address)
  );
}

export async function getShippingAddress(walletAddress: string) {
  const cookieStore = await cookies();
  const address = cookieStore.get(`shipping_address_${walletAddress}`)?.value;
  return address ? JSON.parse(address) : null;
}


export async function clearShippingAddress() {
  const cookieStore = await cookies();
  cookieStore.delete("shipping_address");
}

// Corrected clearCart function
export async function clearCart() {
  const cookieStore = await cookies();
  cookieStore.set("cart", JSON.stringify([]));
  console.log("Cart cleared successfully.");
}


//Shopping Cart Success - clearing cart

export async function cartSuccess() {
  const cookieStore = await cookies();
  cookieStore.set("cart", JSON.stringify([]), { path: "/", expires: new Date(0) });
  console.log("Cart cleared after successful order.");
}