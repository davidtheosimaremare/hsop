import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md px-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
                <p className="text-gray-600 mb-8">
                    Anda tidak memiliki izin untuk mengakses halaman ini. 
                    Silakan hubungi administrator jika Anda memerlukan akses.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button asChild className="bg-red-600 hover:bg-red-700">
                        <Link href="/admin">Kembali ke Dashboard</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="javascript:history.back()">Kembali</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
