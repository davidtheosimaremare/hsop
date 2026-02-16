"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomerUser } from "@/app/actions/customer-user";
import { Loader2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface CustomerUserFormProps {
    customerId: string;
    onCancel?: () => void;
}

export function CustomerUserForm({ customerId, onCancel }: CustomerUserFormProps) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username || !email || !phone || !password) {
            setError("Semua field wajib diisi.");
            return;
        }

        startTransition(async () => {
            const res = await createCustomerUser({
                customerId,
                name: username, // state is still named 'username' but holds name
                email,
                phone,
                password
            });

            if (res.success) {
                setUsername("");
                setEmail("");
                setPhone("");
                setPassword("");
                router.refresh();
                if (onCancel) onCancel();
            } else {
                setError(res.error || "Gagal membuat user.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm text-gray-700">Tambah User Baru</h3>
                {onCancel && (
                    <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-6 w-6 p-0">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-2 rounded">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                    id="name"
                    value={username} // Using username state for name as per existing logic, or rename state?
                    // User asked for "nama, email, nomor hp, password".
                    // Existing code uses "username" state potentially for name?
                    // Let's check schema. User table has `name` or `username`?
                    // I should check schema.
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nama Lengkap User"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812..."
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="******"
                />
            </div>

            <Button type="submit" disabled={isPending} className="w-full bg-[#E31E2D] hover:bg-[#C21A26] text-white">
                {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                )}
                Buat User
            </Button>
        </form>
    );
}
