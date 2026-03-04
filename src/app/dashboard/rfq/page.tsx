"use client";

import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RFQPage() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
                Sales Quotation
            </h2>
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-32 h-32 mb-6 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Handshake className="w-20 h-20 text-teal-500" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Pengajuan Sales Quotation</h3>
                <p className="text-sm text-gray-500 text-center max-w-md mb-6">Cari Produk Siemens Electrical dan Barang Electrical lainnya, lalu ajukan Sales Quotation untuk mendapatkan penawaran terbaik.</p>
                <Link href="/pencarian">
                    <Button className="bg-red-600 hover:bg-red-700 text-white px-6">
                        Mulai Belanja
                    </Button>
                </Link>
            </div>
        </div>
    );
}
