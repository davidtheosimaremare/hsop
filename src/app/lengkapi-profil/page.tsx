"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Building, User, ArrowRight, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { onboardingAction } from "@/app/actions/onboarding";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LengkapiProfilPage() {
    const router = useRouter();
    const [isCompany, setIsCompany] = useState(false);
    
    const initialState: any = { error: "", success: false, redirectUrl: "" };
    const [state, formAction, isPending] = useActionState(onboardingAction, initialState);

    useEffect(() => {
        if (state?.success) {
            window.location.href = state.redirectUrl || "/";
        }
    }, [state?.success, state?.redirectUrl]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <a href="/">
                    <Image
                        src="/logo.png"
                        alt="Hokiindo Logo"
                        width={200}
                        height={60}
                        className="h-12 w-auto object-contain mx-auto cursor-pointer"
                    />
                </a>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Lengkapi Profil Anda
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Mohon lengkapi data berikut sebelum melanjutkan ke dashboard
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    
                    {state?.error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm">
                            <EyeOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Gagal Menyimpan</p>
                                <p>{state.error}</p>
                            </div>
                        </div>
                    )}

                    <form action={formAction} className="space-y-6">
                        
                        {/* Tipe Akun */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-900">Mendaftar Sebagai:</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label
                                    className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none transition-all ${
                                        !isCompany ? 'border-red-600 ring-1 ring-red-600 bg-red-50/50' : 'border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="isCompany"
                                        value="false"
                                        className="sr-only"
                                        checked={!isCompany}
                                        onChange={() => setIsCompany(false)}
                                    />
                                    <span className="flex flex-1">
                                        <span className="flex flex-col">
                                            <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                                <User className="w-4 h-4" />
                                                Individu / Pribadi
                                            </span>
                                            <span className="mt-1 text-xs text-gray-500">
                                                Untuk keperluan pribadi atau rumah tangga.
                                            </span>
                                        </span>
                                    </span>
                                </label>

                                <label
                                    className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none transition-all ${
                                        isCompany ? 'border-red-600 ring-1 ring-red-600 bg-red-50/50' : 'border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="isCompany"
                                        value="true"
                                        className="sr-only"
                                        checked={isCompany}
                                        onChange={() => setIsCompany(true)}
                                    />
                                    <span className="flex flex-1">
                                        <span className="flex flex-col">
                                            <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                                <Building className="w-4 h-4" />
                                                Perusahaan / PT
                                            </span>
                                            <span className="mt-1 text-xs text-gray-500">
                                                Untuk keperluan bisnis, proyek, atau instansi.
                                            </span>
                                        </span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Nama Lengkap */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Lengkap PIC</label>
                            <div className="mt-1">
                                <Input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Nama Lengkap Anda"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        {/* Nomor HP & Email (optional display, backend uses fallback if empty) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nomor WhatsApp</label>
                                <div className="mt-1">
                                    <Input
                                        name="phone"
                                        type="tel"
                                        placeholder="08123456789"
                                        className="h-11"
                                    />
                                    <p className="mt-1 text-[10px] text-gray-500">Kosongkan jika sudah login dengan Nomor HP.</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Utama</label>
                                <div className="mt-1">
                                    <Input
                                        name="email"
                                        type="email"
                                        placeholder="email@anda.com"
                                        className="h-11"
                                    />
                                    <p className="mt-1 text-[10px] text-gray-500">Kosongkan jika sudah login dengan Google/Email.</p>
                                </div>
                            </div>
                        </div>

                        {/* Fields for Company */}
                        {isCompany && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 p-5 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <Building className="w-4 h-4" /> Informasi Perusahaan
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Perusahaan / PT</label>
                                    <div className="mt-1">
                                        <Input
                                            name="companyName"
                                            type="text"
                                            required={isCompany}
                                            placeholder="PT. Maju Mundur"
                                            className="h-11 bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bidang Usaha</label>
                                    <div className="mt-1">
                                        <select 
                                            name="businessType" 
                                            required={isCompany}
                                            className="block w-full h-11 rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6 bg-white"
                                        >
                                            <option value="">Pilih Bidang Usaha...</option>
                                            <option value="Kontraktor">Kontraktor / EPC</option>
                                            <option value="Panel Maker">Panel Maker</option>
                                            <option value="Distributor">Distributor / Reseller</option>
                                            <option value="End User Pabrik">End User (Pabrik / Industri)</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alamat */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
                            <div className="mt-1">
                                <Textarea
                                    name="address"
                                    rows={3}
                                    placeholder="Nama Jalan, Gedung, No. Rumah, RT/RW, Kota, Kode Pos"
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white text-base font-medium rounded-xl disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>Simpan dan Lanjutkan <ArrowRight className="w-5 h-5" /></>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
