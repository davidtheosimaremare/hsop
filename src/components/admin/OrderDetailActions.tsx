"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrder } from "@/app/actions/order";
import { Loader2, Save, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

// Mock Upload Function (Will implement real upload later if needed)
// For now, it just accepts a URL string
async function uploadFile(file: File) {
    // In a real app, upload to S3/Blob storage and return URL
    // Here we just return a fake URL for demonstration
    return `https://example.com/uploads/${file.name}`;
}

interface OrderDetailActionsProps {
    order: any; // Type accurately if possible, using 'any' for speed now
}

export function OrderDetailActions({ order }: OrderDetailActionsProps) {
    const [status, setStatus] = useState(order.status);
    const [discount, setDiscount] = useState(order.discount);
    const [notes, setNotes] = useState(order.notes || "");
    const [attachmentQuote, setQuote] = useState(order.attachmentQuote || "");
    const [attachmentPO, setPO] = useState(order.attachmentPO || "");
    const [attachmentInvoice, setInvoice] = useState(order.attachmentInvoice || "");

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateOrder(order.id, {
                status,
                discount: Number(discount),
                notes,
                attachmentQuote,
                attachmentPO,
                attachmentInvoice,
            });

            if (res.success) {
                alert("Pesanan berhasil diupdate!");
                router.refresh();
            } else {
                alert("Gagal mengupdate pesanan.");
            }
        });
    };

    return (
        <Card className="border-blue-100 shadow-sm mt-6">
            <CardHeader className="bg-blue-50/50">
                <CardTitle className="text-blue-900">Aksi & Pengaturan</CardTitle>
                <CardDescription>Ubah status, diskon, dan file lampiran.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">

                {/* Status & Discount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Status Pesanan</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PROCESSED">Diproses</SelectItem>
                                <SelectItem value="COMPLETED">Selesai</SelectItem>
                                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Diskon Tambahan (Rp)</Label>
                        <Input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                        />
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label>Catatan Internal</Label>
                    <Textarea
                        placeholder="Catatan untuk tim..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Attachments (Text Input for URL for now) */}
                <div className="space-y-4 border-t pt-4">
                    <Label className="font-semibold">Lampiran (URL)</Label>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500">Link Penawaran (Quote)</Label>
                            <Input value={attachmentQuote} onChange={(e) => setQuote(e.target.value)} placeholder="https://..." />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500">Link PO Customer</Label>
                            <Input value={attachmentPO} onChange={(e) => setPO(e.target.value)} placeholder="https://..." />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500">Link Invoice</Label>
                            <Input value={attachmentInvoice} onChange={(e) => setInvoice(e.target.value)} placeholder="https://..." />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Simpan Perubahan
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
