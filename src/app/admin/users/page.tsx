"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, ShieldCheck, Mail, Phone, Calendar, MoreHorizontal, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserRole, roleInfo, type Permission } from "@/lib/rbac";
import { CanAccess, useAuth } from "@/components/auth/CanAccess";
import { ModernConfirm } from "@/components/ui/modern-confirm";

interface User {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    phone: string | null;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
    const { user: currentUser, hasPermission } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const response = await fetch("/api/admin/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function createUser(formData: FormData) {
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            phone: formData.get("phone") as string,
            role: formData.get("role") as UserRole || "STAFF",
        };

        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("User berhasil ditambahkan");
                setIsCreateDialogOpen(false);
                fetchUsers();
            } else {
                const error = await response.json();
                toast.error(error.error || "Gagal menambahkan user");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    }

    async function updateUser(id: string, data: Partial<User>) {
        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("User berhasil diupdate");
                setIsEditDialogOpen(false);
                setSelectedUser(null);
                fetchUsers();
            } else {
                const error = await response.json();
                toast.error(error.error || "Gagal mengupdate user");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    }

    async function handleDeleteConfirmed() {
        if (!deleteConfirm.id) return;

        try {
            const response = await fetch(`/api/admin/users/${deleteConfirm.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("User berhasil dihapus");
                fetchUsers();
            } else {
                const error = await response.json();
                toast.error(error.error || "Gagal menghapus user");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setDeleteConfirm({ open: false, id: null });
        }
    }

    async function toggleUserStatus(id: string, currentStatus: boolean) {
        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (response.ok) {
                toast.success(currentStatus ? "User dinonaktifkan" : "User diaktifkan");
                fetchUsers();
            } else {
                toast.error("Gagal mengubah status user");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
                    <p className="text-sm text-gray-500">Kelola akun pengguna sistem</p>
                </div>
                <CanAccess permission="users:create">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form action={createUser}>
                                <DialogHeader>
                                    <DialogTitle>Tambah User Baru</DialogTitle>
                                    <DialogDescription>
                                        Buat akun pengguna baru untuk mengakses sistem
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama Lengkap</Label>
                                        <Input id="name" name="name" placeholder="Nama lengkap" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" placeholder="user@example.com" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">No. Telepon</Label>
                                        <Input id="phone" name="phone" placeholder="08xxxxxxxxxx" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" placeholder="Min. 6 karakter" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select name="role" defaultValue="STAFF">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(roleInfo).map(([key, info]) => (
                                                    <SelectItem key={key} value={key}>{info.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="bg-red-600 hover:bg-red-700">
                                        Simpan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CanAccess>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{users.length}</p>
                                <p className="text-sm text-gray-500">Total User</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
                            <p className="text-sm text-gray-500">User Aktif</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-gray-400">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">{users.filter(u => !u.isActive).length}</p>
                            <p className="text-sm text-gray-500">User Nonaktif</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">{users.filter(u => u.role === "SUPER_ADMIN" || u.role === "ADMIN").length}</p>
                            <p className="text-sm text-gray-500">Admin</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar User</CardTitle>
                    <CardDescription>Semua akun pengguna yang terdaftar</CardDescription>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">Belum ada user</p>
                            <p className="text-sm">Tambahkan user baru untuk memulai</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-gray-500">
                                        <th className="pb-3 font-medium">User</th>
                                        <th className="pb-3 font-medium">Email</th>
                                        <th className="pb-3 font-medium">Role</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Dibuat</th>
                                        <th className="pb-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(roleInfo[user.role as keyof typeof roleInfo]?.color || 'bg-gray-100 text-gray-600').replace('bg-', 'bg-opacity-20 bg-')}`}>
                                                        <span className={`font-medium text-sm ${(roleInfo[user.role as keyof typeof roleInfo]?.color || 'bg-gray-100 text-gray-600').split(' ')[1]}`}>
                                                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">{user.name || "-"}</span>
                                                        {user.phone && (
                                                            <p className="text-xs text-gray-500">{user.phone}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-gray-600">{user.email}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo[user.role as keyof typeof roleInfo]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                    {roleInfo[user.role as keyof typeof roleInfo]?.label || user.role}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                        }`}>
                                                        {user.isActive ? "Aktif" : "Nonaktif"}
                                                    </span>
                                                    {user.isVerified && (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 text-gray-500 text-sm">
                                                {new Date(user.createdAt).toLocaleDateString("id-ID", {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-1">
                                                    <CanAccess permission="users:edit">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setIsEditDialogOpen(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </CanAccess>
                                                    <CanAccess permission="users:edit">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                                                            className={user.isActive
                                                                ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                                            title={user.isActive ? "Nonaktifkan" : "Aktifkan"}
                                                        >
                                                            {user.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                        </Button>
                                                    </CanAccess>
                                                    <CanAccess permission="users:delete">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeleteConfirm({ open: true, id: user.id })}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            disabled={currentUser ? user.id === (currentUser as any).id : false}
                                                            title={currentUser && user.id === (currentUser as any).id ? "Tidak dapat menghapus diri sendiri" : "Hapus"}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </CanAccess>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            {selectedUser && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            updateUser(selectedUser.id, {
                                name: formData.get("name") as string,
                                email: formData.get("email") as string,
                                phone: formData.get("phone") as string,
                                role: formData.get("role") as UserRole,
                            });
                        }}>
                            <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>
                                    Update informasi pengguna
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Nama Lengkap</Label>
                                    <Input
                                        id="edit-name"
                                        name="name"
                                        defaultValue={selectedUser.name || ""}
                                        placeholder="Nama lengkap"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        name="email"
                                        type="email"
                                        defaultValue={selectedUser.email}
                                        placeholder="user@example.com"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-phone">No. Telepon</Label>
                                    <Input
                                        id="edit-phone"
                                        name="phone"
                                        defaultValue={selectedUser.phone || ""}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Select name="role" defaultValue={selectedUser.role}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(roleInfo).map(([key, info]) => (
                                                <SelectItem key={key} value={key}>{info.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <ModernConfirm
                open={deleteConfirm.open}
                onOpenChange={(v) => setDeleteConfirm({ open: v, id: deleteConfirm.id })}
                title="Hapus User?"
                description="Apakah Anda yakin ingin menghapus user ini? Akun ini tidak akan bisa login lagi dan semua data terkait akan tetap ada namun aksesnya dicabut."
                onConfirm={handleDeleteConfirmed}
                confirmText="Ya, Hapus User"
            />
        </div>
    );
}
