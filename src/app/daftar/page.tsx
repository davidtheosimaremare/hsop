"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Clock, TrendingUp, Shield, Truck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccountType = "bisnis" | "retail";

const businessSteps = [
    { icon: Check, title: "Daftar Akun Bisnis", desc: "Daftarkan perusahaan Anda dan lengkapi data Anda." },
    { icon: Clock, title: "Tentukan Limit Kredit", desc: "Tentukan limit kredit sesuai dengan kebutuhan proyek Anda." },
    { icon: Shield, title: "Lengkapi Dokumen Persyaratan", desc: "Lengkapi dokumen persyaratan yang dibutuhkan untuk proses pengajuan kredit." },
    { icon: TrendingUp, title: "Kirim Pengajuan", desc: "Pengajuan Anda akan kami proses pada hari yang sama." },
    { icon: Check, title: "Nikmati Fasilitasnya", desc: "Anda dapat langsung melakukan transaksi di Hokiindo." },
];

const retailBenefits = [
    { num: "1", title: "Katalog Produk Lengkap dan 100% Original", desc: "Temukan seluruh kebutuhan konstruksi Anda dalam satu platform lengkap dan kualitas produk terjamin." },
    { num: "2", title: "Harga Terakurat dan Opsi Pembayaran Beragam", desc: "Cek harga terkini dari kebutuhan konstruksi Anda dan nikmati kemudahan berbelanja dengan beragam opsi pembayaran yang tersedia." },
    { num: "3", title: "Pengiriman yang efisien", desc: "Opsi pengiriman yang beragam dan efisien, mencapai skala nasional." },
];

const businessFeatures = [
    { icon: Clock, title: "Persetujuan instan pada hari yang sama" },
    { icon: TrendingUp, title: "Peluang kredit yang besar & dapat terus meningkat" },
    { icon: Shield, title: "Fleksibilitas pembayaran (30, 60, 90 hari)" },
    { icon: Check, title: "Transparan, simpel, dan aman" },
];

export default function DaftarPage() {
    const [accountType, setAccountType] = useState<AccountType>("bisnis");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Info Panel */}
            <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-red-700 to-red-900 text-white p-6 flex-col">
                {/* Logo */}
                <div className="mb-4">
                    <Image
                        src="/logo.png"
                        alt="Hokiindo Logo"
                        width={140}
                        height={45}
                        className="h-8 w-auto object-contain brightness-0 invert"
                    />
                </div>

                {/* Badge */}
                <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-yellow-500 text-red-900 text-xs font-medium rounded-full">
                        Memperkenalkan Hokiindo Shop
                    </span>
                </div>

                {/* Headline */}
                {accountType === "bisnis" ? (
                    <h1 className="text-2xl font-bold mb-4 leading-tight">
                        Bangun Dulu. <span className="text-yellow-400">Bayar Nanti.</span>
                    </h1>
                ) : (
                    <h1 className="text-2xl font-bold mb-4 leading-tight">
                        Gabung sekarang dan gunakan fitur mudahnya.
                    </h1>
                )}

                {/* Steps/Benefits */}
                <div className="flex-1 overflow-auto">
                    {accountType === "bisnis" ? (
                        <div className="space-y-3">
                            {businessSteps.map((step, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <step.icon className="w-3 h-3 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold">{step.title}</h3>
                                        <p className="text-xs text-red-200">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {retailBenefits.map((benefit, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <div className="w-5 h-5 bg-yellow-500 text-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                                        {benefit.num}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold">{benefit.title}</h3>
                                        <p className="text-xs text-red-200">{benefit.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Features - Only for Business */}
                {accountType === "bisnis" && (
                    <div className="mt-4 pt-3 border-t border-red-600">
                        <div className="grid grid-cols-4 gap-2">
                            {businessFeatures.map((feature, index) => (
                                <div key={index} className="text-center">
                                    <div className="w-8 h-8 bg-red-600/50 rounded-lg flex items-center justify-center mx-auto mb-1">
                                        <feature.icon className="w-4 h-4 text-red-200" />
                                    </div>
                                    <p className="text-[10px] text-red-200 leading-tight">{feature.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 bg-white flex flex-col">
                <div className="flex-1 p-5 md:p-6 overflow-auto">
                    <div className="max-w-md mx-auto">
                        {/* Mobile Logo */}
                        <div className="lg:hidden mb-4">
                            <Image
                                src="/logo.png"
                                alt="Hokiindo Logo"
                                width={120}
                                height={40}
                                className="h-8 w-auto object-contain"
                            />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-4">Jenis Akun</h2>

                        {/* Account Type Tabs */}
                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                onClick={() => setAccountType("bisnis")}
                                className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${accountType === "bisnis"
                                    ? "border-red-600 text-red-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Bisnis
                            </button>
                            <button
                                onClick={() => setAccountType("retail")}
                                className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${accountType === "retail"
                                    ? "border-red-600 text-red-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Retail
                            </button>
                        </div>

                        {/* Form */}
                        <motion.div
                            key={accountType}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                {accountType === "bisnis" ? "Informasi Umum Perusahaan" : "Informasi Umum Pengguna"}
                            </h3>
                            <p className="text-xs text-gray-500 mb-3">
                                {accountType === "bisnis"
                                    ? "Akun bisnis wajib menyertakan keterangan perusahaan untuk verifikasi."
                                    : "Pengguna retail adalah pengguna non-bisnis yang tidak wajib menyertakan dokumen perusahaan."}
                            </p>

                            <form className="space-y-3">
                                {/* Business Fields */}
                                {accountType === "bisnis" && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Nama Perusahaan <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <select className="w-16 h-9 text-xs border border-gray-300 rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-red-500">
                                                    <option>PT</option>
                                                    <option>CV</option>
                                                    <option>UD</option>
                                                </select>
                                                <Input
                                                    type="text"
                                                    placeholder="eg, Hokiindo Perkasa"
                                                    className="flex-1 h-9 text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Jenis Perusahaan <span className="text-red-500">*</span>
                                            </label>
                                            <select className="w-full h-9 text-xs border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-red-500">
                                                <option value="">Pilih Jenis Perusahaan disini...</option>
                                                <option>Kontraktor</option>
                                                <option>Developer</option>
                                                <option>Retailer</option>
                                                <option>Lainnya</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* Common Fields */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Nama {accountType === "bisnis" ? "Pengguna" : "Lengkap Pengguna"} Sesuai KTP <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="eg, Dani Kurnianto"
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Email Pengguna <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="eg, ajm@hokiindo.com"
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        No. Handphone Pengguna <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select className="w-16 h-9 text-xs border border-gray-300 rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-red-500">
                                            <option>+62</option>
                                        </select>
                                        <Input
                                            type="tel"
                                            placeholder="eg, 871037282"
                                            className="flex-1 h-9 text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Kata Sandi <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Kata Sandi"
                                            className="h-9 text-xs pr-9"
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
                                        Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Kata Sandi"
                                            className="h-9 text-xs pr-9"
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

                                {/* Terms */}
                                <p className="text-[10px] text-gray-500">
                                    Dengan mendaftar, Anda menyetujui{" "}
                                    <a href="#" className="text-red-600 underline">Syarat dan Ketentuan</a> serta{" "}
                                    <a href="#" className="text-red-600 underline">Kebijakan Privasi</a>
                                </p>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-9 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Daftar Sekarang!
                                </Button>

                                {/* Login Link */}
                                <p className="text-center text-xs text-gray-600">
                                    Sudah punya akun?{" "}
                                    <a href="/masuk" className="text-red-600 font-semibold hover:underline">
                                        Masuk
                                    </a>
                                </p>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
