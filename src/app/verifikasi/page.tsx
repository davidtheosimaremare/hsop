"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Home, Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyOTP, resendOTP } from "@/app/actions/verify";

function VerificationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const errorParam = searchParams.get("error");

    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        if (!email) {
            setMessage({ type: 'error', text: "Parameter email hilang. Silakan daftar ulang." });
        }
        if (errorParam === 'send_failed') {
            setMessage({ type: 'error', text: "Gagal mengirim pesan WhatsApp. Silakan coba kirim ulang." });
        }
    }, [email, errorParam]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const result = await verifyOTP(email, otp);

            if (result.success) {
                setMessage({ type: 'success', text: "Verifikasi Berhasil! Mengalihkan..." });
                setTimeout(() => {
                    router.push("/masuk?registered=true");
                }, 2000);
            } else {
                setMessage({ type: 'error', text: result.error || "Verifikasi gagal." });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Terjadi kesalahan sistem." });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleResend() {
        if (!email) return;
        setIsLoading(true);
        setMessage(null);

        try {
            const result = await resendOTP(email);
            if (result.success) {
                setMessage({ type: 'success', text: "Kode baru telah dikirim ke WhatsApp Anda." });
                setCountdown(60); // Reset countdown
            } else {
                setMessage({ type: 'error', text: result.error || "Gagal mengirim ulang kode." });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Terjadi kesalahan sistem." });
        } finally {
            setIsLoading(false);
        }
    }

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

            <h2 className="text-lg font-bold text-gray-900 mb-1">Verifikasi Akun Anda</h2>
            <p className="text-xs text-gray-500 mb-5">
                Masukkan 6 digit kode yang kami kirim ke <b>WhatsApp</b> dan <b>Email</b> Anda.
            </p>

            {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-xs border ${message.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    <p>{message.text}</p>
                </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Kode OTP
                    </label>
                    <Input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        className="h-10 text-center text-lg tracking-widest"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full h-10 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-70"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verifikasi"}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-xs text-gray-600 mb-2">Tidak menerima kode?</p>
                <button
                    onClick={handleResend}
                    disabled={countdown > 0 || isLoading}
                    className="flex items-center justify-center gap-1 mx-auto text-xs font-semibold text-red-600 hover:text-red-700 disabled:text-gray-400"
                >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {countdown > 0 ? `Kirim Ulang (${countdown}s)` : "Kirim Ulang Kode"}
                </button>
            </div>
        </div>
    );
}

export default function VerifikasiPage() {
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

                <h1 className="text-2xl font-bold mb-5 leading-tight">
                    Keamanan Terjamin, <span className="text-yellow-400">Verifikasi Mudah.</span>
                </h1>

                <p className="text-sm text-red-100 mb-8">
                    Kami mengirimkan kode OTP melalui WhatsApp dan Email untuk memastikan keamanan ganda pada akun Anda.
                </p>

                {/* Steps */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 opacity-50">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">1</div>
                        <p className="text-sm">Isi Formulir Pendaftaran</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 text-red-900 flex items-center justify-center text-sm font-bold">2</div>
                        <p className="text-sm font-bold">Verifikasi WA & Email</p>
                    </div>
                    <div className="flex items-center gap-3 opacity-50">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">3</div>
                        <p className="text-sm">Selesai & Masuk</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 bg-white flex flex-col">
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
                    <Suspense fallback={<div>Loading...</div>}>
                        <VerificationForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
