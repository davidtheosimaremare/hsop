"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/app/actions/auth";
import { useActionState } from "react";

export default function LupaPasswordPage() {
    // Initial state for the action
    const initialState = { error: "", success: false, message: "" };
    const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

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
                    <h1 className="text-2xl font-bold text-gray-900">Lupa Kata Sandi?</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Jangan khawatir. Masukkan email Anda dan kami akan mengirimkan kode OTP untuk reset password.
                    </p>
                </div>

                {/* Messages */}
                {state?.success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        <p className="font-semibold mb-1">Permintaan Terkirim!</p>
                        <p>{state.message}</p>
                        <div className="mt-3">
                            <Link href={state.redirect || "/reset-password"} className="text-green-800 underline font-bold">
                                Masukkan Kode OTP
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
                    <form action={formAction} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Terdaftar
                            </label>
                            <div className="relative">
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="contoh@email.com"
                                    className="h-11 pl-4"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Kirim Kode OTP <Send className="w-4 h-4" />
                                </>
                            )}
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
                        Kembali ke Halaman Masuk
                    </Link>
                </div>
            </div>
        </div>
    );
}
