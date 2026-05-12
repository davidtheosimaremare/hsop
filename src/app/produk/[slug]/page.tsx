import { Suspense } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { getPublicProductBySlug, getRelatedProducts } from "@/app/actions/product-public";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getProductSlug } from "@/lib/utils";

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

    // Format Title: [SKU] - [BRAND prefix if not duplicate] [NAME]
    let brandPrefix = "";
    if (product.brand && !product.name.toLowerCase().includes(product.brand.toLowerCase())) {
        brandPrefix = `${product.brand.toUpperCase()} `;
    }
    const metaTitle = product.metaTitle || `${product.sku} - ${brandPrefix}${product.name}`;
    
    let descBrandPrefix = "";
    if (product.brand && !product.name.toLowerCase().includes(product.brand.toLowerCase())) {
        descBrandPrefix = `${product.brand} `;
    }
    let defaultDesc = `Katalog ${descBrandPrefix}${product.name} (${product.sku}). Beli online produk ${product.category || 'Electrical'} terpercaya hanya di Hokiindo Raya.`;
    if (defaultDesc.length > 155) {
        const baseString = `Katalog  (). Beli online produk ${product.category || 'Electrical'} terpercaya hanya di Hokiindo Raya.`;
        const availableSpace = 155 - baseString.length - product.sku.length;
        if (availableSpace > 10) {
            const truncatedName = product.name.slice(0, availableSpace) + "...";
            defaultDesc = `Katalog ${descBrandPrefix}${truncatedName} (${product.sku}). Beli online produk ${product.category || 'Electrical'} terpercaya hanya di Hokiindo Raya.`;
        }
    }
    const metaDesc = product.metaDescription || defaultDesc;

    // Generate dynamic keywords from SKU, Title (Brand + Name), and Description
    const keywordsSet = new Set<string>();
    
    // 1. Dari SKU
    if (product.sku) {
        keywordsSet.add(product.sku.toLowerCase());
        // Tambahkan juga bagian-bagian SKU yang dipisah tanda strip
        product.sku.split('-').forEach(part => {
            if (part.length > 2) {
                keywordsSet.add(part.toLowerCase());
            }
        });
    }

    // 2. Dari Brand & Kategori
    if (product.brand) keywordsSet.add(product.brand.toLowerCase());
    if (product.category) keywordsSet.add(product.category.toLowerCase());

    // 3. Dari Nama Produk (Title)
    product.name.toLowerCase().split(/[\s,/\-\(\)]+/).forEach((word: string) => {
        if (word.length > 2 && !['dan', 'dengan', 'untuk', 'yang', 'dari', 'bisa', 'beli', 'murah', 'distributor', 'harga', 'jual', 'agen', 'ready', 'stock', 'original', 'orisinil', 'the', 'and', 'for', 'with'].includes(word)) {
            keywordsSet.add(word);
        }
    });

    // 4. Dari Deskripsi (metaDesc)
    metaDesc.toLowerCase().split(/[\s,/\-\(\)\.]+/).forEach((word: string) => {
        if (word.length > 3 && !['dan', 'dengan', 'untuk', 'yang', 'dari', 'bisa', 'beli', 'murah', 'distributor', 'harga', 'jual', 'agen', 'ready', 'stock', 'original', 'orisinil', 'katalog', 'terpercaya', 'hanya', 'terlengkap', 'kebutuhan', 'proyek', 'electrical', 'indonesia', 'the', 'and', 'for', 'with', 'this'].includes(word)) {
            keywordsSet.add(word);
        }
    });

    const keywords = Array.from(keywordsSet).slice(0, 15).join(', ');

    const firstImage = product.image || (product.sliderImages && product.sliderImages.length > 0 ? product.sliderImages[0] : null);
    const productSlug = getProductSlug(product);

    return {
        title: { absolute: metaTitle },
        description: metaDesc.substring(0, 160),
        keywords,
        openGraph: {
            title: metaTitle,
            description: metaDesc,
            url: `https://shop.hokiindo.co.id/produk/${productSlug}`,
            type: 'website',
            images: firstImage ? [{ url: firstImage, width: 800, height: 600, alt: product.name }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: metaTitle,
            description: metaDesc,
            images: firstImage ? [firstImage] : [],
        },
        alternates: {
            canonical: `https://shop.hokiindo.co.id/produk/${productSlug}`,
        }
    };
}


export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = await getPublicProductBySlug(slug);

    if (!product) {
        const cleanQuery = slug.replace(/-/g, ' ');
        permanentRedirect(`/pencarian?q=${encodeURIComponent(cleanQuery)}`);
    }

    let availableToSell = product.availableToSell || 0;

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
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    {/* Breadcrumb - instant */}
                    <nav className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-5 select-none">
                        <ol className="flex items-center gap-2 flex-wrap text-[#64748b]">
                            <li><Link prefetch={false} href="/" className="hover:text-red-500 transition-colors">Beranda</Link></li>
                            <li className="text-slate-300">/</li>
                            <li><Link prefetch={false} href="/pencarian" className="hover:text-red-500 transition-colors">Produk</Link></li>
                            {product.category && (
                                <>
                                    <li className="text-slate-300">/</li>
                                    <li>
                                        <Link prefetch={false} href={`/pencarian?category=${encodeURIComponent(product.category)}`} className="hover:text-red-500 transition-colors">
                                            {product.category}
                                        </Link>
                                    </li>
                                </>
                            )}
                            <li className="text-slate-300">/</li>
                            <li className="text-slate-900 truncate max-w-[200px] font-black">
                                {product.name}
                            </li>
                        </ol>
                    </nav>

                    {/* Stream the product detail: shows skeleton first, then full content */}
                    <Suspense fallback={<ProductDetailSkeleton product={productWithStock} />}>
                        <ProductContentWrapper product={productWithStock as any} />
                    </Suspense>

                </div>
            </main>

            <Footer />
        </div>
    );
}

/**
 * Async server component that fetches heavy data (pricing, related products)
 * and renders the full interactive product detail.
 */
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

/**
 * Rich skeleton that shows actual product info (name, image, SKU) immediately
 * while heavy data (pricing, related products) loads in background.
 */
function ProductDetailSkeleton({ product }: { product: any }) {
    const galleryImages = [
        product.image,
        ...(product.sliderImages || [])
    ].filter(Boolean) as string[];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 p-6">
                {/* Left: Real product image */}
                <div className="w-full lg:w-[500px] flex-shrink-0 flex flex-col gap-4">
                    <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                        {galleryImages[0] ? (
                            <img
                                src={galleryImages[0]}
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-gray-300 text-sm">No Image</div>
                        )}
                    </div>
                    {galleryImages.length > 1 && (
                        <div className="flex gap-2 lg:gap-4 overflow-hidden">
                            {galleryImages.slice(0, 4).map((img, idx) => (
                                <div key={idx} className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                    <img src={img} alt="" className="w-full h-full object-contain" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Real product info + skeleton for price */}
                <div className="flex-1 flex flex-col pt-2 lg:pt-4">
                    {/* Brand - real */}
                    {product.brand && (
                        <span className="text-sm font-medium text-red-600 uppercase tracking-wide mb-2">
                            {product.brand}
                        </span>
                    )}
                    {/* Product name - real */}
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 uppercase">
                        {product.name}
                    </h1>
                    {/* SKU - real */}
                    <p className="text-sm text-gray-500 mb-6">SKU: {product.sku}</p>

                    {/* Price area - skeleton (loading) */}
                    <div className="animate-pulse space-y-3 mb-8">
                        <div className="h-8 bg-gray-200 rounded w-48"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>

                    {/* Stock status - skeleton */}
                    <div className="animate-pulse bg-gray-100 rounded-xl p-4 mb-6 space-y-4">
                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </div>
                    
                    {/* Buttons - skeleton */}
                    <div className="animate-pulse flex flex-wrap items-center gap-4 mt-auto">
                        <div className="h-12 bg-gray-200 rounded w-32"></div>
                        <div className="h-12 bg-gray-200 rounded flex-1"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
