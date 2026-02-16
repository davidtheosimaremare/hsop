import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper, Plus, Eye, EyeOff, Edit, Trash2, Calendar, Search } from "lucide-react";
import Link from "next/link";
import { deleteNews, togglePublish } from "@/app/actions/news";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
    const news = await db.news.findMany({
        orderBy: { createdAt: "desc" },
    });

    const publishedCount = news.filter(n => n.isPublished).length;
    const draftCount = news.filter(n => !n.isPublished).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Berita</h1>
                    <p className="text-sm text-gray-500">Kelola berita dan artikel</p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700" asChild>
                    <Link href="/admin/news/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Tulis Berita
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Newspaper className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{news.length}</p>
                                <p className="text-sm text-gray-500">Total Berita</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">{publishedCount}</p>
                            <p className="text-sm text-gray-500">Dipublikasikan</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-gray-400">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">{draftCount}</p>
                            <p className="text-sm text-gray-500">Draft</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* News List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Daftar Berita</CardTitle>
                            <CardDescription>Semua berita dan artikel yang telah dibuat</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {news.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">Belum ada berita</p>
                            <p className="text-sm">Tulis berita pertama Anda</p>
                            <Button className="mt-4 bg-red-600 hover:bg-red-700" asChild>
                                <Link href="/admin/news/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tulis Berita
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-gray-500">
                                        <th className="pb-3 font-medium">Gambar</th>
                                        <th className="pb-3 font-medium">Judul</th>
                                        <th className="pb-3 font-medium">Slug</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Tanggal</th>
                                        <th className="pb-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {news.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.title}
                                                        className="w-16 h-12 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                                                        <Newspaper className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                <p className="font-medium line-clamp-1">{item.title}</p>
                                                {item.excerpt && (
                                                    <p className="text-xs text-gray-500 line-clamp-1">{item.excerpt}</p>
                                                )}
                                            </td>
                                            <td className="py-3 text-gray-500 text-sm font-mono">
                                                /{item.slug}
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isPublished
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {item.isPublished ? "Published" : "Draft"}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-500 text-sm">
                                                {new Date(item.createdAt).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex gap-1">
                                                    <form action={async () => {
                                                        "use server";
                                                        await togglePublish(item.id);
                                                    }}>
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="sm"
                                                            title={item.isPublished ? "Unpublish" : "Publish"}
                                                        >
                                                            {item.isPublished ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </form>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/admin/news/${item.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <form action={async () => {
                                                        "use server";
                                                        await deleteNews(item.id);
                                                    }}>
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
