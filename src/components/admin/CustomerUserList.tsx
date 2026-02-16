"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerUserForm } from "./CustomerUserForm";
import { toggleUserStatus, deleteUser } from "@/app/actions/customer-user";
import { User, Phone, CheckCircle, XCircle, Trash2, Power, Plus, Mail, Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
    email: string | null;
    phone: string | null;
    isActive: boolean;
    role: string;
}

interface CustomerUserListProps {
    customerId: string;
    users: CustomerUser[];
    customerType: string;
}

export function CustomerUserList({ customerId, users, customerType }: CustomerUserListProps) {
    const [showAddForm, setShowAddForm] = useState(false);
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
        <div className="space-y-4">
            <div className="space-y-2">
                {users.length > 0 ? (
                    users.map((user) => (
                        <div key={user.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-md bg-white gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${user.isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                    <User className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{user.username || "No Username"}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="h-3 w-3" /> {user.email || "-"}
                                        </div>
                                        {user.phone && (
                                            <>
                                                <span className="hidden sm:inline text-gray-300">|</span>
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-3 w-3" /> {user.phone}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <Badge variant={user.isActive ? "default" : "destructive"} className="text-xs">
                                    {user.isActive ? "Aktif" : "Nonaktif"}
                                </Badge>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                                    disabled={isPending}
                                    title={user.isActive ? "Nonaktifkan" : "Aktifkan"}
                                >
                                    <Power className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 hover:text-red-600"
                                    onClick={() => handleDelete(user.id)}
                                    disabled={isPending}
                                    title="Hapus User"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md border border-dashed">
                        Belum ada user untuk perusahaan ini.
                    </div>
                )}
            </div>

            {!isBusiness && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-center">
                    <p className="text-sm text-yellow-800 mb-3">
                        Customer ini terdaftar sebagai <strong>{customerType || "Personal"}</strong>. <br />
                        Fitur manajemen user (tambah/hapus) hanya tersedia untuk akun Perusahaan (BISNIS).
                    </p>

                    <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                <Building2 className="w-4 h-4 mr-2" />
                                Ubah menjadi Akun Perusahaan
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Upgrade Customer ke Perusahaan</DialogTitle>
                                <DialogDescription>
                                    Lengkapi data perusahaan untuk mengaktifkan fitur manajemen user.
                                </DialogDescription>
                            </DialogHeader>
                            <form action={handleUpgrade} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Nama Perusahaan</Label>
                                    <Input id="companyName" name="companyName" required placeholder="PT. Nama Perusahaan" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Alamat Perusahaan</Label>
                                    <Input id="address" name="address" required placeholder="Alamat Lengkap" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Perusahaan</Label>
                                    <Input id="email" name="email" type="email" required placeholder="email@perusahaan.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telepon Perusahaan</Label>
                                    <Input id="phone" name="phone" required placeholder="021-xxxxxx" />
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsUpgradeOpen(false)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={isUpgrading}>
                                        {isUpgrading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            "Simpan & Upgrade"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {isBusiness && (
                showAddForm ? (
                    <CustomerUserForm
                        customerId={customerId}
                        onCancel={() => setShowAddForm(false)}
                    />
                ) : (
                    <Button
                        variant="outline"
                        className="w-full border-dashed border-[#E31E2D]/50 text-[#E31E2D] hover:bg-[#E31E2D]/5 hover:text-[#E31E2D]"
                        onClick={() => setShowAddForm(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Tambah User Baru
                    </Button>
                )
            )}
        </div>
    );
}
