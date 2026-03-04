import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Package, Tag, AlertTriangle, X, Filter, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProductActionDropdown from "@/components/admin/ProductActionDropdown";
import ProductTable from "@/components/admin/ProductTable";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.pageSize) || 20;
    const query = params?.q?.toString() || "";
    const brandFilter = params?.brand?.toString() || "all";
    const categoryFilter = params?.category?.toString() || "all";
    const stockStatus = params?.stockStatus?.toString() || "all";
    const sortField = params?.sort?.toString() || "name";
    const sortOrder = params?.order?.toString() === "desc" ? "desc" : "asc";

    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {};
    if (query) {
        const terms = query.split(/\s+/).filter(Boolean);
        if (terms.length > 0) {
            where.AND = terms.map(term => ({
                OR: [
                    { name: { contains: term, mode: "insensitive" } },
                    { sku: { contains: term, mode: "insensitive" } },
                ]
            }));
        }
    }
    if (brandFilter && brandFilter !== "all") {
        where.brand = brandFilter;
    }
    if (categoryFilter && categoryFilter !== "all") {
        where.category = categoryFilter;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortField) {
        orderBy = { [sortField]: sortOrder };
    } else {
        orderBy = { name: "asc" };
    }

    let products: any[] = [];
    let totalProducts = 0;
    let brandsData: any[] = [];
    let categoriesData: any[] = [];
    let lowStockCount = 0;

    const [brandsRes, categoriesRes, lowStockRes] = await Promise.all([
        db.product.findMany({
            where: { brand: { not: null } },
            distinct: ['brand'],
            select: { brand: true },
            orderBy: { brand: 'asc' },
        }),
        db.product.findMany({
            where: { category: { not: null } },
            distinct: ['category'],
            select: { category: true },
            orderBy: { category: 'asc' },
        }),
        db.product.count({
            where: { availableToSell: { lte: 5 } }
        })
    ]);

    brandsData = brandsRes;
    categoriesData = categoriesRes;
    lowStockCount = lowStockRes;

    if (stockStatus === 'available') {
        where.availableToSell = { gt: 0 };
    } else if (stockStatus === 'out_of_stock') {
        where.availableToSell = { lte: 0 };
    }

    if (query) {
        const allMatches = await db.product.findMany({
            where,
            orderBy: orderBy,
        });

        const lowerQuery = query.toLowerCase();
        allMatches.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            const aStarts = nameA.startsWith(lowerQuery);
            const bStarts = nameB.startsWith(lowerQuery);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            const aIndex = nameA.indexOf(lowerQuery);
            const bIndex = nameB.indexOf(lowerQuery);
            if (aIndex !== bIndex) return aIndex - bIndex;
            if (nameA.length !== nameB.length) return nameA.length - nameB.length;
            return 0;
        });

        totalProducts = allMatches.length;
        products = allMatches.slice(skip, skip + pageSize);
    } else {
        const [productsRes, totalRes] = await Promise.all([
            db.product.findMany({
                where,
                orderBy,
                skip,
                take: pageSize,
            }),
            db.product.count({ where }),
        ]);
        products = productsRes;
        totalProducts = totalRes;
    }

    const totalPages = Math.ceil(totalProducts / pageSize);
    const brands = brandsData.map(b => b.brand).filter(Boolean) as string[];
    const categories = categoriesData.map(c => c.category).filter(Boolean) as string[];

    const urlParams = new URLSearchParams();
    if (query) urlParams.set('q', query);
    if (brandFilter !== 'all') urlParams.set('brand', brandFilter);
    if (categoryFilter !== 'all') urlParams.set('category', categoryFilter);
    if (stockStatus !== 'all') urlParams.set('stockStatus', stockStatus);
    urlParams.set('page', '1');
    urlParams.set('pageSize', pageSize.toString());
    const queryParamsString = urlParams.toString();

    const isFiltered = query || brandFilter !== 'all' || categoryFilter !== 'all' || stockStatus !== 'all';

    return (
        <div className="space-y-5 pb-10">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Katalog Produk</h1>
                    <p className="text-slate-500 font-medium">Kelola dan pantau seluruh inventaris barang Anda.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                        <ProductActionDropdown />
                    </div>
                </div>
            </div>

            {/* Clean Horizontal Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-sm transition-all group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-all">
                        <Package className="h-5 w-5 text-slate-400 group-hover:text-red-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">Total Produk</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-2xl font-black text-slate-900 leading-none">{totalProducts}</span>
                            <span className="text-[11px] font-bold text-slate-400">Item</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-sm transition-all group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-all">
                        <Tag className="h-5 w-5 text-slate-400 group-hover:text-red-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">Total Merk</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-2xl font-black text-slate-900 leading-none">{brands.length}</span>
                            <span className="text-[11px] font-bold text-slate-400">Brand</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-gradient-to-br from-red-50 to-white rounded-2xl p-4 border border-red-100 hover:shadow-sm transition-all group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center border border-red-200">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-0.5 truncate">Stok Menipis (≤ 5)</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-2xl font-black text-red-700 leading-none">{lowStockCount}</span>
                            <span className="text-[11px] font-bold text-red-500">Item</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border-none bg-white rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-50 py-3 px-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-red-50 rounded-lg">
                                <Filter className="w-4 h-4 text-red-600" />
                            </div>
                            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Filter Pencarian</CardTitle>
                        </div>
                        {isFiltered && (
                            <Button variant="ghost" size="sm" asChild className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold rounded-lg h-8 px-3 transition-all">
                                <Link href="/admin/products">
                                    Reset Filter
                                    <X className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="px-5 pt-3 pb-0">
                    <form className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end mb-2">
                        <div className="lg:col-span-4 space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Cari Produk</label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                                <Input
                                    name="q"
                                    defaultValue={query}
                                    placeholder="Nama atau SKU..."
                                    className="pl-9 h-10 bg-slate-50 border-transparent focus:bg-white focus:ring-red-600/20 focus:border-red-600 rounded-xl transition-all font-medium text-sm"
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Merk</label>
                            <select
                                name="brand"
                                defaultValue={brandFilter}
                                className="w-full h-10 bg-slate-50 border-transparent focus:bg-white border focus:border-red-600 focus:ring-0 rounded-xl px-3 text-sm font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Semua Merk</option>
                                {brands.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        <div className="lg:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Kategori</label>
                            <select
                                name="category"
                                defaultValue={categoryFilter}
                                className="w-full h-10 bg-slate-50 border-transparent focus:bg-white border focus:border-red-600 focus:ring-0 rounded-xl px-3 text-sm font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="lg:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Tampilan</label>
                            <select
                                name="pageSize"
                                defaultValue={pageSize}
                                className="w-full h-10 bg-slate-50 border-transparent focus:bg-white border focus:border-red-600 focus:ring-0 rounded-xl px-3 text-sm font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                            >
                                <option value="20">20 Items</option>
                                <option value="50">50 Items</option>
                                <option value="100">100 Items</option>
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <Button type="submit" className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all">
                                Terapkan
                            </Button>
                        </div>
                    </form>
                </CardContent>

                <div className="w-full">
                    <ProductTable
                        products={products}
                        totalProducts={totalProducts}
                        skip={skip}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        queryParams={queryParamsString}
                    />
                </div>

                {/* Footer: Pagination Legend & Controls */}
                <div className="px-5 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                        Menampilkan {products.length > 0 ? skip + 1 : 0}—{Math.min(skip + products.length, totalProducts)} Dari {totalProducts} DATA
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                            disabled={page <= 1}
                            asChild={page > 1}
                        >
                            {page > 1 ? (
                                <Link href={`?page=${page - 1}&q=${query}&brand=${brandFilter}&category=${categoryFilter}&stockStatus=${stockStatus}&sort=${sortField}&order=${sortOrder}&pageSize=${pageSize}`}>Sebelumnya</Link>
                            ) : (
                                <span>Sebelumnya</span>
                            )}
                        </Button>

                        <div className="px-4 h-9 flex items-center bg-slate-50 rounded-lg border border-slate-100/50">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Halaman {page} <span className="mx-2 text-slate-300">/</span> {totalPages || 1}
                            </span>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                            disabled={page >= totalPages}
                            asChild={page < totalPages}
                        >
                            {page < totalPages ? (
                                <Link href={`?page=${page + 1}&q=${query}&brand=${brandFilter}&category=${categoryFilter}&stockStatus=${stockStatus}&sort=${sortField}&order=${sortOrder}&pageSize=${pageSize}`}>Selanjutnya</Link>
                            ) : (
                                <span>Selanjutnya</span>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

