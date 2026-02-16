import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, Download, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalesInvoicesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Faktur Penjualan</h1>
                    <p className="text-sm text-gray-500">Kelola faktur penjualan dan pembayaran</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Faktur
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Receipt className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">0</p>
                                <p className="text-sm text-gray-500">Total Faktur</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">Rp 0</p>
                            <p className="text-sm text-gray-500">Belum Dibayar</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">Rp 0</p>
                            <p className="text-sm text-gray-500">Lunas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-sm text-gray-500">Jatuh Tempo</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Faktur</CardTitle>
                    <CardDescription>
                        Semua faktur penjualan dan status pembayaran
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-gray-500">
                        <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Belum ada faktur</p>
                        <p className="text-sm">Faktur akan dibuat setelah pengiriman selesai</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
