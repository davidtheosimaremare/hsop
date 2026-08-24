import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Metadata } from "next";
import { getCategoriesTree, getPublicProducts, getBrands, getProductSpecFilters } from "@/app/actions/product-public";
import { getSiteSetting } from "@/app/actions/settings";
import SidebarFilter from "@/components/public/SidebarFilter";
import ProductGrid from "@/components/public/ProductGrid";
import { getCustomerPricingData } from "@/app/actions/customer-pricing";
import { PricingProvider } from "@/lib/PricingContext";
import Link from "next/link";
import ShareButton from "@/components/public/ShareButton";

/**
 * Converts a URL slug back to a category name.
 * e.g. "circuit-breaker" → matches category "CIRCUIT BREAKER"
 */
function slugToCategoryName(slug: string): string {
    return slug.replace(/-/g, " ").toUpperCase();
}

/**
 * Converts a category name to a URL slug.
 * e.g. "CIRCUIT BREAKER" → "circuit-breaker"
 */
export function categoryToSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const categoryName = slugToCategoryName(slug);

    // Try to find the exact category from DB
    const category = await db.category.findFirst({
        where: {
            isVisible: true,
            name: { equals: categoryName, mode: "insensitive" },
        },
        select: { name: true },
    });

    const displayName = category?.name || categoryName;
    const canonicalUrl = `https://shop.hokiindo.co.id/kategori/${slug}`;

    return {
        title: `${displayName} | Distributor Resmi Hokiindo Raya`,
        description: `Jelajahi koleksi produk ${displayName} terlengkap untuk kebutuhan kelistrikan industri. Jaminan 100% orisinil, bersertifikat resmi, hanya di Hokiindo Raya.`,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: `${displayName} | Hokiindo Raya`,
            description: `Produk ${displayName} orisinil & bergaransi resmi.`,
            url: canonicalUrl,
            type: "website",
        },
    };
}

export default async function CategorySlugPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const categoryName = slugToCategoryName(slug);

    // Verify category exists
    const category = await db.category.findFirst({
        where: {
            isVisible: true,
            name: { equals: categoryName, mode: "insensitive" },
        },
        select: { name: true },
    });

    // If category not found, redirect to search
    if (!category) {
        redirect(`/pencarian?q=${encodeURIComponent(categoryName)}`);
    }

    const page = Number(resolvedSearchParams.page) || 1;
    const pageSize = 20;
    const sortBy = (resolvedSearchParams.sort as string) || "name-asc";

    const [categories, brands, { products, pagination }, pricingData, specFilters, hidePriceRules] =
        await Promise.all([
            getCategoriesTree(),
            getBrands(),
            getPublicProducts({
                category: category.name,
                sort: sortBy,
                page,
                pageSize,
            }),
            getCustomerPricingData(),
            getProductSpecFilters({ category: category.name }),
            getSiteSetting("hide_price_rules"),
        ]);

    const createPageUrl = (newPage: number) => {
        return `/kategori/${slug}?page=${newPage}`;
    };

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${category.name} — Hokiindo Raya`,
        description: `Produk ${category.name} orisinil & bergaransi resmi di Hokiindo Raya.`,
        url: `https://shop.hokiindo.co.id/kategori/${slug}`,
        breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Beranda", item: "https://shop.hokiindo.co.id/" },
                { "@type": "ListItem", position: 2, name: "Kategori", item: "https://shop.hokiindo.co.id/kategori" },
                { "@type": "ListItem", position: 3, name: category.name },
            ],
        },
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Header */}
            <div className="mb-6 select-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
                    <div>
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mb-2">
                            <Link href="/" className="hover:text-red-500 transition-colors">Beranda</Link>
                            <span className="text-slate-300">/</span>
                            <Link href="/kategori" className="hover:text-red-500 transition-colors">Kategori</Link>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-500 font-black">{category.name}</span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                            Kategori: <span className="text-red-600 font-black">{category.name}</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">{pagination.total} produk ditemukan</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <ShareButton
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-all border border-slate-200 shadow-2xs outline-none"
                            text="Bagikan Halaman"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-4 relative">
                {/* Sidebar Filter */}
                <SidebarFilter categories={categories as any} brands={brands} specFilters={specFilters} />

                {/* Products Area */}
                <div className="flex-1">
                    {products.length === 0 ? (
                        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center">
                            <h3 className="text-base font-extrabold text-[#0f172a] mb-1">Tidak Ada Produk Ditemukan</h3>
                            <p className="text-xs text-[#64748b] max-w-sm mb-6 leading-relaxed">
                                Belum ada produk tersedia untuk kategori ini.
                            </p>
                            <Link href="/pencarian" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all">
                                Lihat Semua Produk
                            </Link>
                        </div>
                    ) : (
                        <PricingProvider
                            initialCustomer={pricingData.customer}
                            initialMappings={pricingData.categoryMappings}
                            initialDiscountRules={pricingData.discountRules}
                            initialHidePriceRules={hidePriceRules as any}
                        >
                            <ProductGrid products={products} total={pagination.total} activeFiltersNode={null} />
                        </PricingProvider>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2.5 mt-8 py-5 border-t border-slate-100">
                            {page > 1 ? (
                                <Link prefetch={false} href={createPageUrl(page - 1)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] hover:text-red-600 hover:border-red-500 hover:shadow-sm transition-all font-bold text-sm">
                                    ‹
                                </Link>
                            ) : (
                                <button disabled className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed text-sm">‹</button>
                            )}

                            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-xl border border-[#e2e8f0] shadow-xs">
                                <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Halaman</span>
                                <span className="text-xs font-black text-[#0f172a]">{page}</span>
                                <span className="text-[10px] text-[#94a3b8] font-bold">/</span>
                                <span className="text-xs font-black text-[#64748b]">{pagination.totalPages}</span>
                            </div>

                            {page < pagination.totalPages ? (
                                <Link prefetch={false} href={createPageUrl(page + 1)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] hover:text-red-600 hover:border-red-500 hover:shadow-sm transition-all font-bold text-sm">
                                    ›
                                </Link>
                            ) : (
                                <button disabled className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed text-sm">›</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
