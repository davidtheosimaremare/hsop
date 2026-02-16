import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { getCategoriesTree, getPublicProducts, getBrands } from "@/app/actions/product-public";
import SidebarFilter from "@/components/public/SidebarFilter";
import ProductSort from "@/components/public/ProductSort";
import StockFilter from "@/components/public/StockFilter";
import ShareButton from "@/components/public/ShareButton";
import ProductGrid from "@/components/public/ProductGrid";
import { getCustomerPricingData } from "@/app/actions/customer-pricing";
import { PricingProvider } from "@/lib/PricingContext";

export const dynamic = "force-dynamic"; // Ensure fresh data on search

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;
    const pageSize = 20;
    const originalQuery = resolvedParams.q as string; // For display purposes
    const query = originalQuery || "Siemens"; // Default to Siemens for search
    const category = resolvedParams.category as string;
    const stockStatus = resolvedParams.stockStatus as string;
    const brand = resolvedParams.brand as string;
    const sortBy = (resolvedParams.sort as string) || "name-asc"; // Default to alphabetical

    const [categories, brands, { products, pagination }, pricingData] = await Promise.all([
        getCategoriesTree(),
        getBrands(),
        getPublicProducts({
            query,
            category,
            availability: stockStatus,
            brand,
            sort: sortBy,
            page,
            pageSize,
        }),
        getCustomerPricingData(),
    ]);


    const createPageUrl = (newPage: number) => {
        const params = new URLSearchParams();
        // Add all existing params
        Object.entries(resolvedParams).forEach(([key, value]) => {
            if (value && key !== "page") {
                if (Array.isArray(value)) {
                    value.forEach(v => params.append(key, v));
                } else {
                    params.append(key, value);
                }
            }
        });
        // Set new page
        params.set("page", newPage.toString());
        return `/pencarian?${params.toString()}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Page Title */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            {originalQuery ? `Hasil Pencarian: "${originalQuery}"` : "Seluruh Produk Kami"}
                        </h1>
                        <ShareButton className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 outline-none" text="Bagikan Halaman" />
                    </div>

                    <div className="flex gap-6 relative">
                        {/* Sidebar Filter */}
                        <SidebarFilter categories={categories as any} brands={brands} />

                        {/* Products Grid */}
                        <div className="flex-1">
                            {/* Results Info & Sort (Simplified for now, can be extracted to client component for interactivity) */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <p className="text-sm text-gray-600">
                                    Menampilkan <span className="font-medium">{products.length}</span> dari {pagination.total} produk
                                </p>
                                <div className="flex gap-2">
                                    <StockFilter />
                                    <ProductSort />
                                </div>
                            </div>

                            {/* Products */}
                            {products.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">Tidak ada produk ditemukan.</p>
                                </div>
                            ) : (
                                <PricingProvider
                                    initialCustomer={pricingData.customer}
                                    initialMappings={pricingData.categoryMappings}
                                    initialDiscountRules={pricingData.discountRules}
                                >
                                    <ProductGrid products={products} />
                                </PricingProvider>
                            )}

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    {/* Simple pagination: Previous */}
                                    {page > 1 ? (
                                        <Link
                                            href={createPageUrl(page - 1)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                                        >
                                            ‹
                                        </Link>
                                    ) : (
                                        <button disabled className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-300 cursor-not-allowed">‹</button>
                                    )}

                                    <span className="text-sm font-medium text-gray-700">
                                        Halaman {page} dari {pagination.totalPages}
                                    </span>

                                    {/* Next */}
                                    {page < pagination.totalPages ? (
                                        <Link
                                            href={createPageUrl(page + 1)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                                        >
                                            ›
                                        </Link>
                                    ) : (
                                        <button disabled className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-300 cursor-not-allowed">›</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
