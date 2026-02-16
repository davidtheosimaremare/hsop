"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { createPage, updatePage, previewSlug, PageData } from "@/app/actions/pages";

interface PageFormProps {
    initialData?: PageData & { id: string };
    isEdit?: boolean;
}

export function PageForm({ initialData, isEdit = false }: PageFormProps) {
    const router = useRouter();

    const [title, setTitle] = useState(initialData?.title || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
    const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");
    const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData?.slug);

    // Auto-generate slug from title if not manually edited
    useEffect(() => {
        const generateSlug = async () => {
            if (title && !slugManuallyEdited && !isEdit) {
                const generatedSlug = await previewSlug(title);
                setSlug(generatedSlug);
            }
        };
        generateSlug();
    }, [title, slugManuallyEdited, isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const data: PageData = {
                title,
                slug,
                content,
                metaTitle,
                metaDescription,
                isPublished,
            };

            let result;
            if (isEdit && initialData) {
                result = await updatePage(initialData.id, data);
            } else {
                result = await createPage(data);
            }

            if (result.success) {
                router.push("/admin/pages");
                router.refresh();
            } else {
                alert(result.error || "Terjadi kesalahan saat menyimpan halaman");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan sistem");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/pages">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEdit ? "Edit Halaman" : "Buat Halaman Baru"}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {isEdit ? "Perbarui konten halaman statis" : "Tambahkan halaman statis baru ke website"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Konten Utama</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Judul Halaman *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Contoh: Tentang Kami"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug URL *</Label>
                                <div className="flex">
                                    <div className="bg-gray-100 border border-r-0 rounded-l-md px-3 flex items-center text-sm text-gray-500">
                                        /
                                    </div>
                                    <Input
                                        id="slug"
                                        value={slug}
                                        onChange={(e) => {
                                            setSlug(e.target.value);
                                            setSlugManuallyEdited(true);
                                        }}
                                        className="rounded-l-none"
                                        placeholder="tentang-kami"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Alamat URL halaman ini nantinya. Gunakan huruf kecil dan tanda hubung (-).
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Konten *</Label>
                                <RichTextEditor
                                    content={content}
                                    onChange={setContent}
                                    placeholder="Tulis konten halaman di sini..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>SEO (Search Engine Optimization)</CardTitle>
                            <CardDescription>Optimalkan halaman ini untuk mesin pencari</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="metaTitle">Meta Title</Label>
                                <Input
                                    id="metaTitle"
                                    value={metaTitle}
                                    onChange={(e) => setMetaTitle(e.target.value)}
                                    placeholder={title || "Judul Halaman"}
                                />
                                <p className="text-xs text-gray-500">Judul yang muncul di tab browser dan hasil pencarian Google.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="metaDescription">Meta Description</Label>
                                <Textarea
                                    id="metaDescription"
                                    value={metaDescription}
                                    onChange={(e) => setMetaDescription(e.target.value)}
                                    placeholder="Deskripsi singkat halaman ini..."
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500">Deskripsi yang muncul di bawah judul pada hasil pencarian.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Publikasi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="isPublished">Publish Halaman?</Label>
                                <Switch
                                    id="isPublished"
                                    checked={isPublished}
                                    onCheckedChange={setIsPublished}
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                {isPublished
                                    ? "Halaman akan dapat diakses oleh publik."
                                    : "Halaman hanya tersimpan sebagai draft."
                                }
                            </p>

                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Simpan Halaman
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}
