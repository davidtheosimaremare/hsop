import { Suspense } from "react";
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
import { getSiteSetting } from "@/app/actions/settings";
import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { slug } = await params;
    const product: any = await getPublicProductBySlug(slug);

    if (!product) {
        return {
            title: "Produk Tidak Ditemukan - Hokiindo",
            description: "Produk yang Anda cari tidak tersedia."
        };
    }

    const companyDetails = await getSiteSetting("company_details") as any;
    const siteTitle = companyDetails?.siteTitle || companyDetails?.name || "Hokiindo";

    // Use custom meta if exists, otherwise fallback to smart default
    const metaTitle = product.metaTitle || `${product.name} ${product.sku} - ${product.category || 'Distributor Resmi'} | ${siteTitle}`;
    
    // Construct default description showing key elements
    const defaultDesc = `Katalog ${product.brand || 'Siemens'} ${product.name} (${product.sku}). Beli online produk ${product.category || 'Electrical'} terpercaya hanya di ${siteTitle}.`;
    const metaDesc = product.metaDescription || defaultDesc;

    // Use primary image or fallback
    const firstImage = product.image || (product.sliderImages && product.sliderImages.length > 0 ? product.sliderImages[0] : null);
    
    // Previous metadata images (if you wanted to merge images, typically not needed for products)
    // const previousImages = (await parent).openGraph?.images || []

    return {
        title: metaTitle,
        description: metaDesc.substring(0, 160), // SEO optimal length
        alternates: {
            canonical: `https://shop.hokiindo.co.id/produk/${encodeURIComponent(product.sku)}`
        },
        openGraph: {
            title: metaTitle,
            description: metaDesc,
            url: `https://shop.hokiindo.co.id/produk/${encodeURIComponent(product.sku)}`,
            type: 'website',
            images: firstImage ? [{ url: firstImage, width: 800, height: 600, alt: product.name }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: metaTitle,
            description: metaDesc,
            images: firstImage ? [firstImage] : [],
        }
    };
}


// Since it's a dynamic route
export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    // Note: slug is actually the ID or siemens-<SKU>
    const product = await getPublicProductBySlug(slug);

    if (!product) {
        return notFound();
    }

    // --- STOCK DARI DATABASE INTERNAL ---
    let availableToSell = product.availableToSell || 0;

    // Create extended product object
    const productWithStock = {
        ...product,
        availableToSell
    };

    // === JSON-LD Structured Data Schema ===
    const firstImage = product.image || (product.sliderImages?.length > 0 ? product.sliderImages[0] : "");
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: firstImage ? [firstImage] : [],
        description: product.metaDescription || product.description || `Beli ${product.name} murah di Hokiindo`,
        sku: product.sku,
        brand: {
            '@type': 'Brand',
            name: product.brand || 'Siemens'
        },
        offers: {
            '@type': 'Offer',
            url: `https://shop.hokiindo.co.id/produk/${encodeURIComponent(product.sku)}`,
            priceCurrency: 'IDR',
            price: product.price,
            availability: availableToSell > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition'
        }
    };
    
    // Optional breadcrumb JSON-LD
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://shop.hokiindo.co.id/' },
            { '@type': 'ListItem', position: 2, name: 'Produk', item: 'https://shop.hokiindo.co.id/pencarian' },
            ...(product.category ? [{ '@type': 'ListItem', position: 3, name: product.category, item: `https://shop.hokiindo.co.id/pencarian?category=${encodeURIComponent(product.category)}` }] : []),
            { '@type': 'ListItem', position: product.category ? 4 : 3, name: product.name }
        ]
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
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

                    <Suspense fallback={<ProductSkeleton />}>
                        <ProductContentWrapper product={productWithStock as any} />
                    </Suspense>

                </div>
            </main>

            <Footer />
        </div>
    );
}

async function ProductContentWrapper({ product }: { product: any }) {
    const [relatedProducts, pricingData, whatsappConfig] = await Promise.all([
        getRelatedProducts(product.category || "", product.id, product.name),
        getCustomerPricingData(),
        getSiteSetting("whatsapp_config") as Promise<Record<string, string> | null>
    ]);

    return (
        <PricingProvider
            initialCustomer={pricingData.customer}
            initialMappings={pricingData.categoryMappings}
            initialDiscountRules={pricingData.discountRules}
        >
            <ProductDetailClient 
                product={product} 
                relatedProducts={relatedProducts as any[]} 
                whatsappConfig={whatsappConfig}
            />
        </PricingProvider>
    );
}

function ProductSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
                <div className="space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        </div>
    );
}
