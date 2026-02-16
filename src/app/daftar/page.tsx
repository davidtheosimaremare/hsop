"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Building2, Home, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser } from "@/app/actions/register";
import { useRouter } from "next/navigation";

const memberBenefits = [
    { num: "1", title: "Potongan Harga Eksklusif", desc: "Penawaran harga spesial untuk member terdaftar." },
    { num: "2", title: "Fitur Pembelian Bulky", desc: "Kemudahan pembelian dalam jumlah besar." },
    { num: "3", title: "Request Quotation Mudah", desc: "Proses permintaan penawaran yang cepat." },
    { num: "4", title: "Prioritas Konsultasi Tim", desc: "Akses langsung ke tim ahli kami." },
];

export default function DaftarPage() {
    const router = useRouter();
    const [isCompany, setIsCompany] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        // Manual validation
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Konfirmasi kata sandi tidak cocok.");
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Kata sandi minimal 8 karakter.");
            setIsLoading(false);
            return;
        }

        // Format data
        formData.set("isCompany", isCompany.toString());

        // Format Phone (remove leading 0 if present, prepend +62 is implied by UI logic, but let's standardize)
        let phone = formData.get("phoneRaw") as string;
        if (phone.startsWith("0")) phone = phone.substring(1);
        formData.set("phone", `+62${phone}`);

        // Format Company Name
        if (isCompany) {
            const prefix = formData.get("companyPrefix") as string;
            const nameRaw = formData.get("companyNameRaw") as string;
            if (prefix && nameRaw) {
                formData.set("companyName", `${prefix}. ${nameRaw}`);
            } else {
                formData.set("companyName", nameRaw); // Fallback
            }
        }

        try {
            const result = await registerUser({} as any, formData);

            if (result.error) {
                setError(result.error);
            } else if (result.verifyRedirect) {
                // Redirect to Verification
                router.push(result.verifyRedirect);
            } else if (result.success) {
                // Fallback (should not happen if verify is on)
                router.push("/masuk?registered=true");
            }
        } catch (err) {
            setError("Terjadi kesalahan sistem. Silakan coba lagi.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

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
                    Bergabung Sekarang, <span className="text-yellow-400">Nikmati Keuntungannya.</span>
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

            {/* Right Side - Form */}
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

                        <h2 className="text-lg font-bold text-gray-900 mb-1">Buat Akun Baru</h2>
                        <p className="text-xs text-gray-500 mb-4">
                            Daftar untuk menikmati semua fitur Hokiindo Shop
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Basic Info */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </label>
                                <Input name="name" type="text" placeholder="Nama lengkap" className="h-9 text-sm" required />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <Input name="email" type="email" placeholder="contoh@email.com" className="h-9 text-sm" required />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    No. Handphone <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <div className="w-14 h-9 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-600">
                                        +62
                                    </div>
                                    <Input name="phoneRaw" type="tel" placeholder="8123456789" className="flex-1 h-9 text-sm" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Kata Sandi <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min. 8 karakter"
                                            className="h-9 text-sm pr-8"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Konfirmasi <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Ulangi sandi"
                                            className="h-9 text-sm pr-8"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Company Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsCompany(!isCompany)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isCompany
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Building2 className={`w-4 h-4 ${isCompany ? 'text-red-600' : 'text-gray-400'}`} />
                                    <span className={`text-xs font-medium ${isCompany ? 'text-red-700' : 'text-gray-600'}`}>
                                        Daftar sebagai Perusahaan
                                    </span>
                                </div>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isCompany ? 'bg-red-600 border-red-600' : 'border-gray-300'
                                    }`}>
                                    {isCompany && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </button>

                            {/* Company Fields */}
                            <AnimatePresence>
                                {isCompany && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Nama Perusahaan <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <select name="companyPrefix" className="w-14 h-9 text-xs border border-gray-200 rounded-lg px-2 bg-white focus:outline-none focus:ring-1 focus:ring-red-500">
                                                        <option>PT</option>
                                                        <option>CV</option>
                                                        <option>UD</option>
                                                    </select>
                                                    <Input name="companyNameRaw" type="text" placeholder="Nama perusahaan" className="flex-1 h-9 text-sm" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Jenis Usaha <span className="text-red-500">*</span>
                                                </label>
                                                <select name="businessType" className="w-full h-9 text-xs border border-gray-200 rounded-lg px-2 bg-white focus:outline-none focus:ring-1 focus:ring-red-500">
                                                    <option value="">Pilih jenis usaha...</option>
                                                    <option>Kontraktor</option>
                                                    <option>Panel Builder</option>
                                                    <option>Distributor</option>
                                                    <option>Lainnya</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Alamat Kantor <span className="text-red-500">*</span>
                                                </label>
                                                <Input name="address" type="text" placeholder="Jl. Contoh No. 123, Kota, Provinsi" className="h-9 text-sm" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Terms */}
                            <p className="text-[10px] text-gray-500">
                                Dengan mendaftar, Anda menyetujui{" "}
                                <a href="#" className="text-red-600 hover:underline">Syarat dan Ketentuan</a> serta{" "}
                                <a href="#" className="text-red-600 hover:underline">Kebijakan Privasi</a>.
                            </p>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-10 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    "Daftar Sekarang"
                                )}
                            </Button>

                            {/* Login Link */}
                            <p className="text-center text-xs text-gray-600">
                                Sudah punya akun?{" "}
                                <a href="/masuk" className="text-red-600 font-semibold hover:underline">Masuk</a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
