"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Trash2, Star, MoreVertical, CheckCircle2, X, RefreshCcw, Zap, ChevronsUpDown, Check, Navigation, Receipt, Loader2 } from "lucide-react";
import {
    addCustomerAddressAction,
    setPrimaryAddressAction,
    deleteCustomerAddressAction,
    setBillingAddressAction,
    resetBillingToPrimaryAction,
    pullCustomerAddressesFromAccurate
} from "@/app/actions/address";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getProvinces, getRegencies, getDistricts } from "@/app/actions/regions";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Address {
    id: string;
    label: string | null;
    address: string;
    recipient: string | null;
    phone: string | null;
    district: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    isPrimary: boolean;
    isBilling: boolean;
}

interface CustomerAddressManagerProps {
    customerId: string;
    addresses: Address[];
    picName?: string | null;
    picPhone?: string | null;
}

export function CustomerAddressManager({ customerId, addresses, picName, picPhone }: CustomerAddressManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const router = useRouter();

    const [provinces, setProvinces] = useState<{ id: string, name: string }[]>([]);
    const [regencies, setRegencies] = useState<{ id: string, name: string }[]>([]);
    const [districts, setDistricts] = useState<{ id: string, name: string }[]>([]);

    const [selectedProv, setSelectedProv] = useState<{ id: string, name: string } | null>(null);
    const [selectedReg, setSelectedReg] = useState<{ id: string, name: string } | null>(null);
    const [selectedDist, setSelectedDist] = useState<{ id: string, name: string } | null>(null);

    const [loadingProv, setLoadingProv] = useState(false);
    const [loadingReg, setLoadingReg] = useState(false);
    const [loadingDist, setLoadingDist] = useState(false);

    const [setAsPrimary, setSetAsPrimary] = useState(false);
    const [setAsBilling, setSetAsBilling] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoadingProv(true);
            getProvinces().then(data => { setProvinces(data); setLoadingProv(false); });
        } else {
            setSelectedProv(null);
            setSelectedReg(null);
            setSelectedDist(null);
            setRegencies([]);
            setDistricts([]);
            setSetAsPrimary(false);
            setSetAsBilling(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedProv) {
            setLoadingReg(true);
            setSelectedReg(null);
            setSelectedDist(null);
            setDistricts([]);
            getRegencies(selectedProv.id).then(data => { setRegencies(data); setLoadingReg(false); });
        }
    }, [selectedProv]);

    useEffect(() => {
        if (selectedReg) {
            setLoadingDist(true);
            setSelectedDist(null);
            getDistricts(selectedReg.id).then(data => { setDistricts(data); setLoadingDist(false); });
        }
    }, [selectedReg]);

    const primaryAddress = addresses.find(a => a.isPrimary) || null;
    const billingAddress = addresses.find(a => a.isBilling) || primaryAddress;
    const billingIsSameAsPrimary = billingAddress?.id === primaryAddress?.id;
    const isFirstAddress = addresses.length === 0;

    async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        if (!selectedProv || !selectedReg || !selectedDist) {
            toast.error("Harap pilih Provinsi, Kota, dan Kecamatan secara lengkap.");
            return;
        }
        if (setAsPrimary) formData.set("setAsPrimary", "on");
        if (setAsBilling) formData.set("setAsBilling", "on");

        startTransition(async () => {
            const res = await addCustomerAddressAction(customerId, formData);
            if (res?.error) toast.error(res.error);
            else {
                toast.success("Alamat berhasil ditambahkan");
                setIsOpen(false);
                router.refresh();
            }
        });
    }

    async function handleSetPrimary(addressId: string) {
        setLoadingId(addressId);
        startTransition(async () => {
            const res = await setPrimaryAddressAction(customerId, addressId);
            if (res?.error) toast.error(res.error);
            else { toast.success("Alamat pengiriman utama diperbarui"); router.refresh(); }
            setLoadingId(null);
        });
    }

    async function handleSetBilling(addressId: string) {
        setLoadingId(addressId);
        startTransition(async () => {
            const res = await setBillingAddressAction(customerId, addressId);
            if (res?.error) toast.error(res.error);
            else { toast.success("Alamat penagihan diperbarui"); router.refresh(); }
            setLoadingId(null);
        });
    }

    async function handleResetBillingToPrimary() {
        startTransition(async () => {
            const res = await resetBillingToPrimaryAction(customerId);
            if (res?.error) toast.error(res.error);
            else { toast.success("Penagihan direset ke alamat pengiriman utama"); router.refresh(); }
        });
    }

    async function handleDelete(addressId: string) {
        if (!confirm("Hapus alamat ini?")) return;
        setLoadingId(addressId);
        startTransition(async () => {
            const res = await deleteCustomerAddressAction(addressId, customerId);
            if (res?.error) toast.error(res.error);
            else { toast.success("Alamat dihapus"); router.refresh(); }
            setLoadingId(null);
        });
    }

    async function handlePullSync() {
        startTransition(async () => {
            const res = await pullCustomerAddressesFromAccurate(customerId);
            if (res?.error) toast.error(res.error);
            else { toast.success("Alamat berhasil disinkronisasi dari Accurate"); router.refresh(); }
        });
    }

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex-1">
                    {addresses.length} Alamat Tersimpan
                </p>
                <Button
                    onClick={handlePullSync}
                    disabled={isPending}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 text-gray-500 rounded-lg h-7 px-2.5 font-black text-[9px] uppercase tracking-wider flex items-center gap-1"
                >
                    <RefreshCcw className={cn("h-3 w-3", isPending && "animate-spin")} />
                    Tarik Accurate
                </Button>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-7 px-2.5 font-black text-[9px] uppercase tracking-widest flex items-center gap-1">
                            <Plus className="h-3 w-3" /> Tambah
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl overflow-hidden p-0">
                        <div className="bg-gray-900 px-5 py-4">
                            <DialogTitle className="text-base font-black text-white uppercase tracking-tight">
                                {isFirstAddress ? "Tambah Alamat Pertama" : "Tambah Alamat Baru"}
                            </DialogTitle>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                {isFirstAddress
                                    ? "Alamat ini otomatis jadi alamat pengiriman & penagihan utama."
                                    : "Atur sebagai pengiriman utama dan/atau penagihan di bawah."}
                            </p>
                        </div>
                        <form onSubmit={handleAdd} className="p-5 space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Label Alamat *</Label>
                                <Input name="label" required placeholder="Kantor, Gudang, Cabang..." className="rounded-xl h-9 border-gray-200 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Penerima *</Label>
                                        {picName && (
                                            <button type="button" onClick={() => { const el = document.querySelector('input[name="recipient"]') as HTMLInputElement; if (el) el.value = picName; }} className="text-[8px] font-black text-blue-600 flex items-center gap-0.5 uppercase">
                                                <Zap className="h-2 w-2 fill-current" /> PIC
                                            </button>
                                        )}
                                    </div>
                                    <Input name="recipient" required placeholder="John Doe" className="rounded-xl h-9 border-gray-200 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Telepon *</Label>
                                        {picPhone && (
                                            <button type="button" onClick={() => { const el = document.querySelector('input[name="phone"]') as HTMLInputElement; if (el) el.value = picPhone; }} className="text-[8px] font-black text-blue-600 flex items-center gap-0.5 uppercase">
                                                <Zap className="h-2 w-2 fill-current" /> PIC
                                            </button>
                                        )}
                                    </div>
                                    <Input name="phone" required placeholder="0812..." className="rounded-xl h-9 border-gray-200 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alamat Lengkap *</Label>
                                <Textarea name="address" required placeholder="Nama Jalan, No. Rumah..." className="rounded-xl min-h-[70px] border-gray-200 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Provinsi *</Label>
                                    <input type="hidden" name="province" value={selectedProv?.name || ""} />
                                    <RegionSelect items={provinces} value={selectedProv} onSelect={setSelectedProv} placeholder="Pilih..." loading={loadingProv} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kota/Kab *</Label>
                                    <input type="hidden" name="city" value={selectedReg?.name || ""} />
                                    <RegionSelect items={regencies} value={selectedReg} onSelect={setSelectedReg} placeholder="Pilih..." disabled={!selectedProv} loading={loadingReg} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kecamatan *</Label>
                                    <input type="hidden" name="district" value={selectedDist?.name || ""} />
                                    <RegionSelect items={districts} value={selectedDist} onSelect={setSelectedDist} placeholder="Pilih..." disabled={!selectedReg} loading={loadingDist} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kode Pos *</Label>
                                    <Input name="postalCode" required placeholder="00000" className="rounded-xl h-9 border-gray-200 text-sm" />
                                </div>
                            </div>

                            {!isFirstAddress && (
                                <div className="border border-gray-100 rounded-xl p-3 space-y-2.5 bg-gray-50/50">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Opsi</p>
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <Checkbox
                                            checked={setAsPrimary}
                                            onCheckedChange={(v) => setSetAsPrimary(!!v)}
                                            className="rounded-md"
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-gray-700">Jadikan alamat pengiriman utama</p>
                                            <p className="text-[9px] text-gray-400">Menggantikan alamat utama saat ini</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <Checkbox
                                            checked={setAsBilling}
                                            onCheckedChange={(v) => setSetAsBilling(!!v)}
                                            className="rounded-md"
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-gray-700">Jadikan alamat penagihan (invoice)</p>
                                            <p className="text-[9px] text-gray-400">Menggantikan alamat penagihan saat ini</p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <Button type="submit" disabled={isPending} className="w-full bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-10 uppercase tracking-widest text-sm mt-1">
                                {isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Menyimpan...</> : "Simpan Alamat"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Empty state */}
            {addresses.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 text-center">
                    <MapPin className="h-8 w-8 text-gray-200" />
                    <p className="text-xs font-bold text-gray-400">Belum ada alamat tersimpan</p>
                    <p className="text-[9px] text-gray-300 font-medium">Tambah alamat untuk pengiriman dan penagihan</p>
                </div>
            )}

            {/* Address List */}
            {addresses.length > 0 && (
                <div className="space-y-2">
                    {addresses.map((addr) => {
                        const isLoading = loadingId === addr.id;
                        return (
                            <div
                                key={addr.id}
                                className={cn(
                                    "border rounded-xl p-3 transition-all",
                                    addr.isPrimary
                                        ? "border-blue-200 bg-blue-50/30"
                                        : addr.isBilling
                                            ? "border-green-200 bg-green-50/20"
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                )}
                            >
                                {/* Row 1: Label + Badges + Actions */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                        <span className="text-xs font-black text-gray-900 truncate">
                                            {addr.label || "Alamat"}
                                        </span>
                                        {addr.isPrimary && (
                                            <Badge className="bg-blue-600 text-[8px] font-black uppercase px-1.5 py-0 h-4 rounded border-none shadow-none shrink-0">
                                                <Navigation className="w-2 h-2 mr-0.5" /> Pengiriman
                                            </Badge>
                                        )}
                                        {addr.isBilling && (
                                            <Badge className="bg-green-600 text-[8px] font-black uppercase px-1.5 py-0 h-4 rounded border-none shadow-none shrink-0">
                                                <Receipt className="w-2 h-2 mr-0.5" /> Penagihan
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {isLoading ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                                        ) : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg" disabled={isPending}>
                                                        <MoreVertical className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl p-1 w-48">
                                                    {!addr.isPrimary && (
                                                        <DropdownMenuItem onClick={() => handleSetPrimary(addr.id)} className="font-bold text-[10px] py-2 px-3 rounded-lg flex items-center gap-2 uppercase tracking-tight">
                                                            <Star className="h-3 w-3 text-blue-500" /> Jadikan Pengiriman Utama
                                                        </DropdownMenuItem>
                                                    )}
                                                    {!addr.isBilling && (
                                                        <DropdownMenuItem onClick={() => handleSetBilling(addr.id)} className="font-bold text-[10px] py-2 px-3 rounded-lg flex items-center gap-2 uppercase tracking-tight">
                                                            <Receipt className="h-3 w-3 text-green-500" /> Jadikan Alamat Penagihan
                                                        </DropdownMenuItem>
                                                    )}
                                                    {addr.isBilling && !billingIsSameAsPrimary && (
                                                        <DropdownMenuItem onClick={handleResetBillingToPrimary} className="font-bold text-[10px] py-2 px-3 rounded-lg flex items-center gap-2 uppercase tracking-tight">
                                                            <CheckCircle2 className="h-3 w-3 text-gray-400" /> Samakan ke Pengiriman Utama
                                                        </DropdownMenuItem>
                                                    )}
                                                    {!addr.isPrimary && (
                                                        <>
                                                            <DropdownMenuSeparator className="bg-gray-50 my-1" />
                                                            <DropdownMenuItem onClick={() => handleDelete(addr.id)} className="font-bold text-[10px] py-2 px-3 rounded-lg flex items-center gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 uppercase tracking-tight">
                                                                <Trash2 className="h-3 w-3" /> Hapus Alamat
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </div>

                                {/* Address detail */}
                                <p className="text-[10px] text-gray-600 font-medium mt-1 leading-relaxed">
                                    {addr.address}
                                    {addr.district && `, ${addr.district}`}
                                    {addr.city && `, ${addr.city}`}
                                    {addr.province && `, ${addr.province}`}
                                    {addr.postalCode && ` ${addr.postalCode}`}
                                </p>

                                {/* Recipient & phone */}
                                {(addr.recipient || addr.phone) && (
                                    <div className="flex items-center gap-3 mt-1 text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                                        {addr.recipient && <span>{addr.recipient}</span>}
                                        {addr.phone && <span>{addr.phone}</span>}
                                    </div>
                                )}

                                {/* Note: billing same as primary */}
                                {addr.isPrimary && billingIsSameAsPrimary && (
                                    <p className="text-[9px] text-blue-500 font-bold mt-1.5 flex items-center gap-1">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Digunakan sebagai alamat penagihan
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info bar: billing is separate */}
            {addresses.length > 0 && !billingIsSameAsPrimary && billingAddress && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                    <Receipt className="h-3 w-3 text-amber-600 shrink-0" />
                    <p className="text-[9px] font-bold text-amber-700 flex-1">
                        Penagihan dikirim ke alamat terpisah dari pengiriman.
                    </p>
                    <button
                        onClick={handleResetBillingToPrimary}
                        disabled={isPending}
                        className="text-[8px] font-black text-amber-800 hover:text-amber-900 uppercase tracking-widest flex items-center gap-0.5 shrink-0"
                    >
                        <X className="h-2.5 w-2.5" /> Samakan
                    </button>
                </div>
            )}
        </div>
    );
}

interface RegionSelectProps {
    items: { id: string, name: string }[];
    value: { id: string, name: string } | null;
    onSelect: (val: { id: string, name: string }) => void;
    placeholder: string;
    disabled?: boolean;
    loading?: boolean;
}

function RegionSelect({ items, value, onSelect, placeholder, disabled, loading }: RegionSelectProps) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} disabled={disabled || loading} className="w-full justify-between rounded-xl h-9 border-gray-200 font-bold text-xs">
                    <span className="truncate">{loading ? "Memuat..." : value ? value.name : placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
                <Command>
                    <CommandInput placeholder="Cari..." />
                    <CommandList className="max-h-[250px]">
                        <CommandEmpty>Data tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem key={item.id} value={item.name} onSelect={() => { onSelect(item); setOpen(false); }} className="font-bold text-xs">
                                    <Check className={cn("mr-2 h-3.5 w-3.5", value?.id === item.id ? "opacity-100" : "opacity-0")} />
                                    {item.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
