"use client";

import { useState, useTransition } from "react";
import {
    Users,
    UserPlus,
    Shield,
    Trash2,
    Mail,
    Phone,
    CheckCircle2,
    X,
    Loader2,
    MoreHorizontal,
    Plus,
    Building2,
    Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createCustomerUser, deleteUser } from "@/app/actions/customer-user";
import { ModernConfirm } from "@/components/ui/modern-confirm";

interface Member {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    position: string | null;
    isPrimaryContact: boolean;
}

interface TeamManagerProps {
    initialMembers: Member[];
    currentUserId: string;
    customer: any;
}

export function TeamManager({ initialMembers, currentUserId, customer }: TeamManagerProps) {
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; memberId: string | null }>({
        open: false,
        memberId: null
    });
    const [isPending, startTransition] = useTransition();

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        position: "",
        password: "",
        isPrimary: false
    });

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await createCustomerUser({
                customerId: customer.id,
                ...formData
            });

            if (res.success) {
                toast.success("Anggota tim berhasil ditambahkan");
                setIsAddDialogOpen(false);
                setFormData({ name: "", email: "", phone: "", position: "", password: "", isPrimary: false });
                // Note: In a real app we might want to refresh members list
                // For now, we rely on the page reload or manual refresh if needed
                // But since it's a server action with revalidatePath, 
                // we might need to refresh state or use a router.refresh()
                window.location.reload();
            } else {
                toast.error(res.error || "Gagal menambahkan anggota");
            }
        });
    };

    const handleDeleteMember = async () => {
        if (!deleteConfirm.memberId) return;

        startTransition(async () => {
            const res = await deleteUser(deleteConfirm.memberId!);
            if (res.success) {
                toast.success("Anggota tim berhasil dihapus");
                setMembers(prev => prev.filter(m => m.id !== deleteConfirm.memberId));
                setDeleteConfirm({ open: false, memberId: null });
            } else {
                toast.error(res.error || "Gagal menghapus anggota");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Anggota Tim</h3>
                            <p className="text-sm text-gray-500 mt-1">{customer?.name || "Perusahaan"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-bold text-green-700">Akun Terverifikasi</span>
                            </div>
                            <Button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-200"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Anggota</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jabatan & Role</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {members.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold border border-white shadow-sm">
                                                {member.name?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{member.name || "Member"}</p>
                                                <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3 text-gray-400" />
                                                        {member.email}
                                                    </span>
                                                    {member.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3 text-gray-400" />
                                                            {member.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                                <Briefcase className="w-3 h-3 text-gray-400" />
                                                {member.position || "Staff"}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Badge variant="outline" className={`text-[10px] h-5 ${member.isPrimaryContact ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-100"} font-bold border-0`}>
                                                    <Shield className="w-2.5 h-2.5 mr-1" />
                                                    {member.isPrimaryContact ? "Owner / Primary" : "Team Member"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge className={`text-[10px] h-5 ${member.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-600 hover:bg-gray-100"} border-0 font-bold`}>
                                            {member.isActive ? "Aktif" : "Nonaktif"}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {member.id !== currentUserId && !member.isPrimaryContact && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        onClick={() => setDeleteConfirm({ open: true, memberId: member.id })}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Hapus Anggota
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                        {member.id === currentUserId && (
                                            <span className="text-[10px] font-bold text-gray-400 italic">Akun Anda</span>
                                        )}
                                        {member.isPrimaryContact && member.id !== currentUserId && (
                                            <span className="text-[10px] font-bold text-purple-400 italic">Lead Contact</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {members.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-gray-500 font-medium">Belum ada anggota tim</p>
                        <p className="text-gray-400 text-xs mt-1">Gunakan tombol 'Tambah' untuk mengundang rekan kerja.</p>
                    </div>
                )}
            </div>

            {/* Add Member Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    <form onSubmit={handleAddMember}>
                        <div className="bg-gradient-to-br from-red-600 to-red-700 p-8 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4">
                                    <UserPlus className="w-6 h-6 text-white" />
                                </div>
                                <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">Tambah Anggota</DialogTitle>
                                <DialogDescription className="text-red-100 font-medium mt-1">
                                    Berikan akses akun perusahaan kepada rekan tim Anda.
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="p-8 space-y-5 bg-white">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
                                    <Input
                                        required
                                        placeholder="Nama rekan..."
                                        className="rounded-xl bg-gray-50 border-gray-100 h-11 focus:ring-red-500/20"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jabatan</label>
                                    <Input
                                        placeholder="Contoh: Purchasing"
                                        className="rounded-xl bg-gray-50 border-gray-100 h-11 focus:ring-red-500/20"
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Perusahaan</label>
                                <Input
                                    type="email"
                                    required
                                    placeholder="email@perusahaan.com"
                                    className="rounded-xl bg-gray-50 border-gray-100 h-11 focus:ring-red-500/20"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nomor Telepon</label>
                                    <Input
                                        required
                                        placeholder="0812..."
                                        className="rounded-xl bg-gray-50 border-gray-100 h-11 focus:ring-red-500/20"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password Awal</label>
                                    <Input
                                        type="password"
                                        required
                                        placeholder="Min. 6 karakter"
                                        className="rounded-xl bg-gray-50 border-gray-100 h-11 focus:ring-red-500/20"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsAddDialogOpen(false)}
                                className="rounded-xl font-bold text-gray-500"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 font-black uppercase tracking-widest text-xs shadow-lg shadow-red-200"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tambah Anggota"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ModernConfirm
                open={deleteConfirm.open}
                onOpenChange={(open) => setDeleteConfirm({ open, memberId: null })}
                title="Hapus Anggota Tim?"
                description="Akses anggota ini akan dicabut secara permanen. Lanjutkan?"
                onConfirm={handleDeleteMember}
                isLoading={isPending}
                confirmText="Ya, Hapus Akses"
                variant="destructive"
            />
        </div>
    );
}
