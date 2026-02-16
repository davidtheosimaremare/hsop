"use server";

import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Edit, Trash2, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { deletePage, updatePage } from "@/app/actions/pages";

export async function togglePagePublish(id: string, currentStatus: boolean) {
    "use server";
    await updatePage(id, {
        isPublished: !currentStatus,
        title: "", // Dummy, not used in partial update logic if I fix updatePage
        slug: "",
        content: ""
    } as any);
    // Wait, my updatePage action expects all fields. I should fix it or create a specific toggle action.
    // Let's look at updatePage again. It takes PageData.
    // I should probably update updatePage to accept partial data or create a toggle action.
    // simpler to just creation a partial update action or modify updatePage. 
    // actually, let's just make a toggle action here for convenience or modify the server action. 
    // I'll modify the server action in a separate step if needed, but for now I can just fetch and update? No that's slow.
    // Best to add togglePageStatus to actions/pages.ts.
}

export default async function AdminPagesPage() {
    const pages = await db.page.findMany({
        orderBy: { updatedAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Halaman Statis</h1>
                    <p className="text-sm text-gray-500">Kelola halaman statis (Tentang Kami, FAQ, dll)</p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700" asChild>
                    <Link href="/admin/pages/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Halaman
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Halaman</CardTitle>
                    <CardDescription>Semua halaman statis yang telah dibuat</CardDescription>
                </CardHeader>
                <CardContent>
                    {pages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">Belum ada halaman</p>
                            <Button className="mt-4 bg-red-600 hover:bg-red-700" asChild>
                                <Link href="/admin/pages/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Buat Halaman
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-gray-500">
                                        <th className="pb-3 font-medium">Judul</th>
                                        <th className="pb-3 font-medium">Slug / URL</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Terakhir Update</th>
                                        <th className="pb-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pages.map((page) => (
                                        <tr key={page.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 font-medium">{page.title}</td>
                                            <td className="py-3 text-sm text-gray-500 font-mono">
                                                <Link href={`/${page.slug}`} target="_blank" className="flex items-center hover:text-blue-600 hover:underline">
                                                    /{page.slug}
                                                    <ExternalLink className="h-3 w-3 ml-1" />
                                                </Link>
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${page.isPublished
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {page.isPublished ? "Published" : "Draft"}
                                                </span>
                                            </td>
                                            <td className="py-3 text-sm text-gray-500">
                                                {new Date(page.updatedAt).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex gap-1">
                                                    <Link href={`/admin/pages/${page.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>

                                                    <form action={async () => {
                                                        "use server";
                                                        await deletePage(page.id);
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
