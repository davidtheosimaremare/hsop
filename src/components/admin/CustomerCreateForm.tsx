"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createManualCustomer } from "@/app/actions/customer";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle, AlertCircle, Building2, User, Eye, EyeOff, RefreshCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";


export function CustomerCreateForm() {
    const [customerType, setCustomerType] = useState<"BISNIS" | "RESELLER" | "RETAIL" | "GENERAL">("GENERAL");
    const [isCompany, setIsCompany] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const data = {
                type: customerType,
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                phone: formData.get("phone") as string,
                company: (customerType === "BISNIS" || (customerType === "RESELLER" && isCompany)) ? (formData.get("company") as string) : null,
                companyEmail: (customerType === "BISNIS" || (customerType === "RESELLER" && isCompany)) ? (formData.get("companyEmail") as string) : null,
                companyPhone: (customerType === "BISNIS" || (customerType === "RESELLER" && isCompany)) ? (formData.get("companyPhone") as string) : null,
                password: formData.get("password") as string,
            };

            const res = await createManualCustomer(data);
            if (res.success) {
                router.push(`/admin/customers/${res.id}`);
            } else {
                setError(res.error || "Gagal membuat customer");
            }
        });
    }

    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-900">Gagal Membuat Customer</p>
                        <p className="text-xs text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Customer Type Selection */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-red-600 px-4 py-3">
                    <h3 className="text-sm font-bold text-white">Tipe Customer</h3>
                </div>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={() => setCustomerType("BISNIS")}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${customerType === "BISNIS"
                            ? "border-red-600 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${customerType === "BISNIS" ? "bg-red-600" : "bg-gray-100"
                                }`}>
                                <Building2 className={`h-4 w-4 ${customerType === "BISNIS" ? "text-white" : "text-gray-500"
                                    }`} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${customerType === "BISNIS" ? "text-red-900" : "text-gray-900"
                                    }`}>Perusahaan</p>
                                <p className="text-xs text-gray-500">PT/CV</p>
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setCustomerType("RESELLER");
                            setIsCompany(false); // Reset to person by default
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${customerType === "RESELLER"
                            ? "border-red-600 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${customerType === "RESELLER" ? "bg-red-600" : "bg-gray-100"
                                }`}>
                                <User className={`h-4 w-4 ${customerType === "RESELLER" ? "text-white" : "text-gray-500"
                                    }`} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${customerType === "RESELLER" ? "text-red-900" : "text-gray-900"
                                    }`}>Mitra Jual / Reseller</p>
                                <p className="text-xs text-gray-500">Reseller, agen, mitra jual</p>
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setCustomerType("RETAIL")}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${customerType === "RETAIL"
                            ? "border-red-600 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${customerType === "RETAIL" ? "bg-red-600" : "bg-gray-100"
                                }`}>
                                <User className={`h-4 w-4 ${customerType === "RETAIL" ? "text-white" : "text-gray-500"
                                    }`} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${customerType === "RETAIL" ? "text-red-900" : "text-gray-900"
                                    }`}>Pembeli Pribadi</p>
                                <p className="text-xs text-gray-500">Akun pembeli retail ecer</p>
                            </div>
                        </div>
                    </button>

                    {customerType === "RESELLER" && (
                        <div className="col-span-1 md:col-span-3 mt-2 flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipe Reseller:</Label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="reseller_type"
                                        checked={!isCompany}
                                        onChange={() => setIsCompany(false)}
                                        className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                                    />
                                    <span className={`text-sm font-bold transition-colors ${!isCompany ? "text-red-600" : "text-gray-500 group-hover:text-gray-700"}`}>Perorangan</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="reseller_type"
                                        checked={isCompany}
                                        onChange={() => setIsCompany(true)}
                                        className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                                    />
                                    <span className={`text-sm font-bold transition-colors ${isCompany ? "text-red-600" : "text-gray-500 group-hover:text-gray-700"}`}>Perusahaan (PT/CV)</span>
                                </label>
                            </div>
                        </div>
                    )}


                </CardContent>
            </div>

            {/* Personal Information */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-red-600 px-4 py-3">
                    <h3 className="text-sm font-bold text-white">Informasi Pribadi</h3>
                </div>
                <CardContent className="p-4 space-y-3">
                    {(customerType === "BISNIS" || (customerType === "RESELLER" && isCompany)) && (
                        <div className="border border-blue-200 rounded-lg overflow-hidden mb-6 bg-blue-50/30">
                            <div className="bg-blue-600 px-4 py-2">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Informasi Perusahaan</h3>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="company" className="text-xs font-black text-gray-700 uppercase tracking-tight">
                                        Nama Perusahaan <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="company"
                                        name="company"
                                        placeholder="PT. Hokiindo Perkasa"
                                        required={customerType === "BISNIS"}
                                        className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-100 bg-white"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="companyPhone" className="text-xs font-black text-gray-700 uppercase tracking-tight">
                                            No. Telepon Kantor
                                        </Label>
                                        <Input
                                            id="companyPhone"
                                            name="companyPhone"
                                            placeholder="021..."
                                            className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-100 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="companyEmail" className="text-xs font-black text-gray-700 uppercase tracking-tight">
                                            Email Perusahaan
                                        </Label>
                                        <Input
                                            id="companyEmail"
                                            name="companyEmail"
                                            type="email"
                                            placeholder="office@company.com"
                                            className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-100 bg-white"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-px bg-gray-100 flex-1"></div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                {customerType === "BISNIS" ? "Data Akun Login (CP Utama)" : "Informasi Akun"}
                            </span>
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-black text-gray-700 uppercase tracking-tight">
                                    {customerType === "BISNIS" ? "Nama Contact Person (CP)" : "Nama Lengkap"} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Nama lengkap"
                                    required
                                    className="h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-100 bg-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-xs font-black text-gray-700 uppercase tracking-tight">
                                    {customerType === "BISNIS" ? "No. HP CP Utama" : "No. Handphone"} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    placeholder="0812..."
                                    required
                                    className="h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-100 bg-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-black text-gray-700 uppercase tracking-tight">
                                    Email Login <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    required
                                    className="h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-100 bg-white"
                                />
                            </div>
                            <div className="space-y-1.5 col-span-1 md:col-span-1">
                                <Label htmlFor="password" title="Tips: Gunakan kombinasi huruf dan angka" className="text-xs font-black text-gray-700 uppercase tracking-tight flex items-center justify-between">
                                    <span>Password Login <span className="text-red-500">*</span></span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#";
                                                let pass = "";
                                                for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                                                setPassword(pass);
                                            }}
                                            className="text-[9px] font-black text-red-600 hover:text-red-700 flex items-center gap-1 uppercase tracking-tighter"
                                        >
                                            <RefreshCcw className="h-2.5 w-2.5" /> Acak
                                        </button>
                                    </div>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="******"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-100 bg-white pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Email ini akan digunakan untuk login ke portal customer
                    </p>
                </CardContent>
            </div>



            {/* Submit Button */}
            <div className="flex justify-end pt-2">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Customer Baru
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
