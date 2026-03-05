"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Loader2,
    Package,
    CheckCircle2,
    Truck,
    FileText,
    AlertTriangle,
    MessageSquare,
    Send,
    ImageIcon,
    AlertCircle,
    Download,
    RefreshCw,
    ShieldCheck,
    Clock,
    ChevronRight,
    ArrowUpRight,
    Info,
    CreditCard,
    X,
    Tag,
    FileUp,
    PackageCheck,
    BadgePercent,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getQuotationDetail, userSelectAlternative, userUndoAlternative, acceptProforma, updateQuotationAddress, cancelQuotation } from "@/app/actions/quotation";
import { userSubmitPO, userConfirmReceipt, userRequestReturn, userUploadPaymentProof } from "@/app/actions/rfq-flow";
import { uploadFile } from "@/app/actions/upload";
import { getUserAddresses, addUserAddress } from "@/app/actions/address";
import { format } from "date-fns";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash, XCircle } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; stage: number }> = {
    DRAFT: { label: "Penawaran", color: "text-gray-700", bg: "bg-gray-100 border-gray-200", stage: 1 },
    PENDING: { label: "Penawaran", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", stage: 1 },
    OFFERED: { label: "Penawaran Ditinjau", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", stage: 2 },
    CONFIRMED: { label: "Menunggu Verifikasi", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", stage: 3 },
    PROCESSING: { label: "Pembayaran", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", stage: 4 },
    SHIPPED: { label: "Dikirim", color: "text-sky-700", bg: "bg-sky-50 border-sky-200", stage: 5 },
    COMPLETED: { label: "Selesai", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", stage: 6 },
    CANCELLED: { label: "Dibatalkan", color: "text-red-700", bg: "bg-red-50 border-red-200", stage: 0 },
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
    DRAFT: "Simpan pesanan sebagai draft untuk dilengkapi nanti. Draft akan disimpan dan dapat dilanjutkan kapan saja.",
    PENDING: "Draft penawaran telah berhasil dikirimkan ke Hokiindo. Admin akan segera memverifikasi data dan mengirimkan dokumen SQ resmi.",
    OFFERED: "Tim sales sedang meninjau permintaan Anda. Harga dan ketersediaan akan dikonfirmasi secepatnya.",
    CONFIRMED: "Penawaran telah dikonfirmasi. Tim kami akan memverifikasi data pesanan sebelum diproses ke pembayaran.",
    PROCESSING: "Silakan lakukan pembayaran sesuai tagihan. Upload bukti pembayaran untuk mempercepat proses verifikasi.",
    SHIPPED: "Pesanan Anda sedang dalam perjalanan. Pantau status pengiriman melalui nomor resi yang tersedia.",
    COMPLETED: "Pesanan telah selesai dan diterima dengan baik. Terima kasih telah berbelanja di Hokiindo!",
    CANCELLED: "Penawaran ini telah dibatalkan. Anda dapat membuat penawaran baru kapan saja.",
};

const STEPS = [
    { s: 1, l: "Penawaran", icon: FileText },
    { s: 2, l: "Penawaran Resmi", icon: Send },
    { s: 3, l: "Verifikasi", icon: ShieldCheck },
    { s: 4, l: "Pembayaran", icon: CreditCard },
    { s: 5, l: "Pengiriman", icon: Truck },
    { s: 6, l: "Selesai", icon: CheckCircle2 },
];

export default function UserTransactionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [quotation, setQuotation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewStage, setViewStage] = useState<number>(1);

    // Alternative Payment Upload State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPaymentUploading, setIsPaymentUploading] = useState(false);
    const [paymentFileOpen, setPaymentFileOpen] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [poPath, setPoPath] = useState("");
    const [specialDiscountRequest, setSpecialDiscountRequest] = useState(false);
    const [specialDiscountNote, setSpecialDiscountNote] = useState("");

    const [receiptEvidence, setReceiptEvidence] = useState("");
    const [returnReason, setReturnReason] = useState("");
    const [returnEvidence, setReturnEvidence] = useState("");
    const [isReturning, setIsReturning] = useState(false);
    const [isReceiptChecked, setIsReceiptChecked] = useState(false);
    const [receiptEvidences, setReceiptEvidences] = useState<string[]>([]);

    // Address State
    const [addresses, setAddresses] = useState<any[]>([]);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: "", address: "", recipient: "", phone: "" });
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

    // Cancellation States
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [otherReason, setOtherReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    // HPO State (all account types can upload)
    const [hpoFile, setHpoFile] = useState<File | null>(null);

    const CANCEL_REASONS = [
        "Ingin mengubah rincian pesanan (produk, jumlah, dll)",
        "Menemukan harga yang lebih murah di tempat lain",
        "Berubah pikiran / Tidak jadi beli",
        "Lainnya"
    ];

    const fmtPrice = (p: number) => new Intl.NumberFormat("id-ID").format(Math.round(p));

    const loadAddresses = useCallback(async () => {
        const result = await getUserAddresses();
        if (result.success && result.addresses) {
            setAddresses(result.addresses);
        }
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const result = await getQuotationDetail(id);
        if (result.success && result.quotation) {
            setQuotation(result.quotation);
            if (result.quotation.userPoPath) setPoPath(result.quotation.userPoPath);
            setSpecialDiscountRequest(result.quotation.specialDiscountRequest);
            if (result.quotation.specialDiscountNote) setSpecialDiscountNote(result.quotation.specialDiscountNote);

            // Set initial view stage based on current status
            const currentStage = STATUS_CONFIG[result.quotation.status]?.stage || 1;
            setViewStage(currentStage);

            // Load addresses if in draft or pending
            if (result.quotation.status === "DRAFT" || result.quotation.status === "PENDING") {
                loadAddresses();
            }
        }
        setIsLoading(false);
    }, [id, loadAddresses]);

    // ── Redirect to pretty slug after data loads ──
    useEffect(() => {
        if (!quotation) return;
        const no = quotation.quotationNo || "";
        const toSlug = (s: string) => s.replace(/\//g, "-");
        // fmt: strip any existing prefix (SQ/, HSQ/, RFQ/, etc.) then add new prefix
        const baseNo = no.replace(/^[A-Z]+\//, ""); // e.g. "SQ/26/03/1" → "26/03/1"
        const fmt = (p: string) => toSlug(`${p}/${baseNo}`);

        let slug: string;
        if (["PENDING", "DRAFT"].includes(quotation.status)) slug = fmt("SQ");
        else if (quotation.status === "OFFERED") slug = toSlug(quotation.accurateHsqNo || fmt("HSQ").replace(/\//g, "-"));
        else if (quotation.status === "CONFIRMED") slug = toSlug(quotation.accurateHsoNo || fmt("HSO").replace(/\//g, "-"));
        else if (quotation.status === "SHIPPED") slug = toSlug(quotation.accurateDoNo || fmt("HDO").replace(/\//g, "-"));
        else if (quotation.status === "COMPLETED") slug = fmt("INV");
        else slug = fmt("SQ");

        if (decodeURIComponent(id) !== slug) {
            router.replace(`/dashboard/transaksi/${encodeURIComponent(slug)}`);
        }
    }, [quotation]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setters: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await uploadFile(formData);
            if (result.success && result.url) {
                setters(result.url);
                toast.success("Upload berhasil");
            } else {
                toast.error("Upload gagal");
            }
        } catch (err) {
            console.error(err);
            toast.error("Upload error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSelectAddress = async (addrId: string) => {
        const addr = addresses.find(a => a.id === addrId);
        if (!addr) return;

        setIsUpdatingAddress(true);
        const fullAddrStr = `${addr.label ? `[${addr.label}] ` : ""}${addr.address}${addr.recipient ? ` - UP: ${addr.recipient}` : ""}${addr.phone ? ` (${addr.phone})` : ""}`;
        const res = await updateQuotationAddress(id, fullAddrStr, addr.id);
        if (res.success) {
            toast.success("Alamat pengiriman diperbarui");
            await loadData();
        } else {
            toast.error(res.error || "Gagal memperbarui alamat");
        }
        setIsUpdatingAddress(false);
    };

    const handleAddAddress = async () => {
        if (!newAddress.address) {
            toast.error("Alamat wajib diisi");
            return;
        }

        const fd = new FormData();
        fd.append("address", newAddress.address);
        fd.append("label", newAddress.label);
        fd.append("recipient", newAddress.recipient);
        fd.append("phone", newAddress.phone);

        const res = await addUserAddress(fd);
        if (res.success && 'address' in res && res.address) {
            toast.success("Alamat baru ditambahkan");
            await loadAddresses();
            // Automatically select the new address
            await handleSelectAddress(res.address.id);
            setIsAddressModalOpen(false);
            setNewAddress({ label: "", address: "", recipient: "", phone: "" });
        } else {
            toast.error(res.error || "Gagal menambah alamat");
        }
        setIsAddingAddress(false);
    };

    const handleSubmitPO = async () => {
        setIsSubmitting(true);
        let finalPoPath = quotation.userPoPath || "";

        // If a new file is selected, upload it first
        if (hpoFile) {
            try {
                const formData = new FormData();
                formData.append("file", hpoFile);
                const uploadResult = await uploadFile(formData);
                if (uploadResult.success && uploadResult.url) {
                    finalPoPath = uploadResult.url;
                } else {
                    toast.error("Gagal mengupload file PO. Melanjutkan dengan PO lama/tanpa PO.");
                }
            } catch (err) {
                console.error("Upload error:", err);
                toast.error("Terjadi masalah saat mengunggah PO.");
            }
        }

        const result = await userSubmitPO(id, finalPoPath, specialDiscountRequest, specialDiscountNote);
        if (result.success) {
            toast.success("Konfirmasi pesanan terkirim");
            setHpoFile(null);
            await loadData();
        } else {
            toast.error(result.error || "Gagal mengirim konfirmasi");
        }
        setIsSubmitting(false);
    };

    const handleAcceptProformaAction = async () => {
        setIsSubmitting(true);
        const result = await acceptProforma(id);
        if (result.success) {
            toast.success("Pesanan disetujui. Lanjut ke pembayaran!");
            await loadData();
        } else {
            toast.error(result.error || "Gagal menyetujui pesanan.");
        }
        setIsSubmitting(false);
    };

    const handleConfirmReceipt = async () => {
        if (!isReceiptChecked) {
            toast.error("Mohon centang konfirmasi penerimaan.");
            return;
        }

        setIsSubmitting(true);
        // We pass the stringified array of images, or empty string if none
        const evidenceData = receiptEvidences.length > 0 ? JSON.stringify(receiptEvidences) : "";
        await userConfirmReceipt(id, evidenceData);
        await loadData();
        toast.success("Penerimaan barang dikonfirmasi");
        setIsSubmitting(false);
    };

    const handleRequestReturn = async () => {
        if (!returnReason || !returnEvidence) {
            toast.error("Mohon isi alasan dan upload bukti foto/video.");
            return;
        }
        setIsSubmitting(true);
        await userRequestReturn(id, returnReason, returnEvidence);
        await loadData();
        toast.success("Pengajuan retur terkirim");
        setIsReturning(false);
        setIsSubmitting(false);
    };

    const executeSelectAlternative = async (itemId: string, altId: string) => {
        setIsSubmitting(true);
        const result = await userSelectAlternative(id, itemId, altId);
        if (result.success) {
            toast.success("Produk berhasil diganti!");
            await loadData();
        } else {
            toast.error(result.error || "Gagal mengganti produk");
        }
        setIsSubmitting(false);
    };

    const executeUndoAlternative = async (itemId: string) => {
        setIsSubmitting(true);
        const result = await userUndoAlternative(id, itemId);
        if (result.success) {
            toast.success("Produk dikembalikan ke pilihan awal!");
            await loadData();
        } else {
            toast.error(result.error || "Gagal mengembalikan produk");
        }
        setIsSubmitting(false);
    };

    const handleViewStageChange = (targetStage: number) => {
        setViewStage(targetStage);
    };



    const handleCancel = async () => {
        const finalReason = cancelReason === "Lainnya" ? otherReason : cancelReason;
        if (!finalReason) {
            toast.error("Silakan pilih atau masukkan alasan pembatalan");
            return;
        }

        setIsCancelling(true);
        const result = await cancelQuotation(id, finalReason);
        if (result.success) {
            toast.success("Anda membatalkan pesanan ini. Proses pembatalan berhasil.");
            setIsCancelOpen(false);
            setCancelReason("");
            setOtherReason("");
            loadData();
        } else {
            toast.error(result.error || "Gagal membatalkan penawaran");
        }
        setIsCancelling(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-sm text-gray-400">Memuat detail transaksi...</p>
            </div>
        );
    }

    if (!quotation) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
                <AlertCircle className="w-10 h-10 text-gray-300" />
                <p className="text-gray-500">Data tidak ditemukan</p>
                <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/transaksi")}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
                </Button>
            </div>
        );
    }

    const custType = (quotation?.customerType || quotation?.customer?.type || "").toUpperCase();
    const isCorporate = ["CORPORATE", "BISNIS", "B2B", "COMPANY"].includes(custType);
    const isRetail = ["RITEL", "RETAIL", "PERSONAL"].includes(custType);
    const isGeneralCustomer = !isCorporate && !isRetail;
    const items = quotation.items || [];
    const hasDiscount = quotation.specialDiscount && quotation.specialDiscount > 0;
    const discountAmount = hasDiscount ? quotation.totalAmount * (quotation.specialDiscount / 100) : 0;
    const finalTotal = quotation.totalAmount - discountAmount;

    const displayNo = (() => {
        const no = quotation.quotationNo || "";
        // Strip any existing SQ/ HSQ/ RFQ/ etc. prefix, then rebuild
        const baseNo = no.replace(/^[A-Z]+\//, ""); // "SQ/26/03/1" → "26/03/1"
        const fmt = (p: string) => `${p}/${baseNo}`;
        if (quotation.status === "PENDING" || quotation.status === "DRAFT") return fmt("SQ");
        if (quotation.status === "OFFERED") return quotation.accurateHsqNo || fmt("HSQ");
        if (quotation.status === "CONFIRMED") return quotation.accurateHsoNo || fmt("HSO");
        if (quotation.status === "SHIPPED") return quotation.accurateDoNo || fmt("HDO");
        if (quotation.status === "COMPLETED") return fmt("INV");
        return fmt("SQ");
    })();

    let status = STATUS_CONFIG[quotation.status] || STATUS_CONFIG.PENDING;
    // Override labels to reflect document naming
    if (quotation.status === "OFFERED") status = { ...status, label: "Penawaran (HSQ)" };
    if (quotation.status === "CONFIRMED") status = { ...status, label: isRetail ? "Diproses" : "Pesanan (HSO)" };
    if (quotation.status === "PROCESSING") status = { ...status, label: "Pembayaran" };

    const currentStage = status.stage;

    // Filter steps for Retail/General - remove Verification stage + rename
    const filteredSteps = isGeneralCustomer
        ? STEPS.filter(s => s.s !== 3).map(step => {
            if (step.s === 4) return { ...step, l: "Pembayaran" };
            return step;
        })
        : STEPS.filter(s => s.s !== 4 && s.s !== 3).map(step => {
            // For Corporate/Retail: 1(Penawaran), 2(Penawaran Resmi), 3(Pesanan), 5(Pengiriman), 6(Selesai)
            // Wait, the user wants: Penawaran -> Penawaran Resmi -> Pesanan -> Pengiriman -> Selesai
            // So we take 1, 2, 3(renamed to Pesanan), 5, 6
            return { ...step };
        }).concat([
            { s: 3, l: "Pesanan", icon: ShieldCheck }
        ]).sort((a, b) => a.s - b.s).filter(s => s.s !== 4);

    // Let's refine the logic to be exactly as requested:
    const finalSteps = isGeneralCustomer
        ? [
            { s: 1, l: "Penawaran", icon: FileText },
            { s: 2, l: "Penawaran Resmi", icon: Send },
            { s: 4, l: "Pembayaran", icon: CreditCard },
            { s: 5, l: "Pengiriman", icon: Truck },
            { s: 6, l: "Selesai", icon: CheckCircle2 }
        ]
        : [
            { s: 1, l: "Penawaran", icon: FileText },
            { s: 2, l: "Penawaran Resmi", icon: Send },
            { s: 3, l: "Pesanan", icon: PackageCheck },
            { s: 5, l: "Pengiriman", icon: Truck },
            { s: 6, l: "Selesai", icon: CheckCircle2 }
        ];

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4 md:px-0 mt-4">
            {/* ─── Hero Header ─── */}
            <div className="relative rounded-xl bg-white border border-gray-200 p-5 md:p-6 mb-6 overflow-hidden shadow-sm">
                <div className="relative z-10">
                    <button
                        onClick={() => router.push("/dashboard/transaksi")}
                        className="inline-flex items-center gap-1.5 text-gray-500 hover:text-red-600 text-sm transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Kembali ke Transaksi
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{displayNo}</h1>
                                <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${status.bg} ${status.color}`}>
                                    {status.label}
                                </span>
                                {['PENDING', 'DRAFT', 'OFFERED', 'PROCESSING', 'CONFIRMED'].includes(quotation.status) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCancelOpen(true)}
                                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-3"
                                    >
                                        Batalkan SQ
                                    </Button>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm">
                                {format(new Date(quotation.createdAt), "dd MMM yyyy, HH:mm")}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-gray-500 text-xs uppercase tracking-wider font-medium">Total</p>
                            <p className="text-2xl md:text-3xl font-bold text-red-600">
                                Rp {fmtPrice(finalTotal)}
                            </p>
                            {hasDiscount && (
                                <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                                    Diskon {quotation.specialDiscount}% applied
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Progress Stepper ─── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 overflow-x-auto">
                <div className="flex items-center min-w-[480px]">
                    {finalSteps.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isCurrentStatusStage = currentStage === step.s;
                        const isCompletedStatusStage = currentStage > step.s;
                        const isBeingViewed = viewStage === step.s;
                        const isPast = isCompletedStatusStage;

                        return (
                            <div key={idx} className="flex items-center flex-1 last:flex-none">
                                <div
                                    className={`flex flex-col items-center gap-1.5 relative z-10 transition-all duration-300 ${isPast ? "cursor-pointer hover:scale-105 active:scale-95 group" : ""}`}
                                    onClick={() => isPast && handleViewStageChange(step.s)}
                                    title={isPast ? `Klik untuk melihat tahap ${step.l}` : undefined}
                                >
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isCompletedStatusStage
                                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                            : isCurrentStatusStage
                                                ? "bg-red-600 text-white shadow-md shadow-red-200 ring-4 ring-red-100"
                                                : "bg-gray-100 text-gray-400"
                                            } ${isBeingViewed ? "ring-2 ring-blue-400 ring-offset-2 scale-110" : ""} ${isPast ? "group-hover:bg-emerald-600" : ""}`}
                                    >
                                        {isCompletedStatusStage ? (
                                            <CheckCircle2 className="w-4.5 h-4.5" />
                                        ) : (
                                            <StepIcon className="w-4 h-4" />
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-semibold whitespace-nowrap transition-colors ${isBeingViewed ? "text-blue-600" : isCurrentStatusStage ? "text-red-600" : isCompletedStatusStage ? "text-emerald-600" : "text-gray-400"
                                        } ${isPast ? "group-hover:text-emerald-700" : ""}`}>
                                        {step.l}
                                    </span>
                                </div>
                                {idx < finalSteps.length - 1 && (
                                    <div className={`h-[2px] flex-1 mx-3 -mt-5 rounded-full transition-colors ${currentStage > step.s ? "bg-emerald-400" : "bg-gray-100"
                                        }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── OFFERED: Penawaran Resmi Banner ─── */}
            {quotation.status === "OFFERED" && (
                <div className="bg-white border border-red-200 rounded-xl p-3 mb-6 shadow-md shadow-red-100/30">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4.5 h-4.5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-black font-bold text-sm">
                                    <span className="text-red-700">🎉 Penawaran Resmi</span> Telah Dikirim!
                                </p>
                                {displayNo && (
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-gray-800 border border-gray-200">
                                        {displayNo}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-900 text-[11px] mt-0.5 leading-tight opacity-80">
                                Tinjau rincian &amp; dokumen di bawah, lalu klik <strong className="text-red-600">Setuju &amp; Konfirmasi</strong> untuk memesan.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Status Description Box (for other statuses) ─── */}
            {quotation.status !== "OFFERED" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Info className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-blue-900 mb-1">
                                {STATUS_CONFIG[quotation.status]?.label}
                            </p>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                {STATUS_DESCRIPTIONS[quotation.status] || "Proses pesanan sedang berjalan."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Main Content Grid ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">

                    {/* ─── Product List ─── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                                    <Package className="w-3.5 h-3.5 text-red-600" />
                                </div>
                                <h2 className="font-semibold text-gray-900 text-sm">Daftar Produk</h2>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{items.length} item</span>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {items.map((item: any, idx: number) => (
                                <div key={item.id} className="px-5 py-3.5 hover:bg-gray-50/40 transition-colors">
                                    {/* Main Product Row */}
                                    <div className="flex gap-3 items-start">
                                        <div className="w-11 h-11 bg-gray-50 rounded-lg border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                            {item.image ? (
                                                <img src={item.image} alt={item.productName} className="w-full h-full object-contain p-0.5" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-gray-300" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Original product - strikethrough with undo */}
                                            {item.originalData && (
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <RefreshCw className="w-3 h-3 text-red-400 shrink-0" />
                                                    <p className="text-[11px] text-gray-400 line-through decoration-red-300 truncate">
                                                        {(item.originalData as any).productName}
                                                    </p>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button
                                                                disabled={isSubmitting}
                                                                className="text-[10px] text-blue-600 hover:text-blue-800 font-medium shrink-0 underline underline-offset-2 hover:no-underline transition-colors disabled:opacity-50"
                                                            >
                                                                Undo
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Kembalikan Produk Awal?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Produk akan dikembalikan ke <strong>{(item.originalData as any).productName}</strong> ({(item.originalData as any).productSku}).
                                                                    <br /><br />
                                                                    Harga total akan disesuaikan otomatis.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => executeUndoAlternative(item.id)}
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                >
                                                                    Ya, Kembalikan
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            )}
                                            <p className="font-medium text-gray-900 text-[13px] leading-snug truncate">{item.productName}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-[11px] text-gray-400 font-mono">{item.productSku}</span>
                                                {item.stockStatus === "INDENT" && (
                                                    <span className="text-[9px] text-orange-700 bg-orange-50 border border-orange-200/70 px-1.5 py-px rounded-full font-semibold leading-none">Indent</span>
                                                )}
                                                {item.isAvailable === true && !item.stockStatus && (
                                                    <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-px rounded-full font-semibold leading-none">✓ Ready</span>
                                                )}
                                                {item.isAvailable === false && !item.stockStatus && (
                                                    <span className="text-[9px] text-red-600 bg-red-50 border border-red-200/70 px-1.5 py-px rounded-full font-semibold leading-none">Stok Habis</span>
                                                )}
                                            </div>
                                            {item.adminNote && (
                                                <div className="mt-1.5 flex items-start gap-1.5">
                                                    <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] text-blue-600 italic leading-snug">{item.adminNote}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right shrink-0 pl-2">
                                            {item.basePrice && item.basePrice > item.price && (
                                                <div className="text-[10px] text-gray-400 line-through">Rp {fmtPrice(item.basePrice)}</div>
                                            )}
                                            <div className="text-sm font-bold text-gray-900">Rp {fmtPrice(item.quantity * item.price)}</div>
                                            {item.quantity > 1 && (
                                                <div className="text-[10px] text-gray-400 mt-0.5">{item.quantity} × Rp {fmtPrice(item.price)}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Alternative Suggestions */}
                                    {item.alternatives?.length > 0 && (
                                        <div className="ml-14 mt-2 space-y-1.5">
                                            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Produk Pengganti
                                            </p>
                                            {item.alternatives.map((alt: any) => (
                                                <div key={alt.id} className="flex items-center gap-2 bg-gradient-to-r from-amber-50/80 to-orange-50/50 border border-amber-200/50 rounded-lg px-2.5 py-2 group hover:border-amber-300 transition-colors">
                                                    <div className="w-8 h-8 bg-white rounded-md border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                                                        {alt.image ? (
                                                            <img src={alt.image} alt={alt.productName} className="w-full h-full object-contain p-0.5" />
                                                        ) : (
                                                            <ImageIcon className="w-3 h-3 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-800 truncate">{alt.productName}</p>
                                                        <p className="text-[10px] text-amber-600/80 font-mono">{alt.productSku}</p>
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-700 shrink-0">Rp {fmtPrice(alt.price)}</div>
                                                    <Button
                                                        size="sm"
                                                        disabled={isSubmitting}
                                                        onClick={() => executeSelectAlternative(item.id, alt.id)}
                                                        className="h-7 text-[11px] px-3 bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm shrink-0 rounded-md font-medium"
                                                    >
                                                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                                                            <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Ganti</span>
                                                        )}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Total Footer */}
                        <div className="px-5 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-end gap-6">
                                {hasDiscount && (
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Subtotal</p>
                                        <p className="text-sm text-gray-500 line-through">Rp {fmtPrice(quotation.totalAmount)}</p>
                                    </div>
                                )}
                                {hasDiscount && (
                                    <div className="text-right">
                                        <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-medium">Diskon ({quotation.specialDiscount}%)</p>
                                        <p className="text-sm text-emerald-600 font-semibold">-Rp {fmtPrice(discountAmount)}</p>
                                    </div>
                                )}
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Total</p>
                                    <p className="text-xl font-bold text-gray-900">Rp {fmtPrice(finalTotal)}</p>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* ─── Stage 5: Shipping ─── */}
                    {viewStage === 5 && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                                    <Truck className="w-3.5 h-3.5 text-sky-600" />
                                </div>
                                <h2 className="font-semibold text-gray-900 text-sm">Status Pengiriman</h2>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {quotation.trackingNumber && (
                                        <div className="bg-sky-50/50 rounded-lg p-3 border border-sky-100">
                                            <p className="text-[10px] text-sky-600 uppercase tracking-wider font-semibold mb-1">No. Resi</p>
                                            <p className="font-mono font-bold text-lg text-sky-900">{quotation.trackingNumber}</p>
                                        </div>
                                    )}
                                    {quotation.shippingProofPath && (
                                        <div className="bg-sky-50/50 rounded-lg p-3 border border-sky-100">
                                            <p className="text-[10px] text-sky-600 uppercase tracking-wider font-semibold mb-1">Bukti Pengiriman</p>
                                            <a href={quotation.shippingProofPath} target="_blank" className="text-sm text-sky-600 hover:text-sky-800 underline font-medium inline-flex items-center gap-1">
                                                Lihat Foto <ArrowUpRight className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-gray-100 pt-5 space-y-6">
                                    <div className="flex items-start gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 group cursor-pointer transition-colors hover:bg-emerald-50"
                                        onClick={() => setIsReceiptChecked(!isReceiptChecked)}>
                                        <Checkbox
                                            id="confirm-receipt"
                                            checked={isReceiptChecked}
                                            onCheckedChange={(checked) => setIsReceiptChecked(checked === true)}
                                            className="mt-0.5 border-emerald-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="confirm-receipt" className="text-sm font-bold text-emerald-900 cursor-pointer">Centang Pesanan Diterima</Label>
                                            <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">Saya telah menerima barang pesanan dalam keadaan baik dan sesuai.</p>
                                        </div>
                                    </div>

                                    {isReceiptChecked && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Upload Foto Bukti (Opsional)</Label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {receiptEvidences.map((url, idx) => (
                                                    <div key={idx} className="relative group aspect-square rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-gray-50">
                                                        <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                        <button
                                                            onClick={() => setReceiptEvidences(prev => prev.filter((_, i) => i !== idx))}
                                                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {receiptEvidences.length < 5 && (
                                                    <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-emerald-300 cursor-pointer transition-all group">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                            disabled={isUploading}
                                                            onChange={async (e) => {
                                                                const files = e.target.files;
                                                                if (!files) return;
                                                                setIsUploading(true);
                                                                for (let i = 0; i < files.length; i++) {
                                                                    const formData = new FormData();
                                                                    formData.append("file", files[i]);
                                                                    try {
                                                                        const res = await uploadFile(formData);
                                                                        if (res.success && res.url) {
                                                                            setReceiptEvidences(prev => [...prev, res.url]);
                                                                        }
                                                                    } catch (err) { console.error(err); }
                                                                }
                                                                setIsUploading(false);
                                                            }}
                                                        />
                                                        {isUploading ? (
                                                            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                                                        ) : (
                                                            <>
                                                                <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors mb-1" />
                                                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-emerald-600 uppercase">Upload</span>
                                                            </>
                                                        )}
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {currentStage === 5 && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    className={`w-full shadow-sm font-bold h-12 transition-all ${isReceiptChecked ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    disabled={isSubmitting || !isReceiptChecked}
                                                >
                                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4.5 h-4.5 mr-2" />}
                                                    Konfirmasi Terima Barang
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="flex items-center gap-2 text-emerald-700">
                                                        <PackageCheck className="w-5 h-5" />
                                                        Konfirmasi Penerimaan
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Pastikan barang sudah diterima dengan baik dan sesuai pesanan. Konfirmasi penerimaan sekarang?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleConfirmReceipt}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                                                    >
                                                        Konfirmasi
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Stage 6: Completed / Return ─── */}
                    {(viewStage === 6 || quotation.returnRequest) && (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/60 p-5 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-emerald-900 text-sm">Pesanan Selesai!</p>
                                    <p className="text-xs text-emerald-700 mt-0.5">Terima kasih! Pesanan telah berhasil diselesaikan.</p>
                                    {quotation.receiptEvidencePath && (
                                        <div className="mt-4">
                                            <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                                                <ImageIcon className="w-3 h-3" /> Bukti Penerimaan
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    try {
                                                        const p = JSON.parse(quotation.receiptEvidencePath);
                                                        if (Array.isArray(p)) {
                                                            return p.map((url, i) => (
                                                                <img key={i} src={url} className="w-20 h-20 object-cover rounded-lg border border-emerald-200 shadow-sm" />
                                                            ));
                                                        }
                                                    } catch (e) { }
                                                    return <img src={quotation.receiptEvidencePath} className="w-20 h-20 object-cover rounded-lg border border-emerald-200 shadow-sm" />;
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!quotation.returnRequest && !isReturning && (
                                <div className="flex justify-end">
                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 text-xs gap-1.5" onClick={() => setIsReturning(true)}>
                                        <AlertTriangle className="w-3.5 h-3.5" /> Ajukan Retur
                                    </Button>
                                </div>
                            )}

                            {(isReturning || quotation.returnRequest) && (
                                <div className="bg-white rounded-xl border-l-[3px] border-l-red-500 border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3.5 border-b border-gray-100">
                                        <h3 className="font-semibold text-red-700 text-sm">Pengajuan Retur</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {quotation.returnRequest ? (
                                            <div className="space-y-3">
                                                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-amber-600" />
                                                    <span className="text-sm font-medium text-amber-800">Menunggu Review Admin</span>
                                                </div>
                                                <p className="text-sm text-gray-700"><strong>Alasan:</strong> {quotation.returnReason}</p>
                                                {quotation.returnEvidencePath && <img src={quotation.returnEvidencePath} className="w-28 rounded-lg border" />}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Alasan Pengembalian</Label>
                                                    <Textarea
                                                        placeholder="Jelaskan kenapa Anda ingin mengembalikan barang..."
                                                        value={returnReason}
                                                        onChange={e => setReturnReason(e.target.value)}
                                                        className="text-sm h-20 resize-none"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Bukti Foto/Video</Label>
                                                    <Input type="file" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, setReturnEvidence)} disabled={isUploading} className="text-sm" />
                                                    {isUploading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                                                </div>
                                                <div className="flex gap-2 justify-end pt-1">
                                                    <Button variant="ghost" size="sm" onClick={() => setIsReturning(false)} className="text-xs">Batal</Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-600 text-white text-xs"
                                                        onClick={handleRequestReturn}
                                                        disabled={isSubmitting || !returnReason || !returnEvidence}
                                                    >
                                                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                                                        Kirim Pengajuan
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Shipping Address - MOVED TO BOTTOM */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-5">
                        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Truck className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-sm text-blue-900">Alamat Pengiriman</h3>
                            </div>
                            {(quotation.status === "DRAFT" || quotation.status === "PENDING") && (
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50" onClick={() => setIsAddressModalOpen(true)}>
                                    Ganti
                                </Button>
                            )}
                        </div>
                        <div className="p-4">
                            {quotation.shippingAddress ? (
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-700 leading-relaxed font-medium">{quotation.shippingAddress}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-4 text-center">
                                    <AlertCircle className="w-8 h-8 text-amber-500 mb-2 opacity-40" />
                                    <p className="text-xs text-gray-500 font-medium">Alamat belum dipilih</p>
                                    {(quotation.status === "DRAFT" || quotation.status === "PENDING") && (
                                        <Button size="sm" variant="outline" className="mt-3 text-[11px] h-8 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600" onClick={() => setIsAddressModalOpen(true)}>
                                            Pilih Alamat
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Sidebar ─── */}
                <div className="space-y-5">



                    {/* Stage 2: HSQ Issued — show document + HPO upload for ALL */}
                    {viewStage === 2 && (
                        <div className="space-y-4">
                            {/* HSQ Document Card */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className={`px-5 py-3.5 border-b border-gray-100 ${currentStage > 2
                                    ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50"
                                    : "bg-gradient-to-r from-red-50 to-red-100/50"
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${currentStage > 2 ? "bg-emerald-100" : "bg-red-100"
                                            }`}>
                                            <FileText className={`w-3 h-3 ${currentStage > 2 ? "text-emerald-600" : "text-red-600"}`} />
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm ${currentStage > 2 ? "text-emerald-900" : "text-red-900"}`}>
                                                {currentStage > 2 ? "Penawaran Disetujui" : "Dokumen Penawaran (HSQ)"}
                                            </h3>
                                            <p className={`text-[10px] mt-0.5 ${currentStage > 2 ? "text-emerald-600" : "text-red-500"}`}>
                                                {currentStage > 2
                                                    ? "Penawaran telah dikonfirmasi & dilanjutkan ke pesanan"
                                                    : "Tinjau dokumen penawaran resmi dari Hokiindo"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {/* PO / Konfirmasi action — only when currently at stage 2 — MOVED TO TOP */}
                                    {currentStage === 2 && (
                                        <div className="space-y-3 pb-3 mb-3 border-b border-gray-100">
                                            {isGeneralCustomer ? (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-red-700">
                                                        Silakan tinjau kembali daftar produk dan detail penawaran. Jika sesuai, silakan setujui untuk melanjutkan ke tahap pesanan.
                                                    </p>
                                                    <Button
                                                        className="w-full h-10 bg-red-600 hover:bg-red-700 text-white shadow-sm text-xs font-semibold"
                                                        onClick={handleSubmitPO}
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                                        Lanjutkan Pemesanan & Pembayaran
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {/* Upload HPO (for corporate & retail) */}
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-gray-700">Upload Purchase Order (PO) Perusahaan</Label>
                                                        <div className="relative">
                                                            <label className={`flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg px-3 py-2.5 transition-colors ${hpoFile ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-red-300 hover:bg-red-50/30"
                                                                }`}>
                                                                <input
                                                                    type="file"
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                    className="hidden"
                                                                    disabled={currentStage > 2}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) setHpoFile(file);
                                                                    }}
                                                                />
                                                                <FileUp className="w-4 h-4 text-red-400 flex-shrink-0" />
                                                                <span className="text-xs text-gray-600 flex-1 min-w-0 truncate">
                                                                    {hpoFile ? hpoFile.name : (quotation.userPoPath ? "Ganti dokumen PO" : "Pilih PDF/Gambar (opsional)")}
                                                                </span>
                                                            </label>
                                                        </div>
                                                        {quotation.userPoPath && !hpoFile && (
                                                            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-md border border-emerald-100">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                <span>PO sudah diunggah —</span>
                                                                <a href={quotation.userPoPath} target="_blank" rel="noreferrer" className="underline font-semibold hover:text-emerald-800">Lihat</a>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Special Discount Request */}
                                                    <div className="space-y-3 pt-1">
                                                        <div className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                                            <Checkbox
                                                                id="special-discount"
                                                                checked={specialDiscountRequest}
                                                                onCheckedChange={(checked) => setSpecialDiscountRequest(!!checked)}
                                                            />
                                                            <label
                                                                htmlFor="special-discount"
                                                                className="text-xs font-semibold text-gray-700 cursor-pointer flex items-center gap-1.5"
                                                            >
                                                                <Tag className="w-3.5 h-3.5 text-red-500" />
                                                                Ajukan Diskon Tambahan
                                                            </label>
                                                        </div>

                                                        {specialDiscountRequest && (
                                                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                <Label className="text-[10px] font-bold text-gray-500 uppercase">Keterangan / Alasan Diskon</Label>
                                                                <Textarea
                                                                    placeholder="Tuliskan alasan atau catatan tambahan untuk tim sales..."
                                                                    value={specialDiscountNote}
                                                                    onChange={(e) => setSpecialDiscountNote(e.target.value)}
                                                                    className="text-xs min-h-[60px] resize-none bg-white border-gray-200 focus:border-red-400 focus:ring-red-400"
                                                                />
                                                                <p className="text-[10px] text-gray-400 leading-tight italic">
                                                                    *Permintaan diskon akan ditinjau oleh tim sales kami.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Submit Button */}
                                            <div className="flex gap-2 pt-1">
                                                {/* Confirm & proceed */}
                                                <Button
                                                    className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white shadow-sm text-xs font-semibold"
                                                    onClick={handleSubmitPO}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                                                    Setuju & Konfirmasi
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* HSQ Number badge */}
                                    {quotation.accurateHsqNo && (
                                        <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Nomor HSQ</span>
                                            <span className="font-mono font-bold text-red-900 text-sm">{quotation.accurateHsqNo}</span>
                                        </div>
                                    )}

                                    {/* HSQ PDF download */}
                                    {quotation.adminQuotePdfPath ? (
                                        <a
                                            href={quotation.adminQuotePdfPath}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors group"
                                        >
                                            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-red-900">Dokumen Penawaran Resmi</p>
                                                <p className="text-[10px] text-red-500 truncate">{quotation.adminQuotePdfPath.split("/").pop()}</p>
                                            </div>
                                            <ArrowUpRight className="w-4 h-4 text-red-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </a>
                                    ) : (
                                        <div className="text-center py-4 text-xs text-gray-400">
                                            Dokumen HSQ sedang disiapkan oleh tim sales
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage 3: Verification Waiting */}
                    {viewStage === 3 && !isGeneralCustomer && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                                <h3 className="font-semibold text-indigo-900 text-sm">Verifikasi Pesanan</h3>
                                <p className="text-[11px] text-indigo-600 mt-0.5">Tim admin sedang meninjau PO Anda</p>
                            </div>
                            <div className="p-6 flex flex-col items-center text-center space-y-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-gray-900">Pesanan Sedang Diproses</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Admin kami sedang melakukan verifikasi dan penyesuaian stok berdasarkan PO yang Anda kirimkan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage 4: Processing - Invoice & Payment (Also Stage 3 for General Customers) */}
                    {(viewStage === 4 || (viewStage === 3 && isGeneralCustomer)) && (
                        <div className="space-y-4">

                            {/* Dokumen HSO khusus B2B */}
                            {isCorporate && quotation.adminSoPdfPath && (
                                <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                        <h3 className="font-semibold text-indigo-900 text-sm">Dokumen Sales Order (HSO)</h3>
                                    </div>
                                    <p className="text-xs text-indigo-700 mb-2">Silakan tinjau kembali Sales Order resmi kami berikut referensi TOP-nya.</p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {quotation.termOfPayment && (
                                            <div className="bg-white/60 px-3 py-1.5 rounded border border-indigo-100/50">
                                                <span className="text-[10px] text-indigo-500 font-bold block">TOP</span>
                                                <span className="text-sm font-semibold text-indigo-900">{quotation.termOfPayment}</span>
                                            </div>
                                        )}
                                        <div className="flex-1"></div>
                                        <a href={quotation.adminSoPdfPath} target="_blank" rel="noreferrer"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-lg inline-flex items-center justify-center gap-2 transition-colors">
                                            <Download className="w-3.5 h-3.5" /> Unduh Dokumen HSO
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Invoice / Faktur Tagihan */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Invoice Header */}
                                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-base">FAKTUR TAGIHAN</h3>
                                            <p className="text-slate-300 text-xs mt-0.5">PT Hokiindo Raya</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-300">No. SO</p>
                                            <p className="font-mono font-semibold text-sm">{quotation.accurateHsoNo || quotation.quotationNo}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Item List */}
                                <div className="px-5 py-4">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-gray-500 border-b">
                                                <th className="text-left py-2 font-medium">Produk</th>
                                                <th className="text-center py-2 font-medium w-12">Qty</th>
                                                <th className="text-right py-2 font-medium">Harga</th>
                                                <th className="text-right py-2 font-medium">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item: any) => (
                                                <tr key={item.id} className="border-b border-dashed border-gray-100">
                                                    <td className="py-2.5">
                                                        <p className="font-medium text-gray-900 text-xs">{item.productName || item.product?.name}</p>
                                                        <p className="text-[10px] text-gray-400">{item.sku || item.product?.sku}</p>
                                                    </td>
                                                    <td className="text-center text-gray-600">{item.quantity}</td>
                                                    <td className="text-right text-gray-600">Rp {(item.price || 0).toLocaleString('id-ID')}</td>
                                                    <td className="text-right font-medium text-gray-900">Rp {((item.price || 0) * item.quantity).toLocaleString('id-ID')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals */}
                                <div className="px-5 pb-4 space-y-1.5">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Subtotal</span>
                                        <span>Rp {quotation.totalAmount?.toLocaleString('id-ID')}</span>
                                    </div>
                                    {hasDiscount && (
                                        <div className="flex justify-between text-xs text-emerald-600">
                                            <span>Diskon {quotation.specialDiscount}%</span>
                                            <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                                        <span>Total Tagihan</span>
                                        <span>Rp {finalTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                {/* Bank Account */}
                                <div className="mx-5 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">Transfer ke:</p>
                                    <p className="text-xs text-blue-800">PT HOKIINDO RAYA</p>
                                    <p className="text-xs text-blue-800">Bank BCA</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-sm font-mono font-bold text-blue-900">5520715667</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText('5520715667');
                                                toast.success('Nomor rekening berhasil disalin');
                                            }}
                                            className="text-[10px] text-blue-600 bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                        >
                                            Salin
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                {quotation.adminNotes && (
                                    <div className="mx-5 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                                        <p className="font-semibold mb-1 flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5" /> Catatan Pesanan
                                        </p>
                                        <p className="whitespace-pre-wrap">{quotation.adminNotes}</p>
                                    </div>
                                )}

                                {(currentStage === 4 || (currentStage === 3 && isGeneralCustomer)) && (
                                    <div className="px-5 pb-5">
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-11 font-semibold"
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            disabled={isPaymentUploading}
                                        >
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            {quotation.paymentProofPath ? 'Ganti Bukti Pembayaran' : 'Upload Bukti Pembayaran'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Payment Confirmation Button + Modal */}
                            {quotation.paymentProofPath && (
                                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <h3 className="font-semibold text-emerald-800 text-sm">Bukti Pembayaran Terkirim</h3>
                                    </div>
                                    {quotation.paymentProofPath.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                        <div className="mb-2">
                                            <img src={quotation.paymentProofPath} alt="Bukti Pembayaran" className="w-full max-w-[200px] h-auto rounded-lg border border-emerald-200 shadow-sm" />
                                        </div>
                                    ) : null}
                                    <a href={quotation.paymentProofPath} target="_blank" rel="noreferrer"
                                        className="text-xs text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1 w-fit">
                                        <FileText className="w-3 h-3" /> Lihat file bukti pembayaran
                                    </a>
                                </div>
                            )}

                            <Dialog open={isPaymentModalOpen} onOpenChange={(open) => {
                                setIsPaymentModalOpen(open);
                                if (!open) setPaymentFileOpen(null);
                            }}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Upload Bukti Pembayaran</DialogTitle>
                                        <DialogDescription>
                                            Silakan upload bukti transfer sesuai total tagihan. File yang diterima: gambar, PDF, atau dokumen.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Input
                                            type="file"
                                            accept="image/*,.pdf,.doc,.docx"
                                            className="text-sm cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setPaymentFileOpen(file);
                                            }}
                                        />
                                        {paymentFileOpen && <p className="text-xs text-gray-500 mt-2">File terpilih: {paymentFileOpen.name}</p>}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isPaymentUploading}>Batal</Button>
                                        <Button
                                            onClick={async () => {
                                                if (!paymentFileOpen) {
                                                    toast.error('Pilih file terlebih dahulu');
                                                    return;
                                                }
                                                setIsPaymentUploading(true);
                                                try {
                                                    const formData = new FormData();
                                                    formData.append('file', paymentFileOpen);
                                                    const res = await uploadFile(formData);
                                                    if (res.success && res.url) {
                                                        const result = await userUploadPaymentProof(quotation.id, res.url);
                                                        if (result.success) {
                                                            toast.success('Bukti pembayaran berhasil diupload');
                                                            const newData = await getQuotationDetail(quotation.id);
                                                            if (newData?.quotation) setQuotation(newData.quotation);
                                                            setIsPaymentModalOpen(false);
                                                        } else {
                                                            toast.error(result.error || 'Gagal menyimpan bukti pembayaran');
                                                        }
                                                    } else {
                                                        toast.error('Gagal mengupload file ke server');
                                                    }
                                                } catch (err) {
                                                    toast.error('Terjadi kesalahan saat upload');
                                                } finally {
                                                    setIsPaymentUploading(false);
                                                }
                                            }}
                                            disabled={!paymentFileOpen || isPaymentUploading}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {isPaymentUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Simpan Bukti Pembayaran
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {/* Activity Log */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                                <Clock className="w-3 h-3 text-slate-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm">Aktivitas</h3>
                        </div>
                        <div className="p-4">
                            <div className="relative space-y-0">
                                {/* Timeline line */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100" />

                                {quotation.activities && quotation.activities.length > 0 ? (
                                    quotation.activities.map((log: any, i: number) => {
                                        // Pick icon based on type
                                        let Icon = Clock;
                                        let color = "text-gray-500 bg-gray-100";

                                        if (log.type === "DRAFT_SUBMITTED") {
                                            Icon = FileText;
                                            color = "text-blue-600 bg-blue-50";
                                        } else if (log.type === "OFFER_SENT") {
                                            Icon = Send;
                                            color = "text-purple-600 bg-purple-50";
                                        } else if (log.type === "SQ_UPLOADED" || log.type === "SO_DOC_UPLOADED") {
                                            Icon = FileUp;
                                            color = "text-violet-600 bg-violet-50";
                                        } else if (log.type === "PO_UPLOADED") {
                                            Icon = FileUp;
                                            color = "text-indigo-600 bg-indigo-50";
                                        } else if (log.type === "SO_UPLOADED") {
                                            Icon = PackageCheck;
                                            color = "text-blue-600 bg-blue-50";
                                        } else if (log.type === "INVOICE_UPLOADED") {
                                            Icon = FileText;
                                            color = "text-violet-600 bg-violet-50";
                                        } else if (log.type === "DO_UPLOADED") {
                                            Icon = Truck;
                                            color = "text-orange-600 bg-orange-50";
                                        } else if (log.type === "PAYMENT_UPLOADED") {
                                            Icon = CreditCard;
                                            color = "text-green-600 bg-green-50";
                                        } else if (log.type === "ALT_OFFERED") {
                                            Icon = RefreshCw;
                                            color = "text-amber-600 bg-amber-50";
                                        } else if (log.type === "DISCOUNT_REQUESTED") {
                                            Icon = BadgePercent;
                                            color = "text-yellow-600 bg-yellow-50";
                                        } else if (log.type === "DISCOUNT_APPROVED" || log.type === "DISCOUNT_APPLIED") {
                                            Icon = BadgePercent;
                                            color = "text-emerald-600 bg-emerald-50";
                                        } else if (log.type === "DISCOUNT_REJECTED") {
                                            Icon = BadgePercent;
                                            color = "text-red-500 bg-red-50";
                                        } else if (log.type === "ADMIN_NOTE") {
                                            Icon = MessageSquare;
                                            color = "text-blue-600 bg-blue-50";
                                        } else if (log.type === "COMPLETED") {
                                            Icon = CheckCircle2;
                                            color = "text-emerald-600 bg-emerald-50";
                                        } else if (log.type === "RETURN_REQUESTED") {
                                            Icon = AlertTriangle;
                                            color = "text-red-500 bg-red-50";
                                        }

                                        return (
                                            <div key={i} className="flex gap-3 relative pl-0 py-2">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 relative z-10 ${color} border-2 border-white shadow-sm`}>
                                                    <Icon className="w-2.5 h-2.5" />
                                                </div>
                                                <div className="min-w-0 -mt-0.5">
                                                    <p className="text-[12px] font-bold text-gray-800 leading-snug">{log.title}</p>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5 break-words font-medium">
                                                        {log.description || format(new Date(log.createdAt), "dd MMM, HH:mm")}
                                                    </p>
                                                    {log.description && (
                                                        <p className="text-[10px] text-gray-400 mt-1 font-normal">
                                                            {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                            <Clock className="w-5 h-5 text-gray-300" />
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium">Belum ada aktivitas tercatat</p>
                                    </div>
                                )}
                            </div>

                            {/* Contact Admin CTA */}
                            {currentStage <= 1 && (
                                <a
                                    href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo, saya ingin menanyakan status draft ${displayNo}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 flex items-center gap-2 w-full p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg transition-colors group"
                                >
                                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                        <Send className="w-3 h-3 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-emerald-800">Hubungi Admin</p>
                                        <p className="text-[10px] text-emerald-600">Tanyakan langsung via WhatsApp</p>
                                    </div>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Dokumen Pesanan (Bottom Placement) ─── */}
            {
                (quotation.adminQuotePdfPath || quotation.userPoPath || quotation.adminSoPdfPath || quotation.adminInvoicePdfPath || quotation.adminDoPdfPath || quotation.taxInvoiceUrl) && (
                    <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-6 border-b border-gray-50 flex flex-col items-start gap-4">
                            <FileText className="w-6 h-6 text-slate-600" />
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dokumen Pesanan</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {quotation.adminQuotePdfPath && (
                                <a href={quotation.adminQuotePdfPath} target="_blank" rel="noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-900 leading-none">Penawaran Resmi</p>
                                            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Official Quotation (SQ)</p>
                                        </div>
                                    </div>
                                    <Download className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                                </a>
                            )}
                            {quotation.userPoPath && (
                                <a href={quotation.userPoPath} target="_blank" rel="noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:bg-emerald-50/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                            <Send className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-900 leading-none">Purchase Order</p>
                                            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Pesanan User (PO)</p>
                                        </div>
                                    </div>
                                    <Download className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                                </a>
                            )}
                            {quotation.adminSoPdfPath && (
                                <a href={quotation.adminSoPdfPath} target="_blank" rel="noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                            <Package className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-900 leading-none">Konfirmasi Pesanan</p>
                                            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Sales Order (SO)</p>
                                        </div>
                                    </div>
                                    <Download className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                </a>
                            )}
                            {quotation.adminDoPdfPath && (
                                <a href={quotation.adminDoPdfPath} target="_blank" rel="noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-sky-100 hover:bg-sky-50/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                                            <Truck className="w-5 h-5 text-sky-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-900 leading-none">Surat Jalan</p>
                                            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Delivery Order (DO)</p>
                                        </div>
                                    </div>
                                    <Download className="w-5 h-5 text-slate-300 group-hover:text-sky-600 transition-colors" />
                                </a>
                            )}
                            {quotation.adminInvoicePdfPath && (
                                <a href={quotation.adminInvoicePdfPath} target="_blank" rel="noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-violet-100 hover:bg-violet-50/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-5 h-5 text-violet-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-900 leading-none">Faktur Penjualan</p>
                                            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Invoice / Faktur</p>
                                        </div>
                                    </div>
                                    <Download className="w-5 h-5 text-slate-300 group-hover:text-violet-600 transition-colors" />
                                </a>
                            )}
                            {quotation.taxInvoiceUrl && (
                                <a href={quotation.taxInvoiceUrl} target="_blank" rel="noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:bg-emerald-50/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-900 leading-none">Faktur Pajak</p>
                                            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">e-Faktur Resmi</p>
                                        </div>
                                    </div>
                                    <Download className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                                </a>
                            )}
                        </div>
                    </div>
                )
            }
            {/* ─── Address Selection Modal ─── */}
            <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl [&>button]:text-white">
                    <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-br from-red-600 to-red-700 text-white">
                        <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
                            <Truck className="w-5 h-5 text-red-100" /> Pilih Alamat Pengiriman
                        </DialogTitle>
                        <DialogDescription className="text-red-50 text-xs">
                            Pilih alamat dari daftar yang ada atau tambah alamat baru untuk pengiriman pesanan ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                        {addresses.length > 0 ? (
                            addresses.map((addr) => (
                                <div
                                    key={addr.id}
                                    className={`relative group p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${quotation.shippingAddressId === addr.id ? 'border-red-500 bg-red-50/30' : 'border-gray-100 bg-white hover:border-red-200'}`}
                                    onClick={() => handleSelectAddress(addr.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h4 className="font-bold text-sm text-gray-900 truncate">{addr.label || 'Alamat'}</h4>
                                                {addr.isPrimary && (
                                                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Utama</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-600 leading-relaxed mb-2">{addr.address}</p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                {addr.recipient && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                                        <Tag className="w-2.5 h-2.5 shrink-0" /> {addr.recipient}
                                                    </span>
                                                )}
                                                {addr.phone && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                                        <Info className="w-2.5 h-2.5 shrink-0" /> {addr.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${quotation.shippingAddressId === addr.id ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 bg-gray-50'}`}>
                                            {quotation.shippingAddressId === addr.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                                        </div>
                                    </div>
                                    {isUpdatingAddress && quotation.shippingAddressId === addr.id && (
                                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl animate-in fade-in duration-200">
                                            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                                    <Truck className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-500">Anda belum memiliki daftar alamat.</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 sm:justify-between flex-row gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="text-xs font-bold gap-2 px-5 py-5 border-dashed border-2 border-gray-300 hover:border-red-500 hover:text-red-700 hover:bg-red-50/50 transition-all rounded-xl w-full"
                            onClick={() => {
                                setIsAddingAddress(true);
                            }}
                        >
                            <Tag className="w-3.5 h-3.5" /> Tambah Alamat Baru
                        </Button>
                    </DialogFooter>

                    {/* Simple Embedded Adding Form when isAddingAddress is true */}
                    {isAddingAddress && (
                        <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Tambah Alamat Baru</h3>
                                <button onClick={() => setIsAddingAddress(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-4.5 h-4.5 text-gray-400" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Label Alamat (Contoh: Rumah, Kantor)</Label>
                                    <Input
                                        placeholder="Rumah"
                                        value={newAddress.label}
                                        onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                        className="h-11 rounded-lg border-gray-200 focus:ring-red-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Nama Penerima</Label>
                                    <Input
                                        placeholder="John Doe"
                                        value={newAddress.recipient}
                                        onChange={e => setNewAddress({ ...newAddress, recipient: e.target.value })}
                                        className="h-11 rounded-lg border-gray-200 focus:ring-red-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Alamat Lengkap</Label>
                                    <Textarea
                                        placeholder="Jalan, No Rumah, Kelurahan, Kecamatan..."
                                        value={newAddress.address}
                                        onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                                        className="min-h-[100px] rounded-lg border-gray-200 focus:ring-red-500 resize-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">No. Telepon / WhatsApp</Label>
                                    <Input
                                        placeholder="0812..."
                                        value={newAddress.phone}
                                        onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                                        className="h-11 rounded-lg border-gray-200 focus:ring-red-500"
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                                <Button variant="ghost" onClick={() => setIsAddingAddress(false)} className="flex-1 h-11 rounded-lg font-bold">Batal</Button>
                                <Button
                                    onClick={handleAddAddress}
                                    className="flex-[2] h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                                    disabled={!newAddress.address || isAddingAddress && (isLoading || isSubmitting)}
                                >
                                    {isLoading || isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan & Gunakan'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Cancellation Dialog */}
            <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            Batalkan SQ
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 mt-1">
                            Pilih alasan pembatalan untuk memproses pembatalan penawaran ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 pt-2 space-y-6">
                        <RadioGroup value={cancelReason} onValueChange={setCancelReason} className="space-y-4">
                            {CANCEL_REASONS.map((reason) => (
                                <div key={reason} className="flex items-center space-x-3 group">
                                    <RadioGroupItem value={reason} id={reason} className="border-gray-300 text-red-600 focus:ring-red-500" />
                                    <Label
                                        htmlFor={reason}
                                        className="text-sm font-medium text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors"
                                    >
                                        {reason}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>

                        {cancelReason === "Lainnya" && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                    Alasan Detail
                                </Label>
                                <Textarea
                                    placeholder="Tuliskan alasan lainnya..."
                                    value={otherReason}
                                    onChange={(e) => setOtherReason(e.target.value)}
                                    className="min-h-[100px] resize-none border-gray-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsCancelOpen(false);
                                setCancelReason("");
                                setOtherReason("");
                            }}
                            className="flex-1 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                        >
                            Tutup
                        </Button>
                        <Button
                            onClick={handleCancel}
                            disabled={isCancelling || !cancelReason || (cancelReason === "Lainnya" && !otherReason)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Membatalkan...
                                </>
                            ) : (
                                "Batalkan SQ"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
