import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User, ChevronRight, ArrowLeft, ShoppingCart } from "lucide-react";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    const news = await db.news.findUnique({
        where: { slug },
    });

    if (!news) {
        return {
            title: "Berita Tidak Ditemukan | Hokiindo",
        };
    }

    return {
        title: news.metaTitle || news.title,
        description: news.metaDescription || news.excerpt || "",
        keywords: news.metaKeywords || undefined,
        openGraph: {
            title: news.metaTitle || news.title,
            description: news.metaDescription || news.excerpt || "",
            images: news.ogImage || news.image ? [{ url: news.ogImage || news.image! }] : undefined,
            type: "article",
            publishedTime: news.publishedAt?.toISOString(),
            authors: news.author ? [news.author] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: news.metaTitle || news.title,
            description: news.metaDescription || news.excerpt || "",
            images: news.ogImage || news.image ? [news.ogImage || news.image!] : undefined,
        },
    };
}

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: PageProps) {
    const { slug } = await params;

    const news = await db.news.findUnique({
        where: { slug, isPublished: true },
    });

    if (!news) {
        notFound();
    }

    // Get related products
    const relatedProducts = news.relatedProductIds.length > 0
        ? await db.product.findMany({
            where: { id: { in: news.relatedProductIds } },
            select: {
                id: true,
                name: true,
                sku: true,
                image: true,
                price: true,
            },
        })
        : [];

    // Get related news
    const relatedNews = await db.news.findMany({
        where: {
            isPublished: true,
            id: { not: news.id },
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-red-600">Beranda</Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/berita" className="hover:text-red-600">Berita</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-gray-900 line-clamp-1">{news.title}</span>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Title */}
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                        {news.title}
                    </h1>

                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                        {news.publishedAt && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(news.publishedAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric"
                                })}
                            </span>
                        )}
                        {news.author && (
                            <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {news.author}
                            </span>
                        )}
                    </div>
                </header>

                {/* Featured Image */}
                {news.image && (
                    <div className="mb-8 rounded-xl overflow-hidden">
                        <img
                            src={news.image}
                            alt={news.title}
                            className="w-full object-cover"
                        />
                    </div>
                )}

                {/* Article Content */}
                <div
                    className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-red-600"
                    dangerouslySetInnerHTML={{ __html: news.content }}
                />

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12 pt-8 border-t">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Produk Terkait</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {relatedProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/produk/${product.sku}`}
                                    className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="aspect-square bg-gray-50 overflow-hidden">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-400 mb-1">{product.sku}</p>
                                        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="mt-2 text-red-600 font-semibold">
                                            {formatPrice(product.price)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Back Link */}
                <div className="mt-12 pt-8 border-t">
                    <Link
                        href="/berita"
                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Daftar Berita
                    </Link>
                </div>
            </article>

            {/* Related News */}
            {relatedNews.length > 0 && (
                <section className="bg-white border-t py-12">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Berita Lainnya</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedNews.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/berita/${item.slug}`}
                                    className="group"
                                >
                                    {item.image && (
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                                        {item.title}
                                    </h3>
                                    {item.publishedAt && (
                                        <p className="mt-1 text-xs text-gray-400">
                                            {new Date(item.publishedAt).toLocaleDateString("id-ID")}
                                        </p>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

