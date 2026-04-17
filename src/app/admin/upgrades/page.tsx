"use client";

import { useEffect, useState } from "react";
import { getAdminUpgradeRequests, processUpgradeRequest } from "@/app/actions/upgrade";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
    Loader2, 
    ExternalLink, 
    CheckCircle, 
    XCircle, 
    FileText, 
    User, 
    Mail, 
    Phone, 
    Calendar, 
    Building2, 
    MapPin, 
    ShieldCheck,
    Eye,
    ArrowUpCircle,
    Store,
    UserCheck,
    Search,
    Filter
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const REQUEST_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    'RETAIL': { label: 'Retail/Perorangan', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: User },
    'RESELLER': { label: 'Reseller', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: Store },
    'EXCLUSIVE': { label: 'Exclusive Partner', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: ShieldCheck },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    'PENDING': { label: 'Menunggu', color: 'bg-amber-100 text-amber-700' },
    'APPROVED': { label: 'Disetujui', color: 'bg-green-100 text-green-700' },
    'REJECTED': { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
};

export default function AdminUpgradesPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await getAdminUpgradeRequests(statusFilter);
            if (res.success) {
                setRequests(res.requests || []);
            }
        } catch (error) {
            toast.error("Gagal memuat data");
        } finally {
            setLoading(false);
        }
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

    const filteredRequests = requests.filter(req => 
        req.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <ArrowUpCircle className="w-6 h-6 text-red-600" />
                        Permintaan Upgrade Akun
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Kelola permohonan konversi customer menjadi Reseller atau Retail.</p>
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="pb-0 px-6 pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <Tabs defaultValue="PENDING" onValueChange={setStatusFilter} className="w-full md:w-auto">
                            <TabsList className="bg-gray-100/80 p-1 rounded-xl">
                                <TabsTrigger value="PENDING" className="rounded-lg px-4 font-bold data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
                                    Menunggu
                                </TabsTrigger>
                                <TabsTrigger value="APPROVED" className="rounded-lg px-4 font-bold data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm">
                                    Disetujui
                                </TabsTrigger>
                                <TabsTrigger value="REJECTED" className="rounded-lg px-4 font-bold data-[state=active]:bg-white data-[state=active]:text-gray-600 data-[state=active]:shadow-sm">
                                    Ditolak
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Cari nama atau email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>
                </CardHeader>

                <div className="mt-6 overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                            <p className="text-sm font-bold text-gray-400">Memuat data permintaan...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                <Filter className="w-8 h-8 text-gray-200" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Tidak ada permintaan</h3>
                            <p className="text-sm text-gray-400 max-w-xs mt-1">Belum ada data permintaan upgrade akun dengan kriteria yang dipilih.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-y border-gray-50">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipe Upgrade</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu Pengajuan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dokumen</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRequests.map((req) => {
                                    const typeConfig = REQUEST_TYPE_CONFIG[req.requestType] || REQUEST_TYPE_CONFIG['RETAIL'];
                                    const TypeIcon = typeConfig.icon;
                                    return (
                                        <tr key={req.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-100 shrink-0">
                                                        <User className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{req.user?.name || "No Name"}</p>
                                                        <p className="text-[11px] text-gray-400 font-medium truncate">{req.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={cn("rounded-lg px-2.5 py-1 text-[10px] font-black border shadow-none flex items-center w-fit gap-1.5", typeConfig.color)}>
                                                    <TypeIcon className="w-3 h-3" />
                                                    {typeConfig.label.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {format(new Date(req.createdAt), 'dd MMMM yyyy', { locale: localeId })}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        Pukul {format(new Date(req.createdAt), 'HH:mm')} WIB
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn("w-2 h-2 rounded-full", req.ktp ? "bg-green-500" : "bg-red-500")} title="KTP" />
                                                    <div className={cn("w-2 h-2 rounded-full", req.npwp ? "bg-green-500" : "bg-gray-200")} title="NPWP" />
                                                    <span className="text-[10px] font-bold text-gray-400 ml-1">
                                                        {req.npwp ? "KTP & NPWP" : "Hanya KTP"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setSelectedRequest(req)}
                                                    className="h-8 rounded-lg font-bold text-xs hover:bg-red-50 hover:text-red-600 gap-1.5"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Detail
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-3xl overflow-hidden shadow-2xl">
                    {selectedRequest && (
                        <div className="flex flex-col">
                            {/* Header Gradient */}
                            <div className="bg-gradient-to-r from-gray-900 to-slate-800 p-8 text-white relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                                            <UserCheck className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight">{selectedRequest.user?.name}</h2>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-white/60 font-medium text-sm">
                                                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {selectedRequest.user?.email}</span>
                                                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedRequest.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge className={cn("rounded-xl px-4 py-2 text-xs font-black border-none shadow-lg", REQUEST_TYPE_CONFIG[selectedRequest.requestType]?.color || "bg-white text-gray-900")}>
                                        {REQUEST_TYPE_CONFIG[selectedRequest.requestType]?.label.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column: Info */}
                                <div className="space-y-8">
                                    <section>
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-red-500" />
                                            Informasi Usaha & Alamat
                                        </h3>
                                        <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase">Perusahaan</p>
                                                    <p className="text-sm font-bold text-gray-900">{selectedRequest.companyName || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase">Jenis Usaha</p>
                                                    <p className="text-sm font-bold text-gray-900">{selectedRequest.businessType || "-"}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase">Alamat Lengkap</p>
                                                <div className="flex items-start gap-2 mt-1">
                                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                                    <p className="text-sm font-bold text-gray-700 leading-relaxed">{selectedRequest.address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {selectedRequest.status === "PENDING" && (
                                        <section className="pt-4">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Aksi Persetujuan</h3>
                                            <div className="flex gap-3">
                                                <Button
                                                    className="bg-red-600 hover:bg-red-700 text-white font-black text-xs h-11 rounded-xl flex-1 shadow-lg shadow-red-500/20"
                                                    onClick={() => handleProcess("APPROVE")}
                                                    disabled={isProcessing}
                                                >
                                                    {isProcessing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                                    SETUJUI UPGRADE
                                                </Button>
                                                
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" className="border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs h-11 rounded-xl px-6" disabled={isProcessing}>
                                                            TOLAK
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="rounded-3xl border-none shadow-2xl p-6">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-xl font-black text-gray-900">Alasan Penolakan</DialogTitle>
                                                            <CardDescription>Berikan alasan yang jelas mengapa permintaan ini ditolak.</CardDescription>
                                                        </DialogHeader>
                                                        <div className="py-4">
                                                            <Textarea
                                                                placeholder="Contoh: Dokumen KTP tidak terbaca jelas atau data tidak sesuai..."
                                                                value={rejectReason}
                                                                onChange={(e) => setRejectReason(e.target.value)}
                                                                className="min-h-[120px] bg-gray-50 border-gray-100 rounded-2xl focus:ring-red-500/20 transition-all text-sm font-medium"
                                                            />
                                                        </div>
                                                        <DialogFooter className="gap-2">
                                                            <Button onClick={() => handleProcess("REJECT")} variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl w-full h-11">
                                                                KONFIRMASI TOLAK PERMINTAAN
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </section>
                                    )}

                                    {selectedRequest.status !== "PENDING" && (
                                        <section className="pt-4">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Status Akhir</h3>
                                            <div className={cn("rounded-2xl p-5 border flex items-center gap-4", STATUS_CONFIG[selectedRequest.status]?.color || "bg-gray-50")}>
                                                {selectedRequest.status === "APPROVED" ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                                <div>
                                                    <p className="text-sm font-black uppercase">PERMINTAAN {STATUS_CONFIG[selectedRequest.status]?.label}</p>
                                                    {selectedRequest.adminNotes && (
                                                        <p className="text-xs font-medium opacity-80 mt-0.5">{selectedRequest.adminNotes}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </section>
                                    )}
                                </div>

                                {/* Right Column: Documents */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-red-500" />
                                        Verifikasi Dokumen
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 group">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-[10px] font-black text-gray-400 uppercase">KARTU TANDA PENDUDUK (KTP)</p>
                                                <a href={selectedRequest.ktp} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-red-600 hover:underline flex items-center gap-1">
                                                    LIHAT FULL <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            </div>
                                            <div className="relative aspect-[1.586/1] rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm group-hover:border-red-200 transition-colors cursor-zoom-in">
                                                <Image
                                                    src={selectedRequest.ktp}
                                                    alt="KTP"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </div>

                                        {selectedRequest.npwp ? (
                                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 group">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase">NOMOR POKOK WAJIB PAJAK (NPWP)</p>
                                                    <a href={selectedRequest.npwp} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-red-600 hover:underline flex items-center gap-1">
                                                        LIHAT FULL <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                </div>
                                                <div className="relative aspect-[1.586/1] rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm group-hover:border-red-200 transition-colors cursor-zoom-in">
                                                    <Image
                                                        src={selectedRequest.npwp}
                                                        alt="NPWP"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                                <FileText className="w-8 h-8 text-gray-200 mb-2" />
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">NPWP TIDAK DILAMPIRKAN</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

