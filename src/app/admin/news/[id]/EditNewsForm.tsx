"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, ExternalLink, X, Search, Package } from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { updateNews } from "@/app/actions/news";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";

interface News {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    image: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    ogImage: string | null;
    isPublished: boolean;
    author: string | null;
    relatedProductIds: string[];
}

interface Product {
    id: string;
    name: string;
    sku: string;
    image: string | null;
}

interface EditNewsFormProps {
    news: News;
    products: Product[];
    selectedProductsData: Product[];
}

export function EditNewsForm({ news, products, selectedProductsData }: EditNewsFormProps) {
    const router = useRouter();

    const [content, setContent] = useState(news.content);
    const [isPublished, setIsPublished] = useState(news.isPublished);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track dirty state
    const [isDirty, setIsDirty] = useState(false);

    // Initial state for comparison
    const [initialState] = useState({
        content: news.content,
        isPublished: news.isPublished,
        image: news.image || "",
        title: news.title,
        excerpt: news.excerpt || "",
        relatedProductIds: news.relatedProductIds
    });

    const [title, setTitle] = useState(news.title);
    const [excerpt, setExcerpt] = useState(news.excerpt || "");

    // Image upload
    const [image, setImage] = useState(news.image || "");

    // Related products
    const [selectedProducts, setSelectedProducts] = useState<Product[]>(selectedProductsData);
    const [productSearch, setProductSearch] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Warning hook
    const { WarningDialog } = useUnsavedChangesWarning(isDirty && !isSubmitting);

    // Check for changes
    useEffect(() => {
        const hasChanges =
            content !== initialState.content ||
            isPublished !== initialState.isPublished ||
            image !== initialState.image ||
            title !== initialState.title ||
            excerpt !== initialState.excerpt ||
            JSON.stringify(selectedProducts.map(p => p.id).sort()) !== JSON.stringify(initialState.relatedProductIds.sort());

        setIsDirty(hasChanges);
    }, [content, isPublished, image, title, excerpt, selectedProducts, initialState]);

    // Filter products for search
    const filteredProducts = products.filter(p =>
        !selectedProducts.find(sp => sp.id === p.id) &&
        (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    ).slice(0, 10);

    const addProduct = (product: Product) => {
        if (selectedProducts.length < 3) {
            setSelectedProducts([...selectedProducts, product]);
        }
        setProductSearch("");
        setShowProductDropdown(false);
    };

    const removeProduct = (productId: string) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setIsDirty(false); // Disable warning on submit

        try {
            const formData = new FormData(e.currentTarget);
            formData.set("title", title);
            formData.set("excerpt", excerpt);
            formData.set("content", content);
            formData.set("isPublished", isPublished.toString());
            formData.set("image", image);
            formData.set("author", "Admin"); // Default author
            // Auto-set ogImage from main image
            if (image) {
                formData.set("ogImage", image);
            }
            formData.set("relatedProductIds", JSON.stringify(selectedProducts.map(p => p.id)));

            await updateNews(news.id, formData);
            router.push("/admin/news");
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan berita");
            setIsSubmitting(false);
            setIsDirty(true); // Re-enable warning if failed
        }
    };

    return (
        <div className="space-y-6">
            <WarningDialog />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/news">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Berita</h1>
                        <p className="text-sm text-gray-500">Perbarui artikel berita</p>
                    </div>
                </div>
                <Button variant="outline" asChild>
                    <a href={`/berita/${news.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Lihat
                    </a>
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Konten</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Judul Berita *</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Masukkan judul berita"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Slug URL</Label>
                                    <p className="text-sm text-gray-500 font-mono bg-gray-50 p-3 rounded-lg border">
                                        /berita/<span className="text-blue-600">{news.slug}</span>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="excerpt">Ringkasan</Label>
                                    <Textarea
                                        id="excerpt"
                                        name="excerpt"
                                        value={excerpt}
                                        onChange={(e) => setExcerpt(e.target.value)}
                                        placeholder="Ringkasan singkat berita (opsional)"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Konten Berita *</Label>
                                    <RichTextEditor
                                        content={content}
                                        onChange={setContent}
                                        placeholder="Tulis konten berita di sini..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Related Products */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Produk Terkait</CardTitle>
                                <CardDescription>Pilih maksimal 3 produk yang berhubungan dengan artikel</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Selected Products */}
                                {selectedProducts.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
                                            >
                                                {product.image && (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-8 h-8 object-cover rounded"
                                                    />
                                                )}
                                                <span className="text-sm font-medium">{product.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProduct(product.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Product Search */}
                                {selectedProducts.length < 3 && (
                                    <div className="relative">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Cari produk..."
                                                value={productSearch}
                                                onChange={(e) => {
                                                    setProductSearch(e.target.value);
                                                    setShowProductDropdown(true);
                                                }}
                                                onFocus={() => setShowProductDropdown(true)}
                                                className="pl-10"
                                            />
                                        </div>

                                        {/* Dropdown */}
                                        {showProductDropdown && productSearch && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                                                {filteredProducts.length === 0 ? (
                                                    <div className="p-3 text-sm text-gray-500 text-center">
                                                        Tidak ada produk ditemukan
                                                    </div>
                                                ) : (
                                                    filteredProducts.map((product) => (
                                                        <button
                                                            key={product.id}
                                                            type="button"
                                                            onClick={() => addProduct(product)}
                                                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                                                        >
                                                            {product.image ? (
                                                                <img
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    className="w-10 h-10 object-cover rounded"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                                                    <Package className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium">{product.name}</p>
                                                                <p className="text-xs text-gray-500">{product.sku}</p>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* SEO Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>SEO Settings</CardTitle>
                                <CardDescription>Optimasi untuk mesin pencari</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="metaTitle">Meta Title</Label>
                                    <Input
                                        id="metaTitle"
                                        name="metaTitle"
                                        defaultValue={news.metaTitle || ""}
                                        placeholder="Judul untuk SEO (default: judul berita)"
                                    />
                                    <p className="text-xs text-gray-500">Maksimal 60 karakter</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="metaDescription">Meta Description</Label>
                                    <Textarea
                                        id="metaDescription"
                                        name="metaDescription"
                                        defaultValue={news.metaDescription || ""}
                                        placeholder="Deskripsi untuk SEO (default: ringkasan)"
                                        rows={2}
                                    />
                                    <p className="text-xs text-gray-500">Maksimal 160 karakter</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="metaKeywords">Meta Keywords</Label>
                                    <Input
                                        id="metaKeywords"
                                        name="metaKeywords"
                                        defaultValue={news.metaKeywords || ""}
                                        placeholder="Kata kunci, pisahkan dengan koma"
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-700">
                                        💡 OG Image akan otomatis diambil dari gambar utama
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Publikasi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="isPublished">Status Publish</Label>
                                    <Switch
                                        id="isPublished"
                                        checked={isPublished}
                                        onCheckedChange={setIsPublished}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    {isPublished
                                        ? "Berita akan dipublikasikan"
                                        : "Berita akan disimpan sebagai draft"
                                    }
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Gambar Utama</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ImageCropper
                                    currentImage={image}
                                    onImageUploaded={setImage}
                                    onRemove={() => setImage("")}
                                />
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-2">
                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Simpan Perubahan
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
