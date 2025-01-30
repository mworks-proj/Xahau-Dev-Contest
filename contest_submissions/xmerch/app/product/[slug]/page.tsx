import { Suspense } from "react";
import { DynamicProduct, DynamicProductSkeleton } from "./dynamic-product";
import { products } from "@/lib/products";
import RelatedProducts, { RelatedProductsSkeleton } from "@/components/related-products";

export const generateStaticParams = () => {
  return products.map((product) => ({
    slug: product.slug,
  }));
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params; // Resolve the promise to get the actual `slug`
  const { slug } = resolvedParams;

  return (
    <main className="max-w-5xl mx-auto py-6 px-4 md:px-6">
      <section className="grid md:grid-cols-2 gap-6 lg:gap-12 items-start py-4 md:py-8 lg:py-12">
        <Suspense fallback={<DynamicProductSkeleton />}>
          <DynamicProduct params={resolvedParams} />
        </Suspense>
      </section>
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProducts params={resolvedParams} />
      </Suspense>
    </main>
  );
}
