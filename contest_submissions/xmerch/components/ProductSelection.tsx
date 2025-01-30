"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import AddToCartButton from "@/components/add-to-cart";

interface ProductSelectionProps {
  product: {
    id: string;
    title: string;
    price: number;
    availableSizes: string[];
    availableColors: string[];
  };
}

export default function ProductSelection({ product }: ProductSelectionProps) {
  const [selectedColor, setSelectedColor] = useState(product.availableColors[0]);
  const [selectedSize, setSelectedSize] = useState(product.availableSizes[0]);

  return (
    <div className="grid gap-4 md:gap-7">
      {/* Color Selection */}
      <div className="flex flex-col">
        <Label className="text-base mb-1" htmlFor="color">Color</Label>
        <RadioGroup
          className="flex items-center gap-3"
          id="color"
          value={selectedColor}
          onValueChange={(value) => setSelectedColor(value)}
        >
          {product.availableColors.map((color) => (
            <Label
              key={`${product.id}-color-${color}`}
              htmlFor={`color-${color}`}
              className="border cursor-pointer rounded-md p-2 flex items-center gap-2 [&:has(:checked)]:bg-gray-100"
            >
              <RadioGroupItem id={`color-${color}`} value={color} />
              {color}
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Size Selection */}
      <div className="flex flex-col">
        <Label className="text-base mb-1" htmlFor="size">Size</Label>
        <RadioGroup
          className="flex items-center gap-5"
          id="size"
          value={selectedSize}
          onValueChange={(value) => setSelectedSize(value)}
        >
          {product.availableSizes.map((size) => (
            <Label
              key={`${product.id}-size-${size}`}
              htmlFor={`size-${size}`}
              className="border cursor-pointer rounded-md p-2 flex items-center gap-2 [&:has(:checked)]:bg-gray-100"
            >
              <RadioGroupItem id={`size-${size}`} value={size} />
              {size}
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Add to Cart Button */}
      <AddToCartButton
        productId={product.id}
        productTitle={product.title}
        productPrice={product.price}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
      />
    </div>
  );
}
