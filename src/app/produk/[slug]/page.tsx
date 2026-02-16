import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import { Share2, Minus, Plus, ShoppingCart, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getPublicProductBySlug, getRelatedProducts } from "@/app/actions/product-public";
import { notFound } from "next/navigation";
import Link from "next/link";
// We need to make this a Server Component
// But it has interactive elements (quantity, tabs, slider).
// Best approach: Keep page.tsx as Server Component for fetching, 
// and extract the interactive detail view to a Client Component.

import ProductDetailClient from "@/components/public/ProductDetailClient";
import { getCustomerPricingData } from "@/app/actions/customer-pricing";
import { PricingProvider } from "@/lib/PricingContext";

// Since it's a dynamic route
export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    // Note: slug is actually the ID or siemens-<SKU>
    const product = await getPublicProductBySlug(slug);

    if (!product) {
        return notFound();
    }

    // --- REAL-TIME STOCK FETCHING ---
    let availableToSell = 0;
    try {
        const { fetchStockForProducts } = await import("@/lib/accurate");
        const stockMap = await fetchStockForProducts([product.sku]);
        const liveStock = stockMap.get(product.sku);
        if (liveStock !== undefined) {
            availableToSell = liveStock;
        }
    } catch (error) {
        console.error("Failed to fetch live stock for detail:", error);
    }

    // Create extended product object
    const productWithStock = {
        ...product,
        availableToSell
    };
    // --------------------------------

    const [relatedProducts, pricingData] = await Promise.all([
        getRelatedProducts(product.category || "", product.id),
        getCustomerPricingData(),
    ]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {/* Breadcrumb */}
                    <nav className="text-sm mb-4">
                        <ol className="flex items-center gap-2 flex-wrap">
                            <li><Link href="/" className="text-gray-500 hover:text-red-600">Beranda</Link></li>
                            <li className="text-gray-400">›</li>
                            <li><Link href="/pencarian" className="text-gray-500 hover:text-red-600">Produk</Link></li>
                            {product.category && (
                                <>
                                    <li className="text-gray-400">›</li>
                                    <li>
                                        <Link href={`/pencarian?category=${encodeURIComponent(product.category)}`} className="text-gray-500 hover:text-red-600">
                                            {product.category}
                                        </Link>
                                    </li>
                                </>
                            )}
                            <li className="text-gray-400">›</li>
                            <li className="text-gray-900 font-medium truncate max-w-[200px] uppercase">
                                {product.name}
                            </li>
                        </ol>
                    </nav>

                    <PricingProvider
                        initialCustomer={pricingData.customer}
                        initialMappings={pricingData.categoryMappings}
                        initialDiscountRules={pricingData.discountRules}
                    >
                        <ProductDetailClient product={productWithStock as any} relatedProducts={relatedProducts as any[]} />
                    </PricingProvider>

                </div>
            </main>

            <Footer />
        </div>
    );
}
