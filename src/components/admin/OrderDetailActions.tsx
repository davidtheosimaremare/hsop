"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrder } from "@/app/actions/order";
import { uploadFile } from "@/app/actions/upload";
import { Loader2, Save, Upload, FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";


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
                toast.success("Pesanan berhasil diupdate!");
                router.refresh();
            } else {
                toast.error("Gagal mengupdate pesanan.");
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

                {/* Attachments (File Upload) */}
                <div className="space-y-4 border-t pt-4">
                    <Label className="font-semibold text-blue-900 border-l-4 border-blue-500 pl-2">Lampiran Dokumen</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Quote */}
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500 uppercase font-black">Penawaran (Quote)</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        const res = await uploadFile(formData, false, "files");
                                        if (res.success && res.url) setQuote(res.url);
                                    }}
                                    className="text-xs h-9"
                                />
                                {attachmentQuote && (
                                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg group">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        <span className="text-[10px] font-bold truncate flex-1 text-blue-800">{attachmentQuote.split('/').pop()}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-50 hover:text-red-600" onClick={() => setQuote("")}><X className="w-3 h-3" /></Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PO */}
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500 uppercase font-black">PO Customer</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        const res = await uploadFile(formData, false, "files");
                                        if (res.success && res.url) setPO(res.url);
                                    }}
                                    className="text-xs h-9"
                                />
                                {attachmentPO && (
                                    <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg group">
                                        <FileText className="w-4 h-4 text-emerald-600" />
                                        <span className="text-[10px] font-bold truncate flex-1 text-emerald-800">{attachmentPO.split('/').pop()}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-50 hover:text-red-600" onClick={() => setPO("")}><X className="w-3 h-3" /></Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invoice */}
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500 uppercase font-black">Invoice</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        const res = await uploadFile(formData, false, "files");
                                        if (res.success && res.url) setInvoice(res.url);
                                    }}
                                    className="text-xs h-9"
                                />
                                {attachmentInvoice && (
                                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg group">
                                        <FileText className="w-4 h-4 text-red-600" />
                                        <span className="text-[10px] font-bold truncate flex-1 text-red-800">{attachmentInvoice.split('/').pop()}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-50 hover:text-red-600" onClick={() => setInvoice("")}><X className="w-3 h-3" /></Button>
                                    </div>
                                )}
                            </div>
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
