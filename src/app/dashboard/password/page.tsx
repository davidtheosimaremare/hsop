"use client";

import { Button } from "@/components/ui/button";

export default function PasswordPage() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
                Ubah Kata Sandi
            </h2>
            <div className="max-w-md space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Lama</label>
                    <input
                        type="password"
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Baru</label>
                    <input
                        type="password"
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                    <input
                        type="password"
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                    />
                </div>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Ubah Kata Sandi
                </Button>
            </div>
        </div>
    );
}
