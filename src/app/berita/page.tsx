import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Calendar, User, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
    title: "Berita & Artikel | Hokiindo",
    description: "Berita terbaru seputar produk Siemens, tips dan informasi seputar kelistrikan dan automation.",
    openGraph: {
        title: "Berita & Artikel | Hokiindo",
        description: "Berita terbaru seputar produk Siemens, tips dan informasi seputar kelistrikan dan automation.",
    },
};

export const dynamic = "force-dynamic";

export default async function PublicNewsPage() {
    const news = await db.news.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">Berita & Artikel</h1>
                    <p className="mt-2 text-red-100">
                        Informasi terbaru seputar produk dan industri kelistrikan
                    </p>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/" className="hover:text-red-600">Beranda</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-gray-900">Berita</span>
                </nav>
            </div>

            {/* News Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {news.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500">Belum ada berita yang dipublikasikan</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {news.map((item) => (
                            <Link
                                key={item.id}
                                href={`/berita/${item.slug}`}
                                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Image */}
                                <div className="aspect-video bg-gray-100 overflow-hidden">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h2 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                                        {item.title}
                                    </h2>
                                    {item.excerpt && (
                                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                            {item.excerpt}
                                        </p>
                                    )}
                                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                                        {item.publishedAt && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(item.publishedAt).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                })}
                                            </span>
                                        )}
                                        {item.author && (
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {item.author}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
