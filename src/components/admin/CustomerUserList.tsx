
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerUserForm } from "./CustomerUserForm";
import { toggleUserStatus, deleteUser } from "@/app/actions/customer-user";
import { User, Phone, Trash2, Power, Mail, Building2, Loader2, UserPlus2, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminUpgradeCustomerAction } from "@/app/actions/customer";

interface CustomerUser {
    id: string;
    username: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    role: string;
    position?: string | null;
    isPrimaryContact?: boolean;
}

interface CustomerUserListProps {
    customerId: string;
    users: CustomerUser[];
    customerType: string;
}

export function CustomerUserList({ customerId, users, customerType }: CustomerUserListProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState<CustomerUser | null>(null);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isUpgrading, setIsUpgrading] = useState(false);
    const router = useRouter();

    const handleToggleStatus = (userId: string, currentStatus: boolean) => {
        startTransition(async () => {
            const res = await toggleUserStatus(userId, !currentStatus);
            if (res.success) {
                router.refresh();
            } else {
                alert("Gagal mengubah status.");
            }
        });
    };

    const handleDelete = (userId: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) return;
        startTransition(async () => {
            const res = await deleteUser(userId);
            if (res.success) {
                router.refresh();
            } else {
                alert("Gagal menghapus user.");
            }
        });
    };

    async function handleUpgrade(formData: FormData) {
        setIsUpgrading(true);
        try {
            const result = await adminUpgradeCustomerAction(customerId, formData);
            if (result.error) {
                alert(result.error);
            } else {
                setIsUpgradeOpen(false);
                router.refresh();
            }
        } catch (error) {
            alert("Terjadi kesalahan.");
        } finally {
            setIsUpgrading(false);
        }
    }

    const isBusiness = customerType === "BISNIS" || customerType === "B2B";

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {users.length > 0 ? (
                    users.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100/50 rounded-xl hover:bg-gray-50 transition-all">
                            {/* Status indicator + avatar */}
                            <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-white",
                                user.isActive ? "text-emerald-600 border border-emerald-100" : "text-red-500 border border-red-100"
                            )}>
                                <User className="h-4 w-4" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-black text-gray-900 text-xs uppercase tracking-tight truncate">
                                        {user.name || user.username || "No Name"}
                                    </span>
                                    {user.isPrimaryContact && (
                                        <Badge className="bg-blue-600 text-[8px] font-black uppercase px-1.5 py-0 h-4 rounded border-none shadow-none">CP</Badge>
                                    )}
                                    <Badge className={cn(
                                        "text-[8px] font-black uppercase px-1.5 py-0 h-4 rounded-full border-none shadow-none",
                                        user.isActive ? "bg-emerald-100/50 text-emerald-600" : "bg-red-100/50 text-red-600"
                                    )}>
                                        {user.isActive ? "Aktif" : "Non-Aktif"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold text-gray-400">
                                    {user.position && (
                                        <span className="text-blue-500 flex items-center gap-1">
                                            <Briefcase className="w-2.5 h-2.5" />{user.position}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 truncate">
                                        <Mail className="h-2.5 w-2.5 shrink-0" />{user.email || "-"}
                                    </span>
                                    {user.phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-2.5 w-2.5 shrink-0" />{user.phone}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2.5 rounded-lg border-gray-200 bg-white text-gray-700 font-black text-[9px] uppercase tracking-wider hover:bg-gray-50"
                                    onClick={() => setEditingUser(user)}
                                    disabled={isPending}
                                >
                                    Edit
                                </Button>
                                {!user.isPrimaryContact && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className={cn(
                                                "h-7 w-7 rounded-lg border-gray-200 bg-white shadow-sm transition-all",
                                                user.isActive ? "hover:bg-red-50 hover:text-red-600 hover:border-red-100" : "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"
                                            )}
                                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                                            disabled={isPending}
                                            title={user.isActive ? "Nonaktifkan" : "Aktifkan"}
                                        >
                                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-lg border-gray-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-100 shadow-sm transition-all"
                                            onClick={() => handleDelete(user.id)}
                                            disabled={isPending}
                                            title="Hapus User"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 text-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-200">
                            <UserPlus2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada user terdaftar</p>
                            <p className="text-[9px] text-gray-300 font-bold uppercase mt-0.5">Tambah akun untuk akses pesanan</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Upgrade Banner for non-BISNIS */}
            {!isBusiness && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Multi-user hanya untuk Corporate</p>
                        <p className="text-[10px] font-bold text-amber-700/70">Customer ini terdaftar sebagai {customerType || "RETAIL"}</p>
                    </div>
                    <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest shrink-0">
                                Upgrade
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl">
                            <DialogHeader className="pt-4 px-2">
                                <DialogTitle className="text-xl font-black tracking-tighter uppercase text-gray-900">Upgrade ke Corporate</DialogTitle>
                                <DialogDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Data akan disinkronkan ke sistem Accurate.
                                </DialogDescription>
                            </DialogHeader>
                            <form action={handleUpgrade} className="space-y-5 py-4 px-2">
                                <div className="space-y-2.5">
                                    <Label htmlFor="companyName" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Perusahaan Resmi</Label>
                                    <Input id="companyName" name="companyName" required placeholder="PT. Nama Perusahaan" className="h-10 rounded-xl border-gray-100 bg-gray-50" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="address" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat Domisili Kantor</Label>
                                    <Input id="address" name="address" required placeholder="Alamat Lengkap" className="h-10 rounded-xl border-gray-100 bg-gray-50" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Purchasing</Label>
                                        <Input id="email" name="email" type="email" required placeholder="email@perusahaan.com" className="h-10 rounded-xl border-gray-100 bg-gray-50" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="phone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. Telepon</Label>
                                        <Input id="phone" name="phone" required placeholder="021-xxxxxx" className="h-10 rounded-xl border-gray-100 bg-gray-50" />
                                    </div>
                                </div>
                                <DialogFooter className="pt-4 border-t border-gray-50">
                                    <Button type="button" variant="ghost" onClick={() => setIsUpgradeOpen(false)} className="rounded-xl font-black text-[10px] uppercase text-gray-400">
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={isUpgrading} className="bg-red-600 hover:bg-red-700 text-white px-6 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                        {isUpgrading ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Proses...</> : "Simpan & Aktifkan"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* Add User Form for BISNIS */}
            {isBusiness && (
                (showAddForm || editingUser) ? (
                    <div className="p-4 border-2 border-red-50 rounded-2xl bg-white animate-in zoom-in-95 fade-in duration-200">
                        <CustomerUserForm
                            customerId={customerId}
                            user={editingUser || undefined}
                            onCancel={() => {
                                setShowAddForm(false);
                                setEditingUser(null);
                            }}
                        />
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        className="w-full border-2 border-dashed border-red-100 bg-red-50/20 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-xl h-10 font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                        onClick={() => setShowAddForm(true)}
                    >
                        <UserPlus2 className="mr-2 h-4 w-4" /> Tambah User Baru
                    </Button>
                )
            )}
        </div>
    );
}
