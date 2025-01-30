"use client";

import { removeFromCart } from "@/lib/actions";
import { Button } from "./ui/button";

export default function RemoveItemButton({ cartItemId }: { cartItemId: string }) {
  return (
    <Button
      onClick={() => {
        removeFromCart(cartItemId);
      }}
      className="h-full p-0 text-red-600"
      variant="link"
    >
      Remove
    </Button>
  );
}
