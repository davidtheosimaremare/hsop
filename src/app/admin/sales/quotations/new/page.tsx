"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2, ArrowLeft, PlusCircle, Trash2, Search, Check, Save
} from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCustomersForQuotation, getProductsForQuotation, createAdminQuotation } from "@/app/actions/admin-quotation";

export default function NewQuotationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Data
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Form State
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<any[]>([]);

    // Combobox states
    const [openCustomer, setOpenCustomer] = useState(false);
    const [openProduct, setOpenProduct] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            const [custRes, prodRes] = await Promise.all([
                getCustomersForQuotation(),
                getProductsForQuotation()
            ]);
            if (custRes.success) setCustomers(custRes.customers);
            if (prodRes.success) setProducts(prodRes.products);
            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    const handleAddProduct = (prod: any) => {
        const exist = items.find(i => i.productSku === prod.sku);
        if (exist) {
            setItems(items.map(i => i.productSku === prod.sku ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setItems([...items, {
                productSku: prod.sku,
                productName: prod.name,
                brand: prod.brand || "-",
                price: prod.price,
                quantity: 1
            }]);
        }
        setOpenProduct(false);
    };

    const updateQuantity = (sku: string, qty: number) => {
        if (qty < 1) return;
        setItems(items.map(i => i.productSku === sku ? { ...i, quantity: qty } : i));
    };

    const updatePrice = (sku: string, val: number) => {
        if (val < 0) return;
        setItems(items.map(i => i.productSku === sku ? { ...i, price: val } : i));
    };

    const removeItem = (sku: string) => {
        setItems(items.filter(i => i.productSku !== sku));
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const fmtPrice = (p: number) => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(p));

    const handleSubmit = async () => {
        if (!selectedCustomerId) return toast.error("Silakan pilih customer");
        if (items.length === 0) return toast.error("Silakan tambahkan minimal 1 barang");

        setIsSaving(true);
        const res = await createAdminQuotation({
            customerId: selectedCustomerId,
            notes,
            items
        });

        if (res.success) {
            toast.success("Penawaran (HRSQ) berhasil dibuat!");
            router.push(`/admin/sales/quotations/${res.id}`);
        } else {
            toast.error(res.error || "Gagal membuat penawaran");
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    return (
        <div className="space-y-6 max-w-5xl pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10 shrink-0 rounded-xl">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Buat Penawaran Baru</h1>
                        <p className="text-sm font-medium text-slate-500">Draft HRSQ akan otomatis dikirimkan ke Accurate setelah disubmit.</p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="h-10 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide shadow-md shadow-red-200"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Simpan & Sync
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Col: Customer & Info */}
                <div className="space-y-6">
                    <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest">Informasi Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400">Pilih Customer</Label>
                                <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCustomer}
                                            className="w-full justify-between h-11 bg-white"
                                        >
                                            <span className="truncate">
                                                {selectedCustomer ? (selectedCustomer.company || selectedCustomer.name) : "Cari customer..."}
                                            </span>
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari nama atau email..." className="h-10" />
                                            <CommandList>
                                                <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {customers.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={`${c.company || c.name} ${c.email}`}
                                                            onSelect={() => {
                                                                setSelectedCustomerId(c.id);
                                                                setOpenCustomer(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4 text-red-600",
                                                                    selectedCustomerId === c.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">{c.company || c.name}</span>
                                                                <span className="text-[10px] text-slate-400">{c.email}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {selectedCustomer && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium text-slate-500">Accurate ID</span>
                                        <span className="font-bold text-slate-700">{selectedCustomer.accurateId || "-"}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium text-slate-500">Email</span>
                                        <span className="font-bold text-slate-700 truncate max-w-[150px]">{selectedCustomer.email || "-"}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium text-slate-500">Telepon</span>
                                        <span className="font-bold text-slate-700">{selectedCustomer.phone || "-"}</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400">Catatan Penawaran (Opsional)</Label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Tuliskan catatan untuk pelanggan maupun admin..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Col: Items */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest">Detail Barang</CardTitle>

                            <Popover open={openProduct} onOpenChange={setOpenProduct}>
                                <PopoverTrigger asChild>
                                    <Button size="sm" className="h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs">
                                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Tambah Barang
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-0" align="end">
                                    <Command>
                                        <CommandInput placeholder="Ketik nama produk atau SKU..." className="h-10" />
                                        <CommandList>
                                            <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {products.map((p) => (
                                                    <CommandItem
                                                        key={p.sku}
                                                        value={`${p.sku} ${p.name}`}
                                                        onSelect={() => handleAddProduct(p)}
                                                        className="cursor-pointer"
                                                    >
                                                        <PlusCircle className="mr-2 h-4 w-4 text-slate-400" />
                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <span className="font-semibold text-sm truncate">{p.name}</span>
                                                            <div className="flex justify-between mt-1">
                                                                <span className="text-[10px] text-slate-400">{p.sku}</span>
                                                                <span className="text-[10px] font-bold text-red-600">{fmtPrice(p.price)}</span>
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </CardHeader>

                        <CardContent className="p-0 flex-1 flex flex-col">
                            {items.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-3 opacity-60">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                        <Search className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500">Belum ada barang</p>
                                    <p className="text-xs text-slate-400 max-w-[250px]">Pilih barang dari direktori produk dengan klik "Tambah Barang" di atas.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 flex-1">
                                    <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-white text-[10px] font-black uppercase tracking-wider text-slate-400 sticky top-0">
                                        <div className="col-span-6">Produk</div>
                                        <div className="col-span-2 text-center">Harga Satuan</div>
                                        <div className="col-span-2 text-center">Qty</div>
                                        <div className="col-span-1 text-right">Subtotal</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-3 px-6 py-4 items-center bg-white hover:bg-slate-50/50 transition-colors group">
                                            <div className="col-span-6 flex flex-col items-start gap-1">
                                                <span className="text-sm font-bold text-slate-800 leading-tight">{item.productName}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{item.productSku}</span>
                                                    <span className="text-[10px] text-slate-400">{item.brand}</span>
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex justify-center">
                                                <div className="relative flex items-center">
                                                    <span className="absolute left-2 text-[10px] font-bold text-slate-400">Rp</span>
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-24 pl-7 text-xs font-bold text-right"
                                                        value={item.price}
                                                        onChange={(e) => updatePrice(item.productSku, Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex justify-center">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    className="h-8 w-16 text-center font-bold text-sm"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.productSku, Number(e.target.value))}
                                                />
                                            </div>

                                            <div className="col-span-1 text-right flex flex-col items-end justify-center">
                                                <span className="text-sm font-black text-slate-900">{fmtPrice(item.price * item.quantity).replace("Rp ", "")}</span>
                                            </div>

                                            <div className="col-span-1 flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={() => removeItem(item.productSku)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {items.length > 0 && (
                                <div className="border-t border-slate-200 bg-slate-50 p-6 m-0 flex justify-end">
                                    <div className="flex flex-col text-right gap-1 min-w-[200px]">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Keseluruhan</span>
                                        <span className="text-2xl font-black text-red-600 tracking-tight">{fmtPrice(totalAmount)}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
