import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, ShieldCheck, Mail, Phone, Calendar, MoreHorizontal, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
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

export const dynamic = "force-dynamic";

async function createAdmin(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string;

    if (!email || !password || !name) {
        throw new Error("Nama, email, dan password wajib diisi");
    }

    const hashedPassword = await hash(password, 10);

    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            phone: phone || null,
            role: "ADMIN",
            isVerified: true,
            isActive: true,
        },
    });

    revalidatePath("/admin/users");
}

async function deleteAdmin(formData: FormData) {
    "use server";

    const id = formData.get("id") as string;

    await db.user.delete({
        where: { id },
    });

    revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
    const admins = await db.user.findMany({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Akun Admin</h1>
                    <p className="text-sm text-gray-500">Kelola akun admin untuk sistem</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form action={createAdmin}>
                            <DialogHeader>
                                <DialogTitle>Tambah Admin Baru</DialogTitle>
                                <DialogDescription>
                                    Buat akun admin baru untuk mengakses sistem
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama Lengkap</Label>
                                    <Input id="name" name="name" placeholder="Nama lengkap" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">No. Telepon</Label>
                                    <Input id="phone" name="phone" placeholder="08xxxxxxxxxx" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" placeholder="Min. 6 karakter" required />
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
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{admins.length}</p>
                                <p className="text-sm text-gray-500">Total Admin</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">{admins.filter(a => a.isActive).length}</p>
                            <p className="text-sm text-gray-500">Admin Aktif</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-gray-400">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">{admins.filter(a => !a.isActive).length}</p>
                            <p className="text-sm text-gray-500">Admin Nonaktif</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Admin List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Admin</CardTitle>
                    <CardDescription>Semua akun admin yang terdaftar</CardDescription>
                </CardHeader>
                <CardContent>
                    {admins.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">Belum ada admin</p>
                            <p className="text-sm">Tambahkan admin baru untuk memulai</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-gray-500">
                                        <th className="pb-3 font-medium">Nama</th>
                                        <th className="pb-3 font-medium">Email</th>
                                        <th className="pb-3 font-medium">Telepon</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Dibuat</th>
                                        <th className="pb-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map((admin) => (
                                        <tr key={admin.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                        <span className="text-red-600 font-medium text-sm">
                                                            {admin.name?.charAt(0).toUpperCase() || "A"}
                                                        </span>
                                                    </div>
                                                    <span className="font-medium">{admin.name || "-"}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-gray-600">{admin.email}</td>
                                            <td className="py-3 text-gray-600">{admin.phone || "-"}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.isActive
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {admin.isActive ? "Aktif" : "Nonaktif"}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-500 text-sm">
                                                {new Date(admin.createdAt).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="py-3">
                                                <form action={deleteAdmin} className="inline">
                                                    <input type="hidden" name="id" value={admin.id} />
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
