"use client";

import { FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InvoicePage() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
                Delivery Order / Invoice
            </h2>
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-32 h-32 mb-6 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FileCheck className="w-20 h-20 text-teal-500" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada DO / Invoice</h3>
                <p className="text-sm text-gray-500 text-center max-w-md mb-6">Anda belum memiliki Delivery Order atau Invoice. Dokumen akan muncul setelah Sales Order diproses.</p>
                <Link href="/pencarian">
                    <Button className="bg-red-600 hover:bg-red-700 text-white px-6">
                        Mulai Belanja
                    </Button>
                </Link>
            </div>
        </div>
    );
}
