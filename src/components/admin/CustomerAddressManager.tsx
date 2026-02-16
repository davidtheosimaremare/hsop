"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Trash2, Star, MoreVertical } from "lucide-react";
import { addCustomerAddressAction, setPrimaryAddressAction, deleteCustomerAddressAction } from "@/app/actions/address";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Address {
    id: string;
    label: string | null;
    address: string;
    recipient: string | null;
    phone: string | null;
    isPrimary: boolean;
}

interface CustomerAddressManagerProps {
    customerId: string;
    addresses: Address[];
}

export function CustomerAddressManager({ customerId, addresses }: CustomerAddressManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const sortedAddresses = [...addresses].sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1));

    async function handleAdd(formData: FormData) {
        startTransition(async () => {
            const res = await addCustomerAddressAction(customerId, formData);
            if (res?.error) alert(res.error);
            else {
                setIsOpen(false);
                router.refresh();
            }
        });
    }

    async function handleSetPrimary(addressId: string) {
        startTransition(async () => {
            const res = await setPrimaryAddressAction(customerId, addressId);
            if (res?.error) alert(res.error);
            else router.refresh();
        });
    }

    async function handleDelete(addressId: string) {
        if (!confirm("Hapus alamat ini?")) return;
        startTransition(async () => {
            const res = await deleteCustomerAddressAction(addressId, customerId);
            if (res?.error) alert(res.error);
            else router.refresh();
        });
    }

    return (
        <div className="space-y-4 pt-2 border-t mt-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4" /> Daftar Alamat
                </Label>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" /> Tambah
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Alamat Baru</DialogTitle>
                        </DialogHeader>
                        <form action={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Label Alamat</Label>
                                    <Input name="label" placeholder="Contoh: Kantor Cabang" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Penerima</Label>
                                    <Input name="recipient" placeholder="Nama Penerima" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Telepon</Label>
                                <Input name="phone" placeholder="No. Telepon" />
                            </div>
                            <div className="space-y-2">
                                <Label>Alamat Lengkap</Label>
                                <Textarea name="address" required placeholder="Jalan..." />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="isPrimary" id="isPrimary" className="rounded border-gray-300" />
                                <Label htmlFor="isPrimary">Jadikan Alamat Utama</Label>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>Simpan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {sortedAddresses.length > 0 ? (
                    sortedAddresses.map((addr) => (
                        <div key={addr.id} className={`p-3 rounded-lg border text-sm relative group ${addr.isPrimary ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100" : "bg-white border-gray-200"}`}>
                            <div className="flex justify-between items-start">
                                <div className="pr-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">{addr.label || "Alamat"}</span>
                                        {addr.isPrimary && <Badge className="text-[10px] h-5 px-1.5 bg-blue-600 hover:bg-blue-700 border-none">Utama</Badge>}
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{addr.address}</p>
                                    {(addr.recipient || addr.phone) && (
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            {addr.recipient}
                                            {addr.recipient && addr.phone && <span className="text-gray-300">|</span>}
                                            {addr.phone}
                                        </p>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 text-gray-400 hover:text-gray-700">
                                            <MoreVertical className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {!addr.isPrimary && (
                                            <DropdownMenuItem onClick={() => handleSetPrimary(addr.id)}>
                                                <Star className="h-3 w-3 mr-2" /> Set Utama
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleDelete(addr.id)} className="text-red-600 focus:text-red-600">
                                            <Trash2 className="h-3 w-3 mr-2" /> Hapus
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 text-gray-400 text-xs border border-dashed rounded-lg bg-gray-50/50">
                        Belum ada alamat tersimpan.
                        <br />Klik tombol "Tambah" di atas.
                    </div>
                )}
            </div>
        </div>
    );
}
