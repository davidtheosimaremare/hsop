"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    MapPin,
    Plus,
    Trash2,
    Home,
    Briefcase,
    Building2,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Phone,
    User,
    MoreVertical,
    Star,
    X,
    Edit2,
    ChevronDown,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserAddresses, addUserAddress, deleteUserAddress, setPrimaryUserAddress, updateUserAddress } from "@/app/actions/address";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/CanAccess";

export default function AlamatPage() {
    const { user, refreshUser } = useAuth();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [newAddress, setNewAddress] = useState({
        label: "",
        recipient: "",
        phone: "",
        street: "",
        province: { id: "", name: "" },
        city: { id: "", name: "" },
        district: { id: "", name: "" },
        postalCode: "",
        isPrimary: false
    });

    // Regions Data State
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [isLoadingRegions, setIsLoadingRegions] = useState(false);

    // Fetch Provinces
    useEffect(() => {
        if (!isAddModalOpen) return;
        const fetchProvinces = async () => {
            try {
                const res = await fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json");
                const data = await res.json();
                setProvinces(data);

                // If we have a province name but no ID (legacy fallback), try to find the ID
                if (!newAddress.province.id && newAddress.province.name) {
                    const found = data.find((p: any) => p.name.toLowerCase() === newAddress.province.name.toLowerCase());
                    if (found) {
                        setNewAddress(prev => ({ ...prev, province: { id: found.id, name: found.name } }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch provinces", err);
            }
        };
        fetchProvinces();
    }, [isAddModalOpen, newAddress.province.name, newAddress.province.id]);

    // Fetch Cities
    useEffect(() => {
        if (!newAddress.province.id) {
            setCities([]);
            return;
        }
        const fetchCities = async () => {
            setIsLoadingRegions(true);
            try {
                const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${newAddress.province.id}.json`);
                const data = await res.json();
                setCities(data);

                // Legacy fallback: find matching city ID by name
                if (!newAddress.city.id && newAddress.city.name) {
                    const found = data.find((c: any) => c.name.toLowerCase() === newAddress.city.name.toLowerCase());
                    if (found) {
                        setNewAddress(prev => ({ ...prev, city: { id: found.id, name: found.name } }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch cities", err);
            } finally {
                setIsLoadingRegions(false);
            }
        };
        fetchCities();
    }, [newAddress.province.id, newAddress.city.name, newAddress.city.id]);

    // Fetch Districts
    useEffect(() => {
        if (!newAddress.city.id) {
            setDistricts([]);
            return;
        }
        const fetchDistricts = async () => {
            setIsLoadingRegions(true);
            try {
                const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${newAddress.city.id}.json`);
                const data = await res.json();
                setDistricts(data);

                // Legacy fallback: find matching district ID by name
                if (!newAddress.district.id && newAddress.district.name) {
                    const found = data.find((d: any) => d.name.toLowerCase() === newAddress.district.name.toLowerCase());
                    if (found) {
                        setNewAddress(prev => ({ ...prev, district: { id: found.id, name: found.name } }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch districts", err);
            } finally {
                setIsLoadingRegions(false);
            }
        };
        fetchDistricts();
    }, [newAddress.city.id, newAddress.district.name, newAddress.district.id]);

    const loadAddresses = useCallback(async () => {
        setIsLoading(true);
        const res = await getUserAddresses();
        if (res.success && res.addresses) {
            setAddresses(res.addresses);
        } else {
            toast.error(res.error || "Gagal memuat alamat");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);

    const handleAddAddress = async () => {
        if (!newAddress.street || !newAddress.recipient || !newAddress.phone || !newAddress.province.id || !newAddress.city.id || !newAddress.district.id || !newAddress.postalCode) {
            toast.error("Mohon lengkapi data alamat");
            return;
        }

        setIsSubmitting(true);
        const fullAddress = `${newAddress.street}, ${newAddress.district.name}, ${newAddress.city.name}, ${newAddress.province.name}, ${newAddress.postalCode}`.replace(/, ,/g, ',').trim();

        const payload = new FormData();
        payload.append("address", fullAddress);
        payload.append("label", newAddress.label);
        payload.append("recipient", newAddress.recipient);
        payload.append("phone", newAddress.phone);
        if (newAddress.isPrimary) {
            payload.append("isPrimary", "on");
        }

        // Also add individual region fields in case they are needed by the backend in the future
        payload.append("provinceId", newAddress.province.id);
        payload.append("provinceName", newAddress.province.name);
        payload.append("regencyId", newAddress.city.id);
        payload.append("regencyName", newAddress.city.name);
        payload.append("districtId", newAddress.district.id);
        payload.append("districtName", newAddress.district.name);

        const res = editingId
            ? await updateUserAddress(editingId, payload)
            : await addUserAddress(payload);

        if (res.success) {
            toast.success(editingId ? "Alamat berhasil diperbarui" : "Alamat berhasil ditambahkan");
            setIsAddModalOpen(false);
            setEditingId(null);
            setNewAddress({
                label: "",
                recipient: "",
                phone: "",
                street: "",
                province: { id: "", name: "" },
                city: { id: "", name: "" },
                district: { id: "", name: "" },
                postalCode: "",
                isPrimary: false
            });
            await refreshUser();
            await loadAddresses();
        } else {
            toast.error(res.error || (editingId ? "Gagal mengubah alamat" : "Gagal menambah alamat"));
        }
        setIsSubmitting(false);
    };

    const handleOpenEdit = (addr: any) => {
        setEditingId(addr.id);

        // If we have structured fields, use them
        if (addr.provinceId || addr.provinceName) {
            setNewAddress({
                label: addr.label || "",
                recipient: addr.recipient || "",
                phone: addr.phone || "",
                street: addr.street || "",
                province: { id: addr.provinceId || "", name: addr.provinceName || "" },
                city: { id: addr.regencyId || "", name: addr.regencyName || "" },
                district: { id: addr.districtId || "", name: addr.districtName || "" },
                postalCode: addr.postalCode || "",
                isPrimary: addr.isPrimary
            });
        } else {
            // Fallback for legacy addresses (same parsing logic as before)
            const parts = addr.address.split(", ");
            if (parts.length >= 5) {
                const postalCode = parts[parts.length - 1];
                const provinceName = parts[parts.length - 2];
                const cityName = parts[parts.length - 3];
                const districtName = parts[parts.length - 4];
                const street = parts.slice(0, parts.length - 4).join(", ");

                setNewAddress({
                    label: addr.label || "",
                    recipient: addr.recipient || "",
                    phone: addr.phone || "",
                    street: street,
                    province: { id: "", name: provinceName },
                    city: { id: "", name: cityName },
                    district: { id: "", name: districtName },
                    postalCode: postalCode,
                    isPrimary: addr.isPrimary
                });
            } else {
                setNewAddress({
                    label: addr.label || "",
                    recipient: addr.recipient || "",
                    phone: addr.phone || "",
                    street: addr.address,
                    province: { id: "", name: "" },
                    city: { id: "", name: "" },
                    district: { id: "", name: "" },
                    postalCode: "",
                    isPrimary: addr.isPrimary
                });
            }
        }
        setIsAddModalOpen(true);
    };

    const handleUseMyInfo = () => {
        if (user) {
            setNewAddress(prev => ({
                ...prev,
                recipient: user.name || "",
                phone: user.phone || ""
            }));
        }
    };

    const handleDelete = async (id: string, isPrimary: boolean) => {
        if (isPrimary) {
            toast.error("Alamat utama tidak bisa dihapus");
            return;
        }

        const res = await deleteUserAddress(id);
        if (res.success) {
            toast.success("Alamat berhasil dihapus");
            await refreshUser();
            await loadAddresses();
        } else {
            toast.error(res.error || "Gagal menghapus alamat");
        }
    };

    const handleSetPrimary = async (id: string) => {
        const res = await setPrimaryUserAddress(id);
        if (res.success) {
            toast.success("Alamat utama berhasil diubah");
            await refreshUser();
            await loadAddresses();
        } else {
            toast.error(res.error || "Gagal mengubah alamat utama");
        }
    };

    const getLabelIcon = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes("rumah")) return <Home className="w-4 h-4" />;
        if (l.includes("kantor")) return <Briefcase className="w-4 h-4" />;
        return <Building2 className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Daftar Alamat</h2>
                    <p className="text-sm text-gray-500">Kelola alamat pengiriman untuk memudahkan proses checkout.</p>
                </div>

                <Dialog open={isAddModalOpen} onOpenChange={(open) => {
                    setIsAddModalOpen(open);
                    if (!open) {
                        setEditingId(null);
                        setNewAddress({
                            label: "",
                            recipient: "",
                            phone: "",
                            street: "",
                            province: { id: "", name: "" },
                            city: { id: "", name: "" },
                            district: { id: "", name: "" },
                            postalCode: "",
                            isPrimary: false
                        });
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200 gap-2">
                            <Plus className="w-4 h-4" /> Tambah Alamat Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Ubah Alamat" : "Tambah Alamat Baru"}</DialogTitle>
                            <DialogDescription>
                                {editingId ? "Perbarui rincian alamat pengiriman Anda." : "Masukkan rincian alamat pengiriman Anda di bawah ini."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="label" className="text-xs font-bold uppercase tracking-wider text-gray-500">Label Alamat (Opsional)</Label>
                                <Input
                                    id="label"
                                    placeholder="Contoh: Rumah, Kantor, Apartemen"
                                    value={newAddress.label}
                                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="recipient" className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Penerima</Label>
                                        <button
                                            type="button"
                                            onClick={handleUseMyInfo}
                                            className="text-[9px] font-bold text-red-600 hover:underline"
                                        >
                                            Gunakan data saya
                                        </button>
                                    </div>
                                    <Input
                                        id="recipient"
                                        placeholder="Nama Lengkap"
                                        value={newAddress.recipient}
                                        onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-gray-500">No. Telepon</Label>
                                    <Input
                                        id="phone"
                                        placeholder="0812xxxx"
                                        value={newAddress.phone}
                                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="street" className="text-xs font-bold uppercase tracking-wider text-gray-500">Alamat Lengkap</Label>
                                <Textarea
                                    id="street"
                                    placeholder="Nama Jalan, No. Rumah, dll."
                                    className="min-h-[80px] resize-none"
                                    value={newAddress.street}
                                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Provinsi</Label>
                                    <div className="relative">
                                        <select
                                            value={newAddress.province.id}
                                            onChange={(e) => {
                                                const selected = provinces.find(p => p.id === e.target.value);
                                                setNewAddress({
                                                    ...newAddress,
                                                    province: selected ? { id: selected.id, name: selected.name } : { id: "", name: "" },
                                                    city: { id: "", name: "" },
                                                    district: { id: "", name: "" }
                                                });
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none bg-white pr-8 h-10"
                                            required
                                        >
                                            <option value="">Pilih Provinsi</option>
                                            {provinces.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="relative">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Kota / Kabupaten</Label>
                                    <div className="relative">
                                        <select
                                            value={newAddress.city.id}
                                            onChange={(e) => {
                                                const selected = cities.find(c => c.id === e.target.value);
                                                setNewAddress({
                                                    ...newAddress,
                                                    city: selected ? { id: selected.id, name: selected.name } : { id: "", name: "" },
                                                    district: { id: "", name: "" }
                                                });
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none bg-white pr-8 h-10 disabled:bg-gray-50"
                                            required
                                            disabled={!newAddress.province.id || isLoadingRegions}
                                        >
                                            <option value="">Pilih Kota/Kab</option>
                                            {cities.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Kecamatan</Label>
                                    <div className="relative">
                                        <select
                                            value={newAddress.district.id}
                                            onChange={(e) => {
                                                const selected = districts.find(d => d.id === e.target.value);
                                                setNewAddress({
                                                    ...newAddress,
                                                    district: selected ? { id: selected.id, name: selected.name } : { id: "", name: "" }
                                                });
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none bg-white pr-8 h-10 disabled:bg-gray-50"
                                            required
                                            disabled={!newAddress.city.id || isLoadingRegions}
                                        >
                                            <option value="">Pilih Kecamatan</option>
                                            {districts.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 bottom-3 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="relative">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Kode Pos</Label>
                                    <Input
                                        placeholder="Kode Pos"
                                        className="h-10"
                                        value={newAddress.postalCode}
                                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isPrimary"
                                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    checked={newAddress.isPrimary}
                                    onChange={(e) => setNewAddress({ ...newAddress, isPrimary: e.target.checked })}
                                />
                                <Label htmlFor="isPrimary" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Jadikan Alamat Utama
                                </Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
                            <Button
                                onClick={handleAddAddress}
                                disabled={isSubmitting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {editingId ? "Simpan Perubahan" : "Simpan Alamat"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                    <p className="text-sm text-gray-500">Memuat daftar alamat...</p>
                </div>
            ) : addresses.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <MapPin className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Alamat</h3>
                    <p className="text-gray-500 max-w-sm mb-6">Anda belum menambahkan alamat pengiriman. Tambahkan alamat sekarang untuk mempermudah transaksi Anda.</p>
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Tambah Alamat Pertama
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <Card key={addr.id} className={`overflow-hidden transition-all duration-300 ${addr.isPrimary ? 'ring-2 ring-red-500 border-red-100 shadow-md' : 'hover:border-gray-300 shadow-sm'}`}>
                            <CardContent className="p-0">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${addr.isPrimary ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {getLabelIcon(addr.label || "")}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                    {addr.label || "Alamat Lainnya"}
                                                    {addr.isPrimary && (
                                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-2 h-5 text-[10px] uppercase font-black">Utama</Badge>
                                                    )}
                                                </h4>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 rounded-full">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                <DropdownMenuItem
                                                    onClick={() => handleOpenEdit(addr)}
                                                    className="text-gray-700 focus:text-gray-900 cursor-pointer font-medium"
                                                >
                                                    <Edit2 className="w-4 h-4 mr-2" /> Ubah Alamat
                                                </DropdownMenuItem>
                                                {!addr.isPrimary && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleSetPrimary(addr.id)}
                                                        className="text-red-600 focus:text-red-600 cursor-pointer font-medium"
                                                    >
                                                        <Star className="w-4 h-4 mr-2" /> Jadikan Utama
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(addr.id, addr.isPrimary)}
                                                    disabled={addr.isPrimary}
                                                    className="text-red-600 focus:text-red-600 cursor-pointer font-medium disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Hapus Alamat
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-bold text-sm text-gray-800">{addr.recipient}</p>
                                        <div className="flex items-start gap-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                                            <p className="leading-relaxed line-clamp-3">{addr.address}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 shrink-0 text-gray-400" />
                                            <p>{addr.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {addr.isPrimary && (
                                    <div className="bg-red-50 px-5 py-2.5 flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Alamat pengiriman utama Anda
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

