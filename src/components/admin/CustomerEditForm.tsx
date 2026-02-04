"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCustomer } from "@/app/actions/customer";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

interface CustomerEditFormProps {
    customer: {
        id: string;
        type: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        company: string | null;
        address: string | null;
    };
}

export function CustomerEditForm({ customer }: CustomerEditFormProps) {
    const [type, setType] = useState<"BISNIS" | "RETAIL">((customer.type as "BISNIS" | "RETAIL") || "RETAIL");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [error, setError] = useState("");

    async function onSubmit(formData: FormData) {
        setError("");
        startTransition(async () => {
            const data = {
                type,
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                phone: formData.get("phone") as string,
                company: formData.get("company") as string,
                address: formData.get("address") as string,
            };

            const res = await updateCustomer(customer.id, data);
            if (res.success) {
                router.push(`/admin/customers/${customer.id}`);
                router.refresh(); // Ensure data is fresh
            } else {
                setError(res.error || "Gagal mengupdate customer");
            }
        });
    }

    return (
        <form action={onSubmit} className="space-y-6">
            {/* Account Type Selection */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    type="button"
                    onClick={() => setType("RETAIL")}
                    className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${type === "RETAIL"
                        ? "border-red-600 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Perorangan (Retail)
                </button>
                <button
                    type="button"
                    onClick={() => setType("BISNIS")}
                    className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${type === "BISNIS"
                        ? "border-red-600 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Bisnis (B2B)
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {type === "BISNIS" && (
                    <div className="space-y-2">
                        <Label htmlFor="company">Nama Perusahaan <span className="text-red-500">*</span></Label>
                        <Input
                            id="company"
                            name="company"
                            placeholder="PT. Hokiindo Perkasa"
                            defaultValue={customer.company || ""}
                            required
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap / Kontak <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Nama PIC atau Pelanggan"
                            defaultValue={customer.name || ""}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">No. Telepon / HP <span className="text-red-500">*</span></Label>
                        <div className="flex gap-2">
                            <select className="h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="+62">+62</option>
                            </select>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="812..."
                                defaultValue={customer.phone || ""}
                                required
                                className="flex-1"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="email@example.com"
                        defaultValue={customer.email || ""}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Alamat Lengkap</Label>
                    <textarea
                        id="address"
                        name="address"
                        placeholder="Jalan..."
                        defaultValue={customer.address || ""}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending} className="bg-red-600 hover:bg-red-700">
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Perubahan
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
