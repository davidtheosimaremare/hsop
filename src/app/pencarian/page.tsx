import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { getCategoriesTree, getPublicProducts, getBrands, getProductSpecFilters } from "@/app/actions/product-public";
import SidebarFilter from "@/components/public/SidebarFilter";
import ShareButton from "@/components/public/ShareButton";
import ProductGrid from "@/components/public/ProductGrid";
import { getCustomerPricingData } from "@/app/actions/customer-pricing";
import { PricingProvider } from "@/lib/PricingContext";
import { Metadata } from "next";

export const dynamic = "force-dynamic"; // Ensure fresh data on search

export async function generateMetadata({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
    const resolvedParams = await searchParams;
    const category = resolvedParams.category as string;
    const brand = resolvedParams.brand as string;
    const q = resolvedParams.q as string;
    const pole = resolvedParams.pole as string;
    const ampere = resolvedParams.ampere as string;
    const breakingCapacity = resolvedParams.breakingCapacity as string;
    const stockStatus = resolvedParams.stockStatus as string;
    const page = resolvedParams.page as string;
    
    // 1. Build Canonical URL with ALL active parameters
    let canonical = 'https://shop.hokiindo.co.id/pencarian';
    const params = new URLSearchParams();
    const keys = ["category", "brand", "q", "pole", "ampere", "breakingCapacity", "stockStatus", "page"];
    keys.forEach(key => {
        const val = resolvedParams[key];
        if (val) {
            if (Array.isArray(val)) {
                val.forEach(v => params.append(key, v));
            } else {
                params.set(key, val as string);
            }
        }
    });
    
    const queryString = params.toString();
    if (queryString) {
        canonical += `?${queryString}`;
    }

    // 2. Build Title with ALL active parameters
    let titleParts: string[] = [];
    if (q) {
        titleParts.push(`Cari "${q}"`);
    }
    if (brand) {
        titleParts.push(brand);
    }
    if (category) {
        titleParts.push(category);
    }
    if (pole) {
        titleParts.push(pole);
    }
    if (ampere) {
        titleParts.push(`${ampere}A`);
    }
    if (breakingCapacity) {
        titleParts.push(breakingCapacity);
    }
    if (stockStatus && stockStatus !== "all") {
        titleParts.push(stockStatus === "ready" ? "Ready Stock" : "Indent");
    }
    if (page && page !== "1") {
        titleParts.push(`Halaman ${page}`);
    }
    
    let titleStr = titleParts.join(" ");
    if (!titleStr) {
        titleStr = "Katalog Alat Kelistrikan & Lampu Tambang | Orisinil & Garansi Resmi | PT Hokiindo Raya";
    } else {
        titleStr = `${titleStr} | Jaminan Orisinil & Garansi Resmi | PT Hokiindo Raya`;
    }

    // 3. Build Description with ALL active parameters
    let descParts: string[] = [];
    if (brand) descParts.push(brand);
    if (category) descParts.push(category);
    if (pole) descParts.push(pole);
    if (ampere) descParts.push(`${ampere}A`);
    if (breakingCapacity) descParts.push(breakingCapacity);
    
    let specStr = descParts.join(" ");
    let description = "";
    if (q) {
        description = `Cari produk ${q} ${specStr ? `(${specStr})` : ''} terlengkap hanya di Hokiindo Raya. Jaminan 100% orisinil, tersertifikasi, dengan dukungan purna jual terpercaya.`;
    } else if (specStr) {
        description = `Katalog produk ${specStr} terlengkap hanya di Hokiindo Raya. Jaminan 100% orisinil, bersertifikat resmi, untuk kebutuhan proyek kelistrikan Anda.`;
    } else {
        description = "Jelajahi produk kelistrikan industri, otomasi pabrik, hingga portable light tower terlengkap. Jaminan 100% orisinil, tersertifikasi, hanya di Hokiindo Raya.";
    }

    // 4. Build Keywords/Tags with ALL active parameters
    const keywordsSet = new Set<string>([
        "hokiindo raya", 
        "siemens indonesia", 
        "distributor siemens",
        "distributor lampu proyek",
        "lampu portable",
        "lampu tambang",
        "distributor kelistrikan",
        "supplier electrical jakarta",
        "distributor electrical indonesia",
        "distributor resmi siemens",
        "sirkuit breaker siemens",
        "alat kelistrikan industri",
        "otomatisasi pabrik",
        "panel listrik",
        "electrical contractor indonesia",
        "portable light tower",
        "siemens switchgear",
        "siemens acb mccb mcb"
    ]);
    if (brand) keywordsSet.add(brand.toLowerCase());
    if (category) keywordsSet.add(category.toLowerCase());
    if (q) keywordsSet.add(q.toLowerCase());
    if (pole) keywordsSet.add(pole.toLowerCase());
    if (ampere) keywordsSet.add(`${ampere}a`.toLowerCase());
    if (breakingCapacity) keywordsSet.add(breakingCapacity.toLowerCase());
    
    const keywords = Array.from(keywordsSet).join(", ");
    
    return {
        title: titleStr,
        description: description.substring(0, 160),
        keywords,
        alternates: {
            canonical,
        }
    };
}

function getCategoryDescription(categoryName: string | null): string {
    if (!categoryName) {
        return "Jelajahi produk kelistrikan industri, otomasi pabrik, hingga portable light tower terlengkap. Jaminan 100% orisinil, tersertifikasi, dengan dukungan teknis purna jual profesional.";
    }

    const normalized = categoryName.toLowerCase();

    if (normalized.includes("air circuit") || normalized.includes("acb")) {
        return "Fungsi Utama: Pemutus sirkuit udara tegangan rendah berkapasitas besar. Berfungsi sebagai proteksi utama (main incoming) pada panel distribusi utama (LVMDP) terhadap beban berlebih, hubung singkat, dan gangguan tanah guna mengamankan sirkuit kelistrikan utama gedung atau pabrik.";
    }
    if (normalized.includes("molded case") || normalized.includes("mccb")) {
        return "Fungsi Utama: Pengaman dan pemutus sirkuit otomatis berkapasitas menengah hingga tinggi. Berfungsi melindungi motor, transformator, dan kabel distribusi dari bahaya hubung singkat (short circuit) serta beban lebih (overload) pada sistem kelistrikan 3-fasa industri.";
    }
    if (normalized.includes("miniature") || normalized.includes("mcb")) {
        return "Fungsi Utama: Proteksi sirkuit cabang berkapasitas rendah. Berfungsi memutuskan aliran listrik secara cepat ketika mendeteksi beban lebih maupun korsleting listrik pada instalasi penerangan, soket daya, serta sirkuit kontrol mesin industri skala kecil.";
    }
    if (normalized.includes("contactor") || normalized.includes("kontaktik") || normalized.includes("kontaktor")) {
        return "Fungsi Utama: Sakelar elektromagnetik otomatis untuk beban arus kuat. Berfungsi mengendalikan, menghubungkan, dan memutus sirkuit listrik berdaya tinggi secara remote (jarak jauh), terutama untuk kontrol motor listrik, pemanas, pompa air, dan otomatisasi pabrik.";
    }
    if (normalized.includes("overload") || normalized.includes("tor") || normalized.includes("relay")) {
        return "Fungsi Utama: Proteksi termal khusus untuk motor listrik. Berfungsi mendeteksi panas berlebih akibat kelebihan beban mekanis atau hilangnya salah satu fasa (single phasing), dan memicu kontaktor untuk memutus aliran daya guna mencegah kumparan motor terbakar.";
    }
    if (normalized.includes("lighting") || normalized.includes("light tower") || normalized.includes("portable light")) {
        return "Fungsi Utama: Solusi pencahayaan modular area terbuka berdaya tinggi. Berfungsi menyediakan penerangan intensitas tinggi yang andal, portabel, dan tahan cuaca ekstrim untuk proyek konstruksi malam hari, tambang, tanggap darurat bencana, serta operasional lapangan.";
    }
    if (normalized.includes("busbar") || normalized.includes("chasis")) {
        return "Fungsi Utama: Sistem distribusi daya terintegrasi berkapasitas tinggi. Berfungsi menghantarkan arus listrik utama secara efisien, rapi, dan aman di dalam panel listrik, menggantikan sistem kabel konvensional untuk meminimalkan rugi daya (power loss) dan panas berlebih.";
    }
    if (normalized.includes("protection") || normalized.includes("proteksi")) {
        return "Fungsi Utama: Sistem proteksi kelistrikan komprehensif. Berfungsi melindungi aset kelistrikan industri, sirkuit distribusi, dan operator dari bahaya beban lebih, hubungan pendek, gangguan isolasi, serta fluktuasi arus yang tidak stabil.";
    }
    if (normalized.includes("control") || normalized.includes("kontrol") || normalized.includes("kendali")) {
        return "Fungsi Utama: Perangkat kendali dan otomatisasi industri. Berfungsi mengatur, mengukur, serta mengotomatisasi pengoperasian mesin dan beban kelistrikan di pabrik secara aman, presisi, dan terintegrasi dengan sistem kontrol pusat.";
    }

    // Default dynamic description for other categories
    return `Jelajahi koleksi produk kategori ${categoryName} terlengkap untuk kebutuhan kelistrikan industri, otomatisasi pabrik, dan instalasi panel kelistrikan Anda. Jaminan 100% orisinil dengan dukungan purna jual profesional.`;
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;
    const pageSize = 20;
    const originalQuery = resolvedParams.q as string; // For display purposes
    const query = originalQuery; // Removed "Siemens" default here to allow empty searching for categories
    const category = resolvedParams.category as string;
    const stockStatus = resolvedParams.stockStatus as string;
    const brand = resolvedParams.brand as string;
    const sortBy = (resolvedParams.sort as string) || "name-asc"; // Default to alphabetical
    const pole = resolvedParams.pole as string;
    const ampere = resolvedParams.ampere as string;
    const breakingCapacity = resolvedParams.breakingCapacity as string;

    const [categories, brands, { products, pagination }, pricingData, specFilters] = await Promise.all([
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
            pole,
            ampere,
            breakingCapacity,
        }),
        getCustomerPricingData(),
        getProductSpecFilters({ query, category, brand }),
    ]);

    let categoryDisplayName = category;
    if (category) {
        // Flatten the tree to search easily
        const allCats = categories.reduce((acc, current) => {
            acc.push(current as any);
            if ((current as any).children) acc.push(...(current as any).children);
            return acc;
        }, [] as any[]);

        const matchingCat = allCats.find(c => c.name === category);
        if (matchingCat && matchingCat.alias) {
            categoryDisplayName = matchingCat.alias;
        }
    }

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

    // Build active filters for summary bar
    const activeFilters = [
        resolvedParams.brand && { key: "brand", label: `Brand: ${resolvedParams.brand}` },
        resolvedParams.category && { key: "category", label: `Kategori: ${categoryDisplayName}` },
        resolvedParams.pole && { key: "pole", label: `Kutub: ${resolvedParams.pole}` },
        resolvedParams.ampere && { key: "ampere", label: `Arus: ${resolvedParams.ampere}A` },
        resolvedParams.breakingCapacity && { key: "breakingCapacity", label: `Breaking: ${resolvedParams.breakingCapacity}` },
        resolvedParams.stockStatus && resolvedParams.stockStatus !== "all" && { 
            key: "stockStatus", 
            label: resolvedParams.stockStatus === "ready" ? "Status: Ready Stock" : "Status: Indent" 
        },
    ].filter(Boolean) as { key: string; label: string }[];

    const createRemoveFilterUrl = (keyToRemove: string) => {
        const params = new URLSearchParams();
        Object.entries(resolvedParams).forEach(([key, value]) => {
            if (value && key !== keyToRemove && key !== "page") {
                if (Array.isArray(value)) {
                    value.forEach(v => params.append(key, v));
                } else {
                    params.append(key, value);
                }
            }
        });
        return `/pencarian?${params.toString()}`;
    };

    // Render Active Filters Node as a prop for sticky desktop placement
    const activeFiltersNode = activeFilters.length > 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 flex flex-wrap items-center gap-2 shadow-sm">
            <span className="text-[10px] md:text-xs font-bold text-[#64748b] mr-1 uppercase tracking-wider">Filter Aktif:</span>
            {activeFilters.map((filter) => (
                <Link
                    prefetch={false}
                    key={filter.key}
                    href={createRemoveFilterUrl(filter.key)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] md:text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg border border-red-100/60 transition-all group"
                    title={`Hapus filter ${filter.label}`}
                >
                    <span>{filter.label}</span>
                    <svg className="w-3 h-3 text-red-400 group-hover:text-red-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Link>
            ))}
            <Link
                prefetch={false}
                href="/pencarian"
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] md:text-xs font-bold text-[#64748b] hover:text-red-600 transition-colors ml-auto border border-dashed border-slate-200 hover:border-red-200 rounded-lg"
            >
                Bersihkan Semua
            </Link>
        </div>
    ) : null;

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
            <SiteHeader />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    
                    {/* Clean & Simple Header Title Section */}
                    <div className="mb-6 select-none">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
                            <div>
                                {/* Premium Breadcrumb */}
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mb-2">
                                    <Link href="/" className="hover:text-red-500 transition-colors">Beranda</Link>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-slate-500 font-black">Produk</span>
                                </div>
                                
                                <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                                    {originalQuery ? (
                                        <span className="flex flex-wrap items-center gap-x-2">
                                            Hasil Pencarian <span className="text-red-600 font-black">"{originalQuery}"</span>
                                        </span>
                                    ) : category ? (
                                        <span>Kategori: <span className="text-red-600 font-black">{categoryDisplayName}</span></span>
                                    ) : (
                                        <span>Seluruh Katalog <span className="text-red-600 font-black">Produk</span></span>
                                    )}
                                </h1>
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
                        {/* Sidebar Filter Component */}
                        <SidebarFilter categories={categories as any} brands={brands} specFilters={specFilters} />

                        {/* Products Area */}
                        <div className="flex-1">
                             {/* Products Rendering Block */}
                             {products.length === 0 ? (
                                 <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center">
                                     <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4 animate-pulse">
                                         <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                         </svg>
                                     </div>
                                     <h3 className="text-base font-extrabold text-[#0f172a] mb-1">Tidak Ada Produk Ditemukan</h3>
                                     <p className="text-xs text-[#64748b] max-w-sm mb-6 leading-relaxed">
                                         Maaf, kriteria pencarian Anda tidak cocok dengan produk apapun dalam katalog kami. Silakan coba periksa kembali kata kunci atau bersihkan filter aktif.
                                     </p>
                                     <div className="flex gap-2">
                                         {activeFilters.length > 0 && (
                                             <Link 
                                                 href="/pencarian" 
                                                 className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                                             >
                                                 Bersihkan Filter
                                             </Link>
                                         )}
                                         <Link 
                                             href="/" 
                                             className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-red-500/10"
                                         >
                                             Kembali ke Beranda
                                         </Link>
                                     </div>
                                 </div>
                             ) : (
                                 <PricingProvider
                                     initialCustomer={pricingData.customer}
                                     initialMappings={pricingData.categoryMappings}
                                     initialDiscountRules={pricingData.discountRules}
                                 >
                                     <ProductGrid products={products} total={pagination.total} activeFiltersNode={activeFiltersNode} />
                                 </PricingProvider>
                             )}

                            {/* Custom Polished Pagination Component */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2.5 mt-8 py-5 border-t border-slate-100">
                                    {/* Previous Page */}
                                    {page > 1 ? (
                                        <Link prefetch={false} 
                                            href={createPageUrl(page - 1)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] hover:text-red-600 hover:border-red-500 hover:shadow-sm active:bg-slate-50 transition-all font-bold text-sm"
                                        >
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

                                    {/* Next Page */}
                                    {page < pagination.totalPages ? (
                                        <Link prefetch={false} 
                                            href={createPageUrl(page + 1)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] hover:text-red-600 hover:border-red-500 hover:shadow-sm active:bg-slate-50 transition-all font-bold text-sm"
                                        >
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
            </main>

            <Footer />
        </div>
    );
}
