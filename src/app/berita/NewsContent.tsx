"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Calendar, User, ChevronRight, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface NewsItem {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    image: string | null;
    author: string | null;
    publishedAt: string | null;
    createdAt: string;
}

interface NewsCategory {
    id: string;
    name: string;
    slug: string;
    count: number;
}

function NewsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [news, setNews] = useState<NewsItem[]>([]);
    const [categories] = useState<NewsCategory[]>([
        { id: "1", name: "Semua", slug: "all", count: 0 },
        { id: "2", name: "Produk", slug: "produk", count: 0 },
        { id: "3", name: "Industri", slug: "industri", count: 0 },
        { id: "4", name: "Tips & Trik", slug: "tips-trik", count: 0 },
        { id: "5", name: "Company", slug: "company", count: 0 },
    ]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    
    const ITEMS_PER_PAGE = 9;

    // Fetch news
    useEffect(() => {
        const fetchNews = async () => {
            setIsLoading(true);
            try {
                const category = searchParams.get("category") || "all";
                const search = searchParams.get("q") || "";
                const page = searchParams.get("page") || "1";
                
                const params = new URLSearchParams({
                    category,
                    q: search,
                    page,
                    limit: ITEMS_PER_PAGE.toString()
                });
                
                const response = await fetch(`/api/news?${params.toString()}`);
                const data = await response.json();
                
                setNews(data.news || []);
                setTotalPages(data.totalPages || 1);
                setTotalCount(data.total || 0);
                setCurrentPage(parseInt(page));
                setSelectedCategory(category);
                setSearchQuery(search);
            } catch (error) {
                console.error("Error fetching news:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchNews();
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams({
            q: searchQuery,
            page: "1",
            category: selectedCategory
        });
        router.push(`/berita?${params.toString()}`);
    };

    const handleCategoryChange = (categorySlug: string) => {
        const params = new URLSearchParams({
            category: categorySlug,
            page: "1",
            q: searchQuery
        });
        router.push(`/berita?${params.toString()}`);
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams({
            category: selectedCategory,
            q: searchQuery,
            page: page.toString()
        });
        router.push(`/berita?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 py-16 md:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Berita & Artikel
                    </h1>
                    <p className="text-red-100 text-base md:text-lg max-w-2xl mx-auto">
                        Informasi terbaru seputar produk Siemens, tips industri, dan automation
                    </p>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="border-b bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link prefetch={false}  href="/" className="hover:text-red-600 transition-colors">Beranda</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-gray-900 font-medium">Berita</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Search Box */}
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari artikel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>
                    </form>
                    
                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryChange(category.slug)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                                    selectedCategory === category.slug
                                        ? "bg-red-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-6 text-sm text-gray-500">
                    Menampilkan {totalCount} artikel
                </div>

                {/* News Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
                                <div className="aspect-video bg-gray-200" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-full" />
                                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : news.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Tidak ada artikel ditemukan
                        </h3>
                        <p className="text-gray-500">
                            Coba kata kunci lain atau pilih kategori berbeda
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {news.map((item) => (
                                <article
                                    key={item.id}
                                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-red-100 transition-all duration-300"
                                >
                                    {/* Image */}
                                    <Link prefetch={false}  href={`/berita/${item.slug}`} className="block">
                                        <div className="aspect-video bg-gray-100 overflow-hidden">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                                                    <div className="text-center p-4">
                                                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                        <p className="text-xs">No Image</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Content */}
                                    <div className="p-5">
                                        <Link prefetch={false}  href={`/berita/${item.slug}`}>
                                            <h2 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                {item.title}
                                            </h2>
                                        </Link>
                                        
                                        {item.excerpt && (
                                            <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                {item.excerpt}
                                            </p>
                                        )}

                                        {/* Meta */}
                                        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                                            <div className="flex items-center gap-3">
                                                {item.author && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5" />
                                                        {item.author}
                                                    </span>
                                                )}
                                                {item.publishedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {format(new Date(item.publishedAt), "dd MMM yyyy", { locale: idLocale })}
                                                    </span>
                                                )}
                                            </div>
                                            <Link prefetch={false} 
                                                href={`/berita/${item.slug}`}
                                                className="flex items-center gap-1 text-red-600 font-medium group-hover:gap-2 transition-all"
                                            >
                                                Baca
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Sebelumnya
                                </button>
                                
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePageChange(i + 1)}
                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                            currentPage === i + 1
                                                ? "bg-red-600 text-white"
                                                : "hover:bg-gray-100"
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default NewsContent;
