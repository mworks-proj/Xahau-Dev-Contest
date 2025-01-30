
import ShippingCard from "@/components/ShippingCard";
import PlaceOrderButton from "@/components/place-order";
import RemoveItemButton from "@/components/remove-item";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { cookies } from "next/headers";
import Image from "next/image";
import { products } from "@/lib/products";
import { formatUSD } from "@/lib/utils";

interface CartProduct {
  productId: string;
  cartItemId: string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  title: string;
  price: number;
  imageSrc: string;
}

export default async function CartPage() {
  const walletAddress = await getWalletAddress();

  return (
    <main className="max-w-5xl mx-auto py-6 px-4 md:px-6">
      <h1 className="font-bold text-3xl lg:text-4xl">Checkout</h1>
      <section className="grid md:grid-cols-2 gap-6 lg:gap-12 items-start py-4 md:py-8 lg:py-12">
        <div className="flex flex-col gap-y-2">
          <ShippingCard walletAddress={walletAddress || ""} />
          <Cart />
        </div>
        <OrderSummary />
      </section>
    </main>
  );
}

async function getWalletAddress() {
  const cookieStore = await cookies();
  const walletCookie = cookieStore.get("wallet_address");
  return walletCookie?.value || "";
}

async function getProductsFromCookie(): Promise<CartProduct[]> {
  const cookieStore = await cookies();
  const cart = cookieStore.get("cart");
  const cartItems = cart?.value ? JSON.parse(cart.value) : [];

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return cartItems.map((item: any) => {
    const foundProduct = products.find((p) => p.id === item.productId);
    if (!foundProduct) {
      throw new Error(`Product with ID ${item.productId} not found.`);
    }

    return {
      productId: item.productId,
      cartItemId: item.cartItemId,
      quantity: item.quantity ?? 1,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      title: foundProduct.title,
      price: foundProduct.price,
      imageSrc: foundProduct.imageSrc,
    };
  });
}

async function Cart() {
  const products = await getProductsFromCookie();
  const total = products.reduce(
    (acc, product) => acc + product.price * product.quantity,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cart Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div>Your cart is empty</div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.cartItemId} className="flex items-center gap-4">
                <Image
                  alt="Product Image"
                  className="rounded-md h-16 w-16"
                  height="64"
                  width="64"
                  src={product.imageSrc}
                />
                <div className="grid gap-1 w-full">
                  <div className="flex flex-row justify-between items-center">
                    <div>
                      <div className="font-medium">{product.title}</div>
                      <div className="text-gray-500 text-sm">
                        Size: {product.selectedSize}, Color:{" "}
                        {product.selectedColor}
                      </div>
                    </div>
                    <RemoveItemButton cartItemId={product.cartItemId} />
                  </div>
                  <div className="text-gray-500">
                    Quantity: {product.quantity ?? 1}
                  </div>
                  <div>{formatUSD(product.price * product.quantity)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-xl font-semibold">Total: {formatUSD(total)}</div>
      </CardFooter>
    </Card>
  );
}

async function OrderSummary() {
  const products = await getProductsFromCookie();
  const subtotal = products.reduce(
    (acc, product) => acc + product.price * product.quantity,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatUSD(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>$0.01</span>
          </div>
          <div className="flex justify-between">
            <span>Handling Fee</span>
            <span>{formatUSD(0.01 * subtotal)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between items-center gap-2">
          <span className="font-semibold">Total:</span>
          <span className="text-xl font-bold">
            {formatUSD(subtotal + 0.01 + 0.1 * subtotal)}
          </span>
        </div>
      </CardFooter>
      {products.length > 0 && (
        <CardFooter>
          <PlaceOrderButton />
        </CardFooter>
      )}
    </Card>
  );
}
