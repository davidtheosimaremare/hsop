"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, Lock, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/app/actions/auth";
import { useActionState } from "react";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const emailParam = searchParams.get("email") || "";
    const [showPassword, setShowPassword] = useState(false);

    // Initial state for the action
    const initialState = { error: "", success: false, message: "" };
    const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <Image
                        src="/logo.png"
                        alt="Hokiindo Logo"
                        width={180}
                        height={60}
                        className="h-12 w-auto object-contain mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-gray-900">Reset Kata Sandi</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Masukkan kode OTP yang dikirim ke email/WhatsApp dan buat kata sandi baru.
                    </p>
                </div>

                {/* Messages */}
                {state?.success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        <p className="font-semibold mb-1">Berhasil!</p>
                        <p>{state.message}</p>
                        <div className="mt-3">
                            <Link href="/masuk" className="w-full block text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium">
                                Masuk Sekarang
                            </Link>
                        </div>
                    </div>
                )}

                {state?.error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <p className="font-semibold">Gagal</p>
                        <p>{state.error}</p>
                    </div>
                )}

                {!state?.success && (
                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="email" value={emailParam} />

                        {/* OTP */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kode OTP
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    name="otp"
                                    type="text"
                                    placeholder="123456"
                                    className="h-11 pl-10 tracking-widest text-lg font-mono"
                                    maxLength={6}
                                    required
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kata Sandi Baru
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Minimal 6 karakter"
                                    className="h-11 pl-10 pr-10"
                                    required
                                    minLength={6}
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Konfirmasi Kata Sandi
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Ulangi kata sandi"
                                    className="h-11 pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-70 mt-2"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ubah Kata Sandi"}
                        </Button>
                    </form>
                )}

                {/* Footer */}
                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                    <Link
                        href="/masuk"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Batal
                    </Link>
                </div>
            </div>
        </div>
    );
}
