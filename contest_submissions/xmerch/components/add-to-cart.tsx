"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/actions";

interface AddToCartButtonProps {
  productId: string;
  productTitle: string;
  productPrice: number;
  selectedSize: string;
  selectedColor: string;
}

export default function AddToCartButton({
  productId,
  productTitle,
  productPrice,
  selectedSize,
  selectedColor,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    if (quantity <= 0 || Number.isNaN(quantity)) {
      toast.error("Quantity must be at least 1");
      return;
    }

    await addToCart(productId, selectedSize, selectedColor, quantity);
    toast.success(
      `${productTitle} (Size: ${selectedSize}, Color: ${selectedColor}) x${quantity} added to cart!`
    );
  };

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
        <button
          className="px-3 py-1 border rounded-md"
          onClick={decreaseQuantity}
        >
          −
        </button>
        <input
          type="number"
          className="w-12 text-center border rounded-md"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min="1"
        />
        {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
        <button
          className="px-3 py-1 border rounded-md"
          onClick={increaseQuantity}
        >
          +
        </button>
      </div>
      <Button className="w-full" onClick={handleAddToCart}>
        Add to Cart
      </Button>
    </div>
  );
}
