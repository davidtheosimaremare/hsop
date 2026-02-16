"use client";

import { useEffect, useState } from "react";
import { getAdminUpgradeRequests, processUpgradeRequest } from "@/app/actions/upgrade";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ExternalLink, CheckCircle, XCircle, FileText } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function AdminUpgradesPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        const res = await getAdminUpgradeRequests(statusFilter);
        if (res.success) {
            setRequests(res.requests || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const handleProcess = async (action: "APPROVE" | "REJECT") => {
        if (!selectedRequest) return;
        setIsProcessing(true);

        try {
            const res = await processUpgradeRequest(selectedRequest.id, action, action === "REJECT" ? rejectReason : undefined);
            if (res.success) {
                toast.success(`Permintaan berhasil ${action === "APPROVE" ? "disetujui" : "ditolak"}`);
                setSelectedRequest(null);
                setRejectReason("");
                fetchRequests();
            } else {
                toast.error(res.error || "Gagal memproses permintaan");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Permintaan Upgrade Akun</h1>
            </div>

            <Tabs defaultValue="PENDING" onValueChange={setStatusFilter} className="w-full">
                <TabsList>
                    <TabsTrigger value="PENDING">Menunggu ({statusFilter === "PENDING" ? requests.length : "?"})</TabsTrigger>
                    <TabsTrigger value="APPROVED">Disetujui</TabsTrigger>
                    <TabsTrigger value="REJECTED">Ditolak</TabsTrigger>
                </TabsList>

                <div className="mt-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : requests.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-gray-500">
                                Tidak ada permintaan dengan status ini.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {requests.map((req) => (
                                <Card key={req.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setSelectedRequest(req)}>
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${req.requestType === "EXCLUSIVE" ? "bg-amber-100 text-amber-600" : "bg-purple-100 text-purple-600"
                                                }`}>
                                                {req.requestType === "EXCLUSIVE" ? <AwardIcon /> : <StoreIcon />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{req.user.name}</p>
                                                <p className="text-sm text-gray-500">{req.user.email} • {req.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge>{req.requestType}</Badge>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Tabs>

            {/* Detail Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Permintaan Upgrade</DialogTitle>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Informasi User</h3>
                                    <div className="mt-2 space-y-1 text-sm">
                                        <p><span className="text-gray-500">Nama:</span> {selectedRequest.user.name}</p>
                                        <p><span className="text-gray-500">Email:</span> {selectedRequest.user.email}</p>
                                        <p><span className="text-gray-500">Telepon:</span> {selectedRequest.phone}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900">Detail Usaha</h3>
                                    <div className="mt-2 space-y-1 text-sm">
                                        <p><span className="text-gray-500">Tipe Upgrade:</span> <Badge>{selectedRequest.requestType}</Badge></p>
                                        <p><span className="text-gray-500">Perusahaan:</span> {selectedRequest.companyName || "-"}</p>
                                        <p><span className="text-gray-500">Jenis Usaha:</span> {selectedRequest.businessType || "-"}</p>
                                        <p><span className="text-gray-500">Alamat:</span> {selectedRequest.address}</p>
                                    </div>
                                </div>

                                {selectedRequest.status === "PENDING" && (
                                    <div className="pt-4 border-t">
                                        <h3 className="font-semibold text-gray-900 mb-2">Aksi</h3>
                                        <div className="flex gap-2">
                                            <Button
                                                className="bg-green-600 hover:bg-green-700 text-white w-full"
                                                onClick={() => handleProcess("APPROVE")}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                                Setujui
                                            </Button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="destructive" className="w-full" disabled={isProcessing}>
                                                        <XCircle className="w-4 h-4 mr-2" /> Tolak
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader><DialogTitle>Alasan Penolakan</DialogTitle></DialogHeader>
                                                    <Textarea
                                                        placeholder="Masukkan alasan penolakan..."
                                                        value={rejectReason}
                                                        onChange={(e) => setRejectReason(e.target.value)}
                                                    />
                                                    <DialogFooter>
                                                        <Button onClick={() => handleProcess("REJECT")} variant="destructive">
                                                            Konfirmasi Tolak
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Dokumen</h3>

                                <div className="border rounded-lg p-2">
                                    <p className="text-xs font-semibold mb-2">KTP</p>
                                    <div className="relative aspect-video rounded-md overflow-hidden bg-gray-100">
                                        <Image
                                            src={selectedRequest.ktp}
                                            alt="KTP"
                                            fill
                                            className="object-contain"
                                        />
                                        <a href={selectedRequest.ktp} target="_blank" rel="noopener" className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded hover:bg-black/70">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>

                                {selectedRequest.npwp && (
                                    <div className="border rounded-lg p-2">
                                        <p className="text-xs font-semibold mb-2">NPWP</p>
                                        <div className="relative aspect-video rounded-md overflow-hidden bg-gray-100">
                                            <Image
                                                src={selectedRequest.npwp}
                                                alt="NPWP"
                                                fill
                                                className="object-contain"
                                            />
                                            <a href={selectedRequest.npwp} target="_blank" rel="noopener" className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded hover:bg-black/70">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StoreIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" /></svg>
    )
}

function AwardIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
    )
}
