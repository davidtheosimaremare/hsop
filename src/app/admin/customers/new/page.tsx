
import { CustomerCreateForm } from "@/components/admin/CustomerCreateForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminCustomerNewPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tambah Customer Manual</h1>
                    <p className="text-sm text-gray-500">Buat data pelanggan baru di luar sinkronisasi Accurate.</p>
                </div>
            </div>

            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Formulir Customer Baru</CardTitle>
                        <CardDescription>
                            Isi data di bawah ini. ID Customer akan dibuat secara otomatis (MANUAL-...).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CustomerCreateForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
