
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Package, Tag, Layers, Archive, Info, EyeOff, FileText, Settings, Download, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ProductVisibilityToggle } from "@/components/admin/ProductVisibilityToggle";

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
                    {product.datasheet && (
                        <Button variant="outline" asChild>
                            <a href={product.datasheet} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Datasheet
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" asChild>
                        <Link href={`/admin/products/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Detail
                        </Link>
                    </Button>
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
                        <div className="aspect-square relative bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-dashed border-gray-300">
                            {product.image ? (
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="text-center p-4">
                                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                                    <span className="text-sm text-gray-400">Belum ada gambar</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-500 mb-2">
                                * Fitur upload gambar akan ditambahkan segera.
                            </p>
                            <Button variant="secondary" className="w-full" disabled>
                                Upload Gambar
                            </Button>
                        </div>
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
                                    <p className="font-medium">{product.brand || "-"}</p>
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    {/* Specifications Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" /> Spesifikasi Teknis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {specs && Object.keys(specs).length > 0 ? (
                                <div className="relative overflow-x-auto rounded-md border">
                                    <table className="w-full text-sm text-left rtl:text-right text-gray-700">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 w-1/3">Parameter</th>
                                                <th scope="col" className="px-6 py-3">Nilai</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(specs).map(([key, value], index) => (
                                                <tr key={key} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                    <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap border-r">
                                                        {key}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {String(value)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                    <p>Belum ada data spesifikasi teknis.</p>
                                    <p className="text-xs mt-1">Data akan otomatis terisi saat sinkronisasi dengan Siemens iMall.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Deskripsi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {product.description || "Tidak ada deskripsi."}
                            </p>

                            {/* Datasheet Link Bottom Alternative */}
                            {product.datasheet && (
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Dokumen Pendukung
                                    </h4>
                                    <a
                                        href={product.datasheet}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-red-600 hover:underline flex items-center gap-2"
                                    >
                                        Download Product Datasheet (PDF)
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
