import { products } from "@/lib/products";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatUSD } from "@/lib/utils";
import ProductSelection from "@/components/ProductSelection"; // Client Component
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import ButtonSkeleton from "@/components/ui/button-skeleton";

export const DynamicProduct = async ({ params }: { params: { slug: string } }) => {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <div className="grid md:grid-cols-5 gap-3">
        <div className="md:col-span-4">
          <Image
            alt={product.imageAlt}
            className="object-contain w-full rounded-lg overflow-hidden"
            height="500"
            width="500"
            src={product.imageSrc}
          />
        </div>
      </div>

      <div className="grid gap-4 md:gap-10">
        {/* Product Details */}
        <div className="md:flex items-start">
          <div className="grid gap-4">
            <h1 className="font-bold text-3xl lg:text-4xl">{product.title}</h1>
            <p>{product.details}</p>
            <div className="text-4xl font-bold">{formatUSD(product.price)}</div>
          </div>
        </div>

        <div className="grid gap-4 md:gap-7">
          {/* Client-side Product Selection */}
          <ProductSelection product={product} />

          <Link
            href="/cart"
            prefetch={true}
            className={"w-full bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2 flex items-center justify-center"}
          >
            <ShoppingCart className="w-5 h-5 mr-2" /> View Cart
          </Link>
        </div>
      </div>
    </>
  );
};

// Skeleton Loader for Fallback
export const DynamicProductSkeleton = () => {
  return (
    <>
      <div className="grid md:grid-cols-5 gap-3">
        <div className="md:col-span-4">
          <Skeleton className="w-full h-96 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-4 md:gap-10">
        <div className="md:flex items-start">
          <div className="grid gap-4">
            <Skeleton className="w-96 h-6" />
            <div />
            <div className="text-4xl font-bold ml-auto" />
          </div>
        </div>

        <div className="grid gap-4 md:gap-10">
          <div className="grid gap-2">
            <Skeleton className="w-20 h-6" />
          </div>
          <div className="grid gap-2">
            <Skeleton className="w-20 h-6" />
          </div>
          <div className="space-y-2">
            <ButtonSkeleton />
            <Link
              href="/cart"
              prefetch={true}
              className={"w-full bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2 flex items-center justify-center"}
            >
              <ShoppingCart className="w-5 h-5 mr-2" /> View Cart
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
