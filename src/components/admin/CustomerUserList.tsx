"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerUserForm } from "./CustomerUserForm";
import { toggleUserStatus, deleteUser } from "@/app/actions/customer-user";
import { User, Phone, CheckCircle, XCircle, Trash2, Power, Plus, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

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
}

export function CustomerUserList({ customerId, users }: CustomerUserListProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [isPending, startTransition] = useTransition();
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
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Mail className="h-3 w-3" /> {user.email || "-"}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Phone className="h-3 w-3" /> {user.phone || "-"}
                                        </div>
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

            {showAddForm ? (
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
            )}
        </div>
    );
}
