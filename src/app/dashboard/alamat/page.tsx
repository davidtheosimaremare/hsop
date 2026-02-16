"use client";

import { Button } from "@/components/ui/button";

export default function AlamatPage() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
                Alamat Pengiriman
            </h2>
            <div>
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">Anda belum menambahkan alamat pengiriman.</p>
                    <Button className="bg-red-600 hover:bg-red-700 text-white">
                        Tambah Alamat
                    </Button>
                </div>
            </div>
        </div>
    );
}
