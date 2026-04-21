"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { Eye, EyeOff, Home, LayoutDashboard, Settings, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

import { vendorLoginAction } from "@/app/actions/auth";
import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const vendorFeatures = [
    { icon: <Package className="w-5 h-5" />, title: "Manajemen Produk", desc: "Kelola stok dan detail produk Anda dengan mudah." },
    { icon: <LayoutDashboard className="w-5 h-5" />, title: "Dashboard Penjualan", desc: "Pantau performa penjualan produk Anda secara real-time." },
    { icon: <Settings className="w-5 h-5" />, title: "Pengaturan Akun", desc: "Kelola profil dan preferensi toko vendor Anda." },
];

function VendorLoginForm() {
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);

    // Initial state for the action
    const initialState: any = { error: "", unverified: false, email: "", success: false, redirectUrl: "" };
    const [state, formAction, isPending] = useActionState(vendorLoginAction, initialState);

    // Hard redirect on success to ensure AuthProvider updates
    useEffect(() => {
        if (state?.success) {
            const callbackUrl = searchParams.get("callbackUrl");
            window.location.href = callbackUrl || state.redirectUrl || "/vendor";
        }
    }, [state?.success, state?.redirectUrl, searchParams]);

    return (
        <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
                <a href="/">
                    <Image
                        src="/logo.png"
                        alt="Hokiindo Logo"
                        width={160}
                        height={50}
                        className="h-10 w-auto object-contain mx-auto cursor-pointer"
                    />
                </a>
            </div>

            <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Vendor</h2>
                <p className="text-sm text-gray-500">
                    Masuk ke Vendor Portal Hokiindo untuk mengelola bisnis Anda.
                </p>
            </div>

            {/* Error Message */}
            {state?.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <EyeOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-semibold mb-1">Login Gagal</p>
                        <p>{state.error}</p>
                    </div>
                </div>
            )}

            <form action={formAction} className="space-y-5">
                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Kantor / Bisnis
                    </label>
                    <Input
                        name="email"
                        type="email"
                        placeholder="vendor@company.com"
                        className="h-11 rounded-xl"
                        defaultValue={state?.email || ""}
                        required
                    />
                </div>

                {/* Password */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-700">
                            Kata Sandi
                        </label>
                        <Link href="/lupa-password" title="Vendor Forgot Password" className="text-xs text-blue-600 hover:underline">
                            Lupa sandi?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-11 rounded-xl pr-11"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            name="remember"
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Tetap masuk selama 30 hari</span>
                    </label>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:shadow-none"
                >
                    {isPending ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Memproses...</span>
                        </div>
                    ) : "Masuk ke Dashboard Vendor"}
                </Button>

                <div className="pt-2 text-center">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors group">
                        <Home className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Kembali ke Beranda Utama
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function VendorLoginPage() {
    return (
        <div className="min-h-screen flex bg-white lg:bg-gray-50">
            {/* Left Side - Info Panel (Visible on Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 bg-blue-700 text-white p-12 flex-col justify-between relative overflow-hidden">
                {/* Background Pattern Deco */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/40 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                
                <div className="relative z-10">
                    <a href="/">
                        <Image
                            src="/logo.png"
                            alt="Hokiindo Logo"
                            width={180}
                            height={55}
                            className="h-10 w-auto object-contain brightness-0 invert"
                        />
                    </a>
                </div>

                <div className="relative z-10 space-y-8 max-w-md">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-extrabold leading-tight">
                            Portal Khusus <span className="text-blue-200">Vendor Hokiindo</span>
                        </h1>
                        <p className="text-blue-100 text-lg">
                            Kelola operasional dan pantau performa bisnis Anda dalam satu platform terintegrasi.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {vendorFeatures.map((feature, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                                <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-0.5">{feature.title}</h3>
                                    <p className="text-sm text-blue-100/80">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 text-sm text-blue-200/60">
                    &copy; {new Date().getFullYear()} PT Hokiindo Jaya Makmur. Portal Vendor v1.0
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
                <Suspense fallback={
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <p className="text-sm text-gray-500 font-medium">Memuat Portal Vendor...</p>
                    </div>
                }>
                    <VendorLoginForm />
                </Suspense>
            </div>
        </div>
    );
}
