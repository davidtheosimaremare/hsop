"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save, Loader2, X, Image as ImageIcon, Package } from "lucide-react";
import Link from "next/link";
import { updateVendorProductAction } from "@/app/actions/vendor-product";
import { toast } from "sonner";
import { ProductImageCropper } from "@/components/admin/ProductImageCropper";

export default function EditVendorProductPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [product, setProduct] = useState<any>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            const res = await fetch(`/api/vendor/products/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data.product);
                setImageUrl(data.product.image);
            } else {
                toast.error("Gagal mengambil data produk");
                router.push("/vendor/products");
            }
            setFetching(false);
        };
        fetchProduct();
    }, [id, router]);

    const removeImage = () => setImageUrl(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            sku: formData.get("sku") as string,
            price: parseFloat(formData.get("price") as string) || 0,
            availableToSell: parseInt(formData.get("stock") as string) || 0,
            category: formData.get("category") as string,
            brand: formData.get("brand") as string,
            description: formData.get("description") as string,
            image: imageUrl,
        };

        const result = await updateVendorProductAction(id, data);
        if (result.success) {
            toast.success("Produk berhasil diperbarui dan menunggu persetujuan ulang");
            router.push("/vendor/products");
        } else {
            toast.error(result.error || "Gagal memperbarui produk");
            setLoading(false);
        }
    };

    if (fetching) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-teal-600" /></div>;
    if (!product) return <div className="p-8 text-center font-bold text-slate-400">Produk tidak ditemukan</div>;

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
                    <Link href="/vendor/products">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ubah Produk</h1>
                    <p className="text-slate-500 font-medium">Perbarui informasi produk Anda untuk diverifikasi ulang.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    Informasi Dasar Produk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500">Nama Produk</Label>
                                    <Input id="name" name="name" defaultValue={product.name} required className="h-12 rounded-xl border-slate-200 focus:ring-teal-500 font-semibold" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="sku" className="text-xs font-black uppercase tracking-widest text-slate-500">Kode Barang (SKU)</Label>
                                        <Input id="sku" name="sku" defaultValue={product.sku} className="h-12 rounded-xl border-slate-200 focus:ring-teal-500 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="brand" className="text-xs font-black uppercase tracking-widest text-slate-500">Merek</Label>
                                        <Input id="brand" name="brand" defaultValue={product.brand || ""} className="h-12 rounded-xl border-slate-200 focus:ring-teal-500 font-semibold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-slate-500">Deskripsi Singkat</Label>
                                    <Textarea id="description" name="description" defaultValue={product.description || ""} className="rounded-xl border-slate-200 focus:ring-teal-500 min-h-[150px] leading-relaxed" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Harga & Ketersediaan</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-xs font-black uppercase tracking-widest text-slate-500">Harga Jual (Rp)</Label>
                                    <Input id="price" name="price" type="number" defaultValue={product.price} required className="h-12 rounded-xl border-slate-200 focus:ring-teal-500 font-black text-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock" className="text-xs font-black uppercase tracking-widest text-slate-500">Stok Tersedia</Label>
                                    <Input id="stock" name="stock" type="number" defaultValue={product.availableToSell} required className="h-12 rounded-xl border-slate-200 focus:ring-teal-500 font-black text-lg" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Image Card */}
                        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-teal-600" />
                                    Gambar Produk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {imageUrl ? (
                                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group">
                                            <img src={imageUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button 
                                                    type="button" 
                                                    variant="destructive" 
                                                    size="icon" 
                                                    onClick={removeImage}
                                                    className="rounded-full h-10 w-10 shadow-lg"
                                                >
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <ProductImageCropper 
                                            onImageUploaded={(url) => setImageUrl(url)}
                                        />
                                    )}
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed text-center italic">
                                        Tips: Gunakan foto persegi (1:1) agar produk terlihat pas di katalog pencarian.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Kategori</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-xs font-black uppercase tracking-widest text-slate-500">Kategori Barang</Label>
                                    <Input id="category" name="category" defaultValue={product.category || ""} placeholder="Contoh: PLC" className="h-12 rounded-xl border-slate-200 focus:ring-teal-500 font-semibold" />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-600/20 transition-all active:scale-95">
                                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                Simpan Perubahan
                            </Button>
                            <Button variant="ghost" asChild className="w-full rounded-2xl h-12 text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <Link href="/vendor/products">Batal</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
