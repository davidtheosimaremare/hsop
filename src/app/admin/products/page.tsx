import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Package, Tag, AlertTriangle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import SyncButton from "@/components/admin/SyncButton";
import ProductTable from "@/components/admin/ProductTable";
import { Prisma } from "@prisma/client";
import Link from "next/link";

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

    // Construct Where Clause
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
    if (stockStatus === "available") {
        where.availableToSell = { gt: 0 };
    } else if (stockStatus === "out_of_stock") {
        where.availableToSell = { lte: 0 };
    }

    // Construct OrderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortField) {
        orderBy = { [sortField]: sortOrder };
    } else {
        // User requested default A-Z (Alphabetical by Name)
        orderBy = { name: "asc" };
    }

    // Fetch Data Logic
    let products: any[] = [];
    let totalProducts = 0;
    let brandsData: any[] = [];
    let categoriesData: any[] = [];
    let lowStockCount = 0;

    // Fetch filters metadata (always needed)
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

    if (query) {
        // Search Mode: Fetch ALL matches, then Sort & Paginate in Memory
        const allMatches = await db.product.findMany({
            where,
            orderBy: orderBy,
        });


        // Custom Ranking: Smart Search
        // 1. Starts With -> Highest Priority
        // 2. Index Of -> Earlier match is better ("Siemens acb" vs "Siemens acc acb")
        // 3. Length -> Shorter match is usually more relevant
        const lowerQuery = query.toLowerCase();
        allMatches.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            const aStarts = nameA.startsWith(lowerQuery);
            const bStarts = nameB.startsWith(lowerQuery);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            // If neither starts with (or both do), check index position
            const aIndex = nameA.indexOf(lowerQuery);
            const bIndex = nameB.indexOf(lowerQuery);

            if (aIndex !== bIndex) {
                return aIndex - bIndex; // Lower index (earlier occurrence) first
            }

            // If index is same, prefer shorter string (more specific match)
            if (nameA.length !== nameB.length) {
                return nameA.length - nameB.length;
            }

            return 0; // Maintain DB sort order
        });

        totalProducts = allMatches.length;
        products = allMatches.slice(skip, skip + pageSize);

    } else {
        // Normal Mode: Efficient DB Pagination
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

    // Construct queryParams string for the client component
    const urlParams = new URLSearchParams();
    if (query) urlParams.set('q', query);
    if (brandFilter !== 'all') urlParams.set('brand', brandFilter);
    if (categoryFilter !== 'all') urlParams.set('category', categoryFilter);
    if (stockStatus !== 'all') urlParams.set('stockStatus', stockStatus);
    urlParams.set('page', '1'); // Default page for sort reset
    urlParams.set('pageSize', pageSize.toString());
    const queryParamsString = urlParams.toString();

    const isFiltered = query || brandFilter !== 'all' || categoryFilter !== 'all' || stockStatus !== 'all';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Data Product</h1>
                <div className="flex gap-2">
                    <SyncButton />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-muted-foreground">Item terdaftar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Merk</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{brands.length}</div>
                        <p className="text-xs text-muted-foreground">Merk aktif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">Item &lt;= 5 unit</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="whitespace-nowrap">Filter & Pencarian</CardTitle>
                            {isFiltered && (
                                <Button variant="ghost" size="sm" asChild className="h-8 px-2 lg:px-3">
                                    <Link href="/admin/products">
                                        Reset Filter
                                        <X className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {/* Toolbar */}
                        <form className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    name="q"
                                    defaultValue={query}
                                    placeholder="Cari nama atau SKU..."
                                    className="pl-9 w-full"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                                <select
                                    name="brand"
                                    defaultValue={brandFilter}
                                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 md:flex-none md:w-[140px]"
                                >
                                    <option value="all">Semua Merk</option>
                                    {brands.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>

                                <select
                                    name="category"
                                    defaultValue={categoryFilter}
                                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 md:flex-none md:w-[140px]"
                                >
                                    <option value="all">Semua Kategori</option>
                                    {categories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>

                                <select
                                    name="stockStatus"
                                    defaultValue={stockStatus}
                                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 md:flex-none md:w-[140px]"
                                >
                                    <option value="all">Semua Stok</option>
                                    <option value="available">Tersedia (Ready)</option>
                                    <option value="out_of_stock">Habis (0)</option>
                                </select>

                                <select
                                    name="pageSize"
                                    defaultValue={pageSize}
                                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-[100px]"
                                >
                                    <option value="20">20 Items</option>
                                    <option value="50">50 Items</option>
                                    <option value="100">100 Items</option>
                                </select>

                                <Button type="submit" variant="default">Terapkan</Button>
                            </div>
                        </form>
                    </div>
                </CardHeader>
                <CardContent>
                    <ProductTable
                        products={products}
                        totalProducts={totalProducts}
                        skip={skip}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        queryParams={queryParamsString}
                    />

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            asChild={page > 1}
                        >
                            {page > 1 ? (
                                <Link href={`?page=${page - 1}&q=${query}&brand=${brandFilter}&category=${categoryFilter}&stockStatus=${stockStatus}&sort=${sortField}&order=${sortOrder}&pageSize=${pageSize}`}>Previous</Link>
                            ) : (
                                <span>Previous</span>
                            )}
                        </Button>
                        <div className="text-sm font-medium">
                            Page {page} of {totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            asChild={page < totalPages}
                        >
                            {page < totalPages ? (
                                <Link href={`?page=${page + 1}&q=${query}&brand=${brandFilter}&category=${categoryFilter}&stockStatus=${stockStatus}&sort=${sortField}&order=${sortOrder}&pageSize=${pageSize}`}>Next</Link>
                            ) : (
                                <span>Next</span>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
