import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Package, Tag, Layers, Archive, Info, EyeOff, FileText, Settings, Download, Pencil, Activity, Database, ShoppingCart, Copy, Check, ExternalLink, Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ProductVisibilityToggle } from "@/components/admin/ProductVisibilityToggle";
import { ProductAutoUpdate } from "@/components/admin/ProductAutoUpdate";
import { EditableImageSection } from "@/components/admin/EditableImageSection";
import { EditableSliderImagesSection } from "@/components/admin/EditableSliderImagesSection";
import { EditableDescriptionSection } from "@/components/admin/EditableDescriptionSection";
import { EditableLongDescriptionSection } from "@/components/admin/EditableLongDescriptionSection";
import { EditableDatasheetSection } from "@/components/admin/EditableDatasheetSection";
import { EditableBrandSection } from "@/components/admin/EditableBrandSection";
import { ProductSkuCopy } from "@/components/admin/ProductSkuCopy";
import { PriceCopy } from "@/components/admin/PriceCopy";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    const product = await db.product.findFirst({
        where: {
            OR: [
                { id },
                { sku: decodeURIComponent(id) }
            ]
        },
    });

    if (!product) {
        notFound();
    }

    const specs = product.specifications as Record<string, string> | null;

    return (
        <div className="space-y-6 pb-20">
            {/* Compact Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button variant="outline" size="icon" asChild className="h-10 w-10 mt-1 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
                        <Link href="/admin/products">
                            <ArrowLeft className="h-4 w-4 text-slate-500" />
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{product.name}</h1>
                        <div className="flex items-center gap-2">
                            <div className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 group">
                                {product.sku}
                                <ProductSkuCopy sku={product.sku} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 text-white">
                    <Button variant="outline" size="sm" asChild className="h-10 border-slate-200 bg-white hover:bg-slate-50 shadow-sm text-slate-600 font-bold text-xs px-4 rounded-xl transition-all hover:text-red-600 border-dashed">
                        <Link href={`/produk/${product.sku}`} target="_blank">
                            <Eye className="w-4 h-4 mr-2" />
                            Lihat Produk
                        </Link>
                    </Button>
                    <ProductVisibilityToggle productId={product.id} isVisible={product.isVisible} />
                </div>
            </div>

            {/* Compact Info Banner */}


            {/* Compact Visibility Alert */}
            {!product.isVisible && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <EyeOff className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-orange-900 text-xs uppercase tracking-wider mb-0.5">Status: Tersembunyi</h4>
                        <p className="text-orange-700/80 text-xs font-medium leading-relaxed">
                            Produk ini tidak terlihat oleh pelanggan di etalase toko.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 self-start space-y-6">
                    <EditableImageSection
                        productId={product.id}
                        sku={product.sku}
                        brand={product.brand}
                        initialImage={product.image}
                        productName={product.name}
                    />
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <EditableSliderImagesSection
                            productId={product.id}
                            initialImages={(product as any).sliderImages || []}
                        />
                    </div>
                </div>

                {/* Right: Compact Info */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardContent className="p-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <Tag className="h-3 w-3" /> Harga Satuan
                                    </div>
                                    <div className="font-black text-lg text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100 flex items-center group">
                                        <span className="text-xs mr-1 opacity-70 flex items-baseline"><span className="mr-0.5">Rp</span></span>
                                        {product.price.toLocaleString("id-ID")}
                                        <PriceCopy price={product.price} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <Archive className="h-3 w-3" /> Stok Tersedia
                                    </div>
                                    <div className={cn(
                                        "font-black text-lg px-3 py-2 rounded-xl border",
                                        product.availableToSell <= 5 ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    )}>
                                        {product.availableToSell} <span className="text-xs opacity-70 ml-1">Unit</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <Layers className="h-3 w-3" /> Kategori
                                    </div>
                                    <div className="font-bold text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100/50">
                                        {product.category || "General"}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <Tag className="h-3 w-3" /> Brand
                                    </div>
                                    <div className="bg-slate-50 p-1 rounded-xl border border-slate-100/50">
                                        <EditableBrandSection
                                            productId={product.id}
                                            sku={product.sku}
                                            initialBrand={product.brand}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    <FileText className="h-3 w-3" /> Datasheet
                                </div>
                                <div className="bg-slate-50 rounded-xl border border-slate-100/50 border-dashed p-1">
                                    <EditableDatasheetSection
                                        productId={product.id}
                                        sku={product.sku}
                                        brand={product.brand}
                                        initialDatasheet={product.datasheet}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-50 py-4 px-5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-red-50 rounded-lg">
                                    <FileText className="w-3.5 h-3.5 text-red-600" />
                                </div>
                                <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest">Deskripsi</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="bg-slate-50 rounded-xl border border-slate-100/50 border-dashed p-1 min-h-[200px]">
                                <EditableDescriptionSection
                                    productId={product.id}
                                    sku={product.sku}
                                    initialDescription={product.description}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden mt-6">
                        <CardHeader className="border-b border-slate-50 py-4 px-5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-red-50 rounded-lg">
                                    <Layers className="w-3.5 h-3.5 text-red-600" />
                                </div>
                                <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest">Deskripsi Product Panjang (Rich Text)</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="bg-slate-50 rounded-xl border border-slate-100/50 border-dashed p-1 min-h-[300px]">
                                <EditableLongDescriptionSection
                                    productId={product.id}
                                    initialDescription={product.longDescription}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
