import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Package, User, Mail, Phone, AlertTriangle, FileText, Image as ImageIcon } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReturnDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // id could be quotation no slug
    // We reverse the slug to quotation no.
    const decodedId = decodeURIComponent(id).replace(/-/g, "/");

    const quotation = await db.salesQuotation.findFirst({
        where: {
            OR: [
                { id: decodedId },
                { quotationNo: decodedId },
                { accurateHsqNo: decodedId },
                { accurateHsoNo: decodedId }
            ],
            returnRequest: true
        },
        include: {
            customer: true,
            user: true,
            items: true
        }
    });

    if (!quotation) {
        return notFound();
    }

    const fmtPrice = (p: number) => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(p));

    let returnEvidences: string[] = [];
    if (quotation.returnEvidencePath) {
        try {
            const parsed = JSON.parse(quotation.returnEvidencePath);
            if (Array.isArray(parsed)) {
                returnEvidences = parsed;
            } else {
                returnEvidences = [quotation.returnEvidencePath];
            }
        } catch (e) {
            returnEvidences = [quotation.returnEvidencePath];
        }
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    <Link href="/admin/sales/returns" className="hover:text-red-600 transition-colors">Daftar Retur</Link>
                    <span>/</span>
                    <span className="text-slate-600">Detail Retur</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                    >
                        <Link href="/admin/sales/returns">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                Detail Retur
                            </h1>
                            <Badge className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-50 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                                Pengajuan
                            </Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-500 mt-1">
                            Ref: {quotation.accurateHsoNo || quotation.accurateHsqNo || quotation.quotationNo}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Info Customer & Order */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-500" /> Informasi Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Perusahaan</p>
                                <p className="text-sm font-black text-slate-900">{quotation.customer?.company || quotation.customer?.name || quotation.clientName || "—"}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Akun Pemesan</p>
                                    <p className="text-sm font-bold text-slate-700">{quotation.user?.name || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. Telepon Pemesan</p>
                                    <p className="text-sm font-bold text-slate-700">{quotation.user?.phone || quotation.phone || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Pemesan</p>
                                    <p className="text-sm font-bold text-slate-700">{quotation.user?.email || quotation.email || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Perusahaan</p>
                                    <p className="text-sm font-bold text-slate-700">{quotation.customer?.email || "—"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                                <Package className="w-4 h-4 text-slate-500" /> Informasi Pesanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. Sales Order</p>
                                    <p className="text-sm font-black text-slate-900">{quotation.accurateHsoNo || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. Delivery Order</p>
                                    <p className="text-sm font-black text-slate-900">{quotation.accurateDoNo || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. Penawaran (SQ)</p>
                                    <p className="text-sm font-bold text-slate-700">{quotation.quotationNo || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tgl Pesanan</p>
                                    <p className="text-sm font-bold text-slate-700">
                                        {new Date(quotation.createdAt).toLocaleDateString("id-ID", {
                                            day: "numeric", month: "long", year: "numeric"
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <Button variant="outline" size="sm" asChild className="text-xs font-bold w-full rounded-xl">
                                    <Link href={`/admin/sales/quotations/${quotation.quotationNo.replace(/\//g, "-")}`}>
                                        <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                        Lihat Detail Pesanan Asli
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Return Details */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white h-full flex flex-col">
                        <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-red-800 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" /> Pengajuan Retur Kustomer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col gap-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alasan Retur / Komplain</h4>
                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                    <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                        {quotation.returnReason || "—"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bukti Lampiran (Foto / Video)</h4>
                                {returnEvidences.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                                        {returnEvidences.map((url, i) => (
                                            <div key={i} className="aspect-square relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm group">
                                                {url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                    <video src={url} className="w-full h-full object-cover" controls playsInline />
                                                ) : (
                                                    <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                        <img src={url} alt={`Bukti ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ExternalLink className="w-6 h-6 text-white" />
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-400">Tidak ada lampiran bukti</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
