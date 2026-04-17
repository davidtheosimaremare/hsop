"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { updateVendorProductAction } from "@/app/actions/vendor-product";
import { toast } from "sonner";

export default function EditVendorProductPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [product, setProduct] = useState<any>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            const res = await fetch(`/api/vendor/products/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data.product);
            } else {
                toast.error("Gagal mengambil data produk");
                router.push("/vendor/products");
            }
            setFetching(false);
        };
        fetchProduct();
    }, [id, router]);

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

    if (fetching) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
    if (!product) return <div>Produk tidak ditemukan</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/vendor/products">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ubah Produk</h1>
                    <p className="text-slate-500 font-medium">Perbarui informasi produk Anda.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-sm bg-white rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Informasi Produk</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Produk <span className="text-red-500">*</span></Label>
                                    <Input id="name" name="name" defaultValue={product.name} required className="rounded-xl border-slate-200 focus:ring-teal-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sku">SKU</Label>
                                        <Input id="sku" name="sku" defaultValue={product.sku} className="rounded-xl border-slate-200 focus:ring-teal-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="brand">Merk / Brand</Label>
                                        <Input id="brand" name="brand" defaultValue={product.brand || ""} className="rounded-xl border-slate-200 focus:ring-teal-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Deskripsi Singkat</Label>
                                    <Textarea id="description" name="description" defaultValue={product.description || ""} className="rounded-xl border-slate-200 focus:ring-teal-500 min-h-[120px]" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Harga & Stok</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Harga Jual (Rp) <span className="text-red-500">*</span></Label>
                                    <Input id="price" name="price" type="number" defaultValue={product.price} required className="rounded-xl border-slate-200 focus:ring-teal-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stok Tersedia <span className="text-red-500">*</span></Label>
                                    <Input id="stock" name="stock" type="number" defaultValue={product.availableToSell} required className="rounded-xl border-slate-200 focus:ring-teal-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-none shadow-sm bg-white rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Kategori</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Pilih Kategori</Label>
                                    <Input id="category" name="category" defaultValue={product.category || ""} className="rounded-xl border-slate-200 focus:ring-teal-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-teal-600/20 transition-all">
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Simpan Perubahan
                            </Button>
                            <Button variant="ghost" asChild className="w-full rounded-xl h-12 text-slate-500 font-bold">
                                <Link href="/vendor/products">Batal</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
