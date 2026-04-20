"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save, Loader2, Info, Image as ImageIcon, X, Upload, Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { createVendorProductAction, getVendorCategoriesAction } from "@/app/actions/vendor-product";
import { uploadFile, uploadCroppedImage } from "@/app/actions/upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProductImageCropper } from "@/components/admin/ProductImageCropper";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function NewVendorProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    
    // Category selection states
    const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
    const [openCategory, setOpenCategory] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categorySearch, setCategorySearch] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            const result = await getVendorCategoriesAction();
            if (result.success && result.categories) {
                setCategories(result.categories);
            }
        };
        fetchCategories();
    }, []);

    const removeImage = () => {
        setImageUrl(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!selectedCategory) {
            toast.error("Kategori Barang wajib dipilih/diisi");
            return;
        }

        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            category: selectedCategory,
            sku: formData.get("sku") as string,
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            price: parseFloat(formData.get("price") as string) || 0,
            brand: formData.get("brand") as string,
            availableToSell: parseInt(formData.get("stock") as string) || 0,
            image: imageUrl,
        };

        const result = await createVendorProductAction(data);
        if (result.success) {
            toast.success("Produk berhasil ditambahkan dan sedang menunggu persetujuan");
            router.push("/vendor/products");
        } else {
            toast.error(result.error || "Gagal menambahkan produk");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
                        <Link href="/vendor/products">
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tambah Produk Baru</h1>
                        <p className="text-slate-500 font-medium">Lengkapi formulir di bawah ini untuk menambahkan produk ke katalog.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Info className="h-4 w-4 text-teal-600" />
                                    Informasi Dasar Produk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Nama Barang <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    <Input 
                                        id="name" 
                                        name="name" 
                                        placeholder="Masukkan nama lengkap produk (Contoh: Siemens S7-1200 CPU 1214C)" 
                                        required 
                                        className="h-12 rounded-xl border-slate-200 focus:ring-teal-500 bg-slate-50/30 focus:bg-white transition-all font-semibold" 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="sku" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                            Kode Barang (MLFB/ SKU) <span className="text-red-500 font-bold">*</span>
                                        </Label>
                                        <Input 
                                            id="sku" 
                                            name="sku" 
                                            placeholder="Contoh: 6ES7214-1AG40-0XB0" 
                                            required 
                                            className="h-12 rounded-xl border-slate-200 focus:ring-teal-500 bg-slate-50/30 focus:bg-white transition-all font-semibold" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="brand" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                            Merek Barang <span className="text-red-500 font-bold">*</span>
                                        </Label>
                                        <Input 
                                            id="brand" 
                                            name="brand" 
                                            placeholder="Contoh: Siemens, Schneider, Omron" 
                                            required 
                                            className="h-12 rounded-xl border-slate-200 focus:ring-teal-500 bg-slate-50/30 focus:bg-white transition-all font-semibold" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Deskripsi / Detail Produk (Opsional)
                                    </Label>
                                    <Textarea 
                                        id="description" 
                                        name="description" 
                                        placeholder="Berikan spesifikasi teknis atau detail lainnya mengenai produk..." 
                                        className="rounded-xl border-slate-200 focus:ring-teal-500 min-h-[150px] bg-slate-50/30 focus:bg-white transition-all font-medium leading-relaxed" 
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Save className="h-4 w-4 text-teal-600" />
                                    Harga & Ketersediaan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Def. Hrg. Jual Satuan (IDR) <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">Rp</span>
                                        <Input 
                                            id="price" 
                                            name="price" 
                                            type="number" 
                                            placeholder="0" 
                                            required 
                                            className="h-12 pl-12 rounded-xl border-slate-200 focus:ring-teal-500 bg-slate-50/30 focus:bg-white transition-all font-black text-lg" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Quantity / Stock <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    <Input 
                                        id="stock" 
                                        name="stock" 
                                        type="number" 
                                        placeholder="0" 
                                        required 
                                        className="h-12 rounded-xl border-slate-200 focus:ring-teal-500 bg-slate-50/30 focus:bg-white transition-all font-black text-lg" 
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Section */}
                    <div className="space-y-6">
                        {/* Image Upload Card */}
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
                                        Gunakan foto persegi (1:1) agar produk terlihat pas di katalog pencarian.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Klasifikasi</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Kategori Barang <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    
                                    <Popover open={openCategory} onOpenChange={setOpenCategory}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openCategory}
                                                className="w-full justify-between h-12 rounded-xl border-slate-200 bg-slate-50/30 font-semibold"
                                            >
                                                {selectedCategory || "Pilih atau ketik kategori..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0 rounded-xl" align="start">
                                            <Command className="rounded-xl">
                                                <CommandInput 
                                                    placeholder="Cari kategori..." 
                                                    value={categorySearch}
                                                    onValueChange={setCategorySearch}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        <div className="p-2">
                                                            <p className="text-xs text-slate-500 mb-2">Kategori tidak ditemukan.</p>
                                                            <Button 
                                                                type="button"
                                                                size="sm" 
                                                                className="w-full bg-teal-600 text-[10px] font-black uppercase tracking-widest h-8"
                                                                onClick={() => {
                                                                    setSelectedCategory(categorySearch);
                                                                    setOpenCategory(false);
                                                                }}
                                                            >
                                                                Buat "{categorySearch}"
                                                            </Button>
                                                        </div>
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {categories.map((cat) => (
                                                            <CommandItem
                                                                key={cat.id}
                                                                value={cat.name}
                                                                onSelect={(currentValue) => {
                                                                    setSelectedCategory(currentValue === selectedCategory ? "" : currentValue);
                                                                    setOpenCategory(false);
                                                                }}
                                                                className="font-bold text-xs"
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4 text-teal-600",
                                                                        selectedCategory === cat.name ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {cat.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-2">
                                        Tentukan kategori yang paling relevan agar pembeli lebih mudah menemukan produk Anda.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Button 
                                type="submit" 
                                disabled={loading || uploadingImage} 
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-600/20 transition-all active:scale-95"
                            >
                                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                Simpan Produk
                            </Button>
                            <Button variant="ghost" asChild className="w-full rounded-2xl h-12 text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <Link href="/vendor/products">Batalkan Perubahan</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
