import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Plus, Download, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalesDeliveriesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pengiriman Penjualan</h1>
                    <p className="text-sm text-gray-500">Kelola pengiriman barang ke customer</p>
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
                        Buat Pengiriman
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Truck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">0</p>
                                <p className="text-sm text-gray-500">Total Pengiriman</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-sm text-gray-500">Dalam Perjalanan</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-sm text-gray-500">Terkirim</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                        <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-sm text-gray-500">Gagal Kirim</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengiriman</CardTitle>
                    <CardDescription>
                        Semua pengiriman barang ke customer
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-gray-500">
                        <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Belum ada pengiriman</p>
                        <p className="text-sm">Pengiriman akan dibuat setelah pesanan diproses</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
