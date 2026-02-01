"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const slides = [
    {
        title: "Pembayaran Yang Mudah",
        description: "Hokiindo menyediakan berbagai macam metode pembayaran yang mudah dan beragam",
    },
    {
        title: "Produk Berkualitas",
        description: "Temukan produk electrical berkualitas tinggi dari brand terpercaya",
    },
    {
        title: "Pengiriman Cepat",
        description: "Layanan pengiriman cepat dan aman ke seluruh Indonesia",
    },
];

export default function MasukPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [rememberMe, setRememberMe] = useState(false);

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-50 flex-col items-center justify-center p-8">
                {/* Logo */}
                <div className="mb-8">
                    <Image
                        src="/logo.png"
                        alt="Hokiindo Logo"
                        width={160}
                        height={50}
                        className="h-12 w-auto object-contain"
                    />
                </div>

                {/* Illustration Placeholder */}
                <div className="w-64 h-48 bg-gray-200 rounded-2xl mb-8 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Illustration</span>
                </div>

                {/* Slide Content */}
                <div className="text-center max-w-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {slides[currentSlide].title}
                    </h2>
                    <p className="text-sm text-gray-600">
                        {slides[currentSlide].description}
                    </p>
                </div>

                {/* Dots Indicator */}
                <div className="flex items-center gap-2 mt-6">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${currentSlide === index
                                ? "w-6 bg-gray-800"
                                : "bg-gray-300"
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-8">
                <div className="w-full max-w-sm">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Image
                            src="/logo.png"
                            alt="Hokiindo Logo"
                            width={140}
                            height={45}
                            className="h-10 w-auto object-contain"
                        />
                    </div>

                    {/* Header */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Selamat Datang!
                    </h1>
                    <p className="text-sm text-gray-600 mb-6">
                        Sebelum berbelanja, mohon untuk masuk dengan akun dahulu.
                    </p>

                    {/* Form */}
                    <form className="space-y-4">
                        {/* Email */}
                        <div>
                            <Input
                                type="email"
                                placeholder="Email"
                                className="h-11 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Kata Sandi"
                                    className="h-11 text-sm pr-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="flex justify-end mt-1">
                                <a href="#" className="text-xs text-teal-600 hover:underline">
                                    Lupa Kata Sandi?
                                </a>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <label htmlFor="remember" className="text-sm text-gray-700">
                                Tetap Masuk
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
                        >
                            Masuk
                        </Button>

                        {/* Register Link */}
                        <p className="text-center text-sm text-gray-600">
                            Belum punya akun?{" "}
                            <a href="/daftar" className="text-teal-600 font-semibold hover:underline">
                                Daftar Sekarang
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
