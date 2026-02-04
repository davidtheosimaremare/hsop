"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Setting Halaman</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Toko</CardTitle>
                        <CardDescription>Pengaturan umum informasi toko</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nama Toko</Label>
                            <Input defaultValue="Hokiindo Shop" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Kontak</Label>
                            <Input defaultValue="support@hokiindo.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Nomor Telepon</Label>
                            <Input defaultValue="+62 812 3456 7890" />
                        </div>
                        <Button className="w-full bg-red-600 hover:bg-red-700">Simpan Perubahan</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pengaturan SEO</CardTitle>
                        <CardDescription>Optimasi mesin pencari untuk halaman utama</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Meta Title</Label>
                            <Input defaultValue="Hokiindo - Distributor Alat Listrik Siemens" />
                        </div>
                        <div className="space-y-2">
                            <Label>Meta Description</Label>
                            <Input defaultValue="Temukan produk listrik Siemens terlengkap dan termurah hanya di Hokiindo." />
                        </div>
                        <Button variant="outline" className="w-full">Update SEO</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
