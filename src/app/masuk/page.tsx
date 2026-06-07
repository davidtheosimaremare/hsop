"use client";

import { useState, Suspense, useEffect } from "react";
import Image from "next/image";
import { Eye, EyeOff, Home, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

import { loginAction } from "@/app/actions/auth";
import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import PhoneLoginForm from "@/components/auth/PhoneLoginForm";

const memberBenefits = [
    { num: "1", title: "Potongan Harga Eksklusif", desc: "Penawaran harga spesial untuk member terdaftar." },
    { num: "2", title: "Fitur Pembelian Bulky", desc: "Kemudahan pembelian dalam jumlah besar." },
    { num: "3", title: "Request Quotation Mudah", desc: "Proses permintaan penawaran yang cepat." },
    { num: "4", title: "Prioritas Konsultasi Tim", desc: "Akses langsung ke tim ahli kami." },
];

function EmailLoginForm({ state, formAction, isPending, showPassword, setShowPassword }: any) {
    return (
        <form action={formAction} className="space-y-4">
            {/* Email */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                </label>
                <Input
                    name="email"
                    type="email"
                    placeholder="contoh@email.com"
                    className="h-10 text-sm"
                    defaultValue={state?.email || ""}
                    required
                />
            </div>

            {/* Password */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Kata Sandi
                </label>
                <div className="relative">
                    <Input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan kata sandi"
                        className="h-10 text-sm pr-10"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        name="remember"
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-xs text-gray-600">Tetap Masuk</span>
                </label>
                <Link prefetch={false}  href="/lupa-password" className="text-xs text-red-600 hover:underline">
                    Lupa Kata Sandi?
                </Link>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-70"
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Masuk"}
            </Button>
        </form>
    );
}

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter(); 
    const registered = searchParams.get("registered");
    const [showPassword, setShowPassword] = useState(false);
    const [tab, setTab] = useState<"email" | "phone">("email");

    // Initial state for the action
    const initialState: any = { error: "", unverified: false, email: "", success: false, redirectUrl: "" };
    const [state, formAction, isPending] = useActionState(loginAction, initialState);

    // Hard redirect on success to ensure AuthProvider updates
    useEffect(() => {
        if (state?.success) {
            const callbackUrl = searchParams.get("callbackUrl");
            window.location.href = callbackUrl || state.redirectUrl || "/";
        }
    }, [state?.success, state?.redirectUrl, searchParams]);

    return (
        <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-5 text-center">
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

            <h2 className="text-lg font-bold text-gray-900 mb-1">Masuk ke Akun Anda</h2>
            <p className="text-xs text-gray-500 mb-5">
                Silakan masuk untuk melanjutkan ke Hokiindo Shop
            </p>

            {registered && (
                <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-xs">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Registrasi Berhasil!</p>
                        <p>Silakan masuk menggunakan akun yang baru dibuat.</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {state?.error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
                    <EyeOff className="w-4 h-4 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Login Gagal</p>
                        <p>{state.error}</p>
                        {state.unverified && (
                            <div className="mt-2">
                                <Link prefetch={false} 
                                    href={`/verifikasi?email=${encodeURIComponent(state.email || '')}`}
                                    className="text-red-800 underline font-bold"
                                >
                                    Verifikasi Pesan Sekarang
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TABS */}
            <div className="flex border-b border-gray-200 mb-5">
                <button
                    type="button"
                    onClick={() => setTab("email")}
                    className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${
                        tab === "email" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Email
                </button>
                <button
                    type="button"
                    onClick={() => setTab("phone")}
                    className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${
                        tab === "phone" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Nomor HP
                </button>
            </div>

            <div className="min-h-[220px]">
                {tab === "email" ? (
                    <EmailLoginForm 
                        state={state} 
                        formAction={formAction} 
                        isPending={isPending} 
                        showPassword={showPassword} 
                        setShowPassword={setShowPassword} 
                    />
                ) : (
                    <PhoneLoginForm />
                )}
            </div>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500 text-xs">Atau masuk dengan</span>
                </div>
            </div>

            <GoogleLoginButton />

            {/* Register Link */}
            <p className="text-center text-xs text-gray-600 mt-6">
                Belum punya akun?{" "}
                <Link prefetch={false}  href="/daftar" className="text-red-600 font-semibold hover:underline">
                    Daftar Sekarang
                </Link>
            </p>
        </div>
    );
}

export default function MasukPage() {
    return (
        <div className="min-h-screen flex">
            {/* Left Side - Info Panel */}
            <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-red-700 to-red-900 text-white p-6 flex-col justify-center">
                {/* Logo */}
                <div className="mb-6">
                    <a href="/">
                        <Image
                            src="/logo.png"
                            alt="Hokiindo Logo"
                            width={200}
                            height={60}
                            className="h-12 w-auto object-contain brightness-0 invert cursor-pointer"
                        />
                    </a>
                </div>

                {/* Headline */}
                <h1 className="text-2xl font-bold mb-5 leading-tight">
                    Selamat Datang Kembali, <span className="text-yellow-400">Member Hokiindo!</span>
                </h1>

                {/* Benefits */}
                <div className="space-y-3">
                    {memberBenefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-yellow-500 text-red-900 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                {benefit.num}
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">{benefit.title}</h3>
                                <p className="text-xs text-red-200">{benefit.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 bg-white flex flex-col">
                {/* Home Button */}
                <div className="absolute top-4 right-4">
                    <a
                        href="/"
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                        title="Kembali ke Home"
                    >
                        <Home className="w-5 h-5 text-gray-600" />
                    </a>
                </div>

                <div className="flex-1 p-5 overflow-auto flex items-center justify-center">
                    <Suspense fallback={<div className="text-center p-4">Loading form...</div>}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
