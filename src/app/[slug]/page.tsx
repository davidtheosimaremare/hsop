import { db } from "@/lib/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    const page = await db.page.findUnique({
        where: { slug },
    });

    if (!page) {
        return {
            title: "Halaman Tidak Ditemukan | Hokiindo",
        };
    }

    return {
        title: page.metaTitle || page.title,
        description: page.metaDescription || "",
        openGraph: {
            title: page.metaTitle || page.title,
            description: page.metaDescription || "",
            type: "website",
        },
    };
}

export const dynamic = "force-dynamic";

export default async function DynamicPage({ params }: PageProps) {
    const { slug } = await params;

    const page = await db.page.findUnique({
        where: { slug, isPublished: true },
    });

    if (!page) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader />

            {/* Breadcrumb Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-red-600">Beranda</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-gray-900 line-clamp-1">{page.title}</span>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="bg-white rounded-2xl shadow-sm p-6 md:p-10">
                    <header className="mb-8 border-b pb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            {page.title}
                        </h1>
                    </header>

                    <div
                        className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-red-600 prose-img:rounded-xl"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                </article>
            </main>

            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}
