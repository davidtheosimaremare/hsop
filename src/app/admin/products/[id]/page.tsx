
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Package, Tag, Layers, Archive, Info, EyeOff, FileText, Settings, Download, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ProductVisibilityToggle } from "@/components/admin/ProductVisibilityToggle";
import { ProductAutoUpdate } from "@/components/admin/ProductAutoUpdate";
import { EditableImageSection } from "@/components/admin/EditableImageSection";
import { EditableDescriptionSection } from "@/components/admin/EditableDescriptionSection";
import { EditableDatasheetSection } from "@/components/admin/EditableDatasheetSection";
import { EditableBrandSection } from "@/components/admin/EditableBrandSection";

export const dynamic = "force-dynamic";

export default async function AdminProductDetailPage({ params }: { params: { id: string } }) {
    // Await params object in Next.js 15+ compatible way
    const { id } = await params;

    const product = await db.product.findUnique({
        where: { id },
    });

    if (!product) {
        notFound();
    }

    // Cast specifications safely
    const specs = product.specifications as Record<string, string> | null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/products">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">


                    <ProductVisibilityToggle productId={id} isVisible={product.isVisible} />
                </div>
            </div>

            {/* Visibility Alert */}
            {!product.isVisible && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <EyeOff className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Produk ini sedang <strong>disembunyikan</strong>. Tidak akan muncul di hasil pencarian atau halaman depan website.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Image */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Gambar Produk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <EditableImageSection
                            productId={product.id}
                            sku={product.sku}
                            initialImage={product.image}
                            productName={product.name}
                        />
                    </CardContent>
                </Card>

                {/* Right Column: Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Produk</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Harga Satuan</label>
                                    <div className="text-xl font-bold">
                                        Rp {product.price.toLocaleString("id-ID")}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Stok Tersedia</label>
                                    <div className={`text-xl font-bold ${product.availableToSell <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                                        {product.availableToSell} Unit
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Layers className="h-4 w-4" /> Kategori
                                    </div>
                                    <p className="font-medium">{product.category || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Tag className="h-4 w-4" /> Merk
                                    </div>
                                    <EditableBrandSection
                                        productId={product.id}
                                        sku={product.sku}
                                        initialBrand={product.brand}
                                    />
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    {/* Datasheet Card */}
                    {/* Datasheet Card */}
                    <Card>
                        <CardContent className="pt-6">
                            <EditableDatasheetSection
                                productId={product.id}
                                sku={product.sku}
                                initialDatasheet={product.datasheet}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <EditableDescriptionSection
                                productId={product.id}
                                sku={product.sku}
                                initialDescription={product.description}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
