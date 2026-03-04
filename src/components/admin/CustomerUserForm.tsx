"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomerUser, updateCustomerUser } from "@/app/actions/customer-user";
import { Loader2, UserPlus, X, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface CustomerUser {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    position?: string | null;
    isPrimaryContact?: boolean;
}

interface CustomerUserFormProps {
    customerId: string;
    user?: CustomerUser;
    onCancel?: () => void;
}

export function CustomerUserForm({ customerId, user, onCancel }: CustomerUserFormProps) {
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [position, setPosition] = useState(user?.position || "");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const isEdit = !!user;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !email || !phone || (!isEdit && !password)) {
            setError("Harap lengkapi semua data wajib.");
            return;
        }

        startTransition(async () => {
            const res = isEdit
                ? await updateCustomerUser(user!.id, { name, email, phone, position, password: password || undefined })
                : await createCustomerUser({ customerId, name, email, phone, position, password });

            if (res.success) {
                router.refresh();
                if (onCancel) onCancel();
            } else {
                setError(res.error || "Gagal menyimpan user.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border-2 border-gray-100 rounded-3xl p-6 bg-white shadow-xl shadow-gray-100/50 transition-all">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-50 rounded-lg">
                        <ShieldCheck className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-black text-xs text-gray-900 uppercase tracking-widest leading-none">
                            {isEdit ? "Edit Kontak Person" : "Tambah Kontak Baru"}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">
                            {isEdit ? `Mengubah data ${user.name}` : "Daftarkan personil baru untuk perusahaan ini."}
                        </p>
                    </div>
                </div>
                {onCancel && (
                    <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                        <X className="h-4 w-4 text-gray-400" />
                    </Button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider p-3 rounded-xl flex items-center gap-2">
                    <X className="h-3 w-3" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap <span className="text-red-500">*</span></Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="rounded-xl h-11 border-gray-100 focus:border-red-100 focus:ring-red-100"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="position" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jabatan / Posisi</Label>
                    <Input
                        id="position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="Contoh: Purchasing Manager"
                        className="rounded-xl h-11 border-gray-100 focus:border-red-100 focus:ring-red-100"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email <span className="text-red-500">*</span></Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="budi@perusahaan.com"
                        className="rounded-xl h-11 border-gray-100 focus:border-red-100 focus:ring-red-100"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nomor Handphone <span className="text-red-500">*</span></Label>
                    <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812XXXXXXXX"
                        className="rounded-xl h-11 border-gray-100 focus:border-red-100 focus:ring-red-100"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="password" title={isEdit ? "Kosongkan jika tidak ingin ganti" : ""} className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Password {isEdit ? "(Opsional)" : <span className="text-red-500">*</span>}
                </Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEdit ? "•••••• (Kosongkan jika tidak ingin ganti)" : "••••••"}
                    className="rounded-xl h-11 border-gray-100 focus:border-red-100 focus:ring-red-100"
                />
            </div>

            <div className="pt-2 flex gap-3">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-widest border-gray-200">
                    Batal
                </Button>
                <Button type="submit" disabled={isPending} className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-11 shadow-lg shadow-red-100 uppercase tracking-widest text-xs">
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isEdit ? (
                        <Save className="mr-2 h-4 w-4" />
                    ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {isEdit ? "Simpan Perubahan" : "Daftarkan Kontak"}
                </Button>
            </div>
        </form>
    );
}
