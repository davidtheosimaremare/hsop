"use client";

import { useEffect, useState } from "react";
import {
    FileText,
    Package,
    Truck,
    ShoppingCart,
    History,
    Wallet,
    Loader2,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { getUserQuotations } from "@/app/actions/quotation";
import { getCurrentUser } from "@/app/actions/auth";
import { getUpgradeRequestStatus } from "@/app/actions/upgrade";
import { allPermissions, permissionCategories } from "@/lib/rbac";

export default function DashboardPage() {
    const [counts, setCounts] = useState({
        offered: 0,
        confirmed: 0,
        shipped: 0,
        pending: 0,
        total: 0
    });
    const [user, setUser] = useState<any>(null);
    const [isRetail, setIsRetail] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [upgradeRequest, setUpgradeRequest] = useState<any>(null); // null = none, object = pending/rejected/approved

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [quotationResult, userResult, upgradeResult] = await Promise.all([
                    getUserQuotations(),
                    getCurrentUser(),
                    getUpgradeRequestStatus()
                ]);

                if (quotationResult.success) {
                    const qs = quotationResult.quotations;
                    const retailCheck = qs.some((q: any) => q.customerType === 'RETAIL' || q.customerType === 'RITEL' || q.customerType !== 'BISNIS');
                    setIsRetail(retailCheck);

                    setCounts({
                        offered: qs.filter((q: any) => retailCheck ? false : q.status === "OFFERED").length,
                        confirmed: qs.filter((q: any) => {
                            if (retailCheck) return ["OFFERED", "PROCESSING", "CONFIRMED"].includes(q.status);
                            return ["CONFIRMED", "PROCESSING"].includes(q.status);
                        }).length,
                        shipped: qs.filter((q: any) => q.status === "SHIPPED").length,
                        pending: qs.filter((q: any) => {
                            if (retailCheck) return ["PENDING", "DRAFT"].includes(q.status);
                            return ["PENDING", "DRAFT"].includes(q.status);
                        }).length,
                        total: qs.length
                    });
                }
                
                setUser(userResult);
                setUpgradeRequest(upgradeResult); // Set upgrade request status
                
            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 19) return "Selamat Sore";
        return "Selamat Malam";
    };

    const getPersonalizedGreeting = () => {
        if (!user?.name) return { greeting: "Halo, Pelanggan", showTitle: false };
        
        const name = user.name;
        const isCompany = name.toLowerCase().includes('pt') || 
                         name.toLowerCase().includes('cv') || 
                         name.toLowerCase().includes('tbk') ||
                         name.toLowerCase().includes('persero');
        
        if (isCompany) {
            return { greeting: `Halo, ${name}`, showTitle: false };
        } else {
            return { greeting: `Halo, Pak/Bu ${name.split(' ').pop()}`, showTitle: true };
        }
    };

    const { greeting: personalizedGreeting } = getPersonalizedGreeting();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
                <p className="text-gray-400 font-medium text-sm">Menyiapkan dashboard Anda...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ─── Greeting Section ─── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-sm font-bold text-red-600">{getTimeGreeting()}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {personalizedGreeting}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                    Kelola pesanan dan pantau pengiriman produk Anda dalam satu tempat.
                </p>
            </div>

            {/* ─── Order Summary Boxes ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <ModernSummaryCard
                    label="Draft"
                    count={counts.pending}
                    icon={FileText}
                    gradient="from-red-500 to-red-600"
                    bgColor="bg-red-50"
                    href="/dashboard/transaksi"
                />
                <ModernSummaryCard
                    label="Diproses"
                    count={counts.offered + counts.confirmed}
                    icon={Package}
                    gradient="from-blue-500 to-blue-600"
                    bgColor="bg-blue-50"
                    href="/dashboard/transaksi"
                />
                <ModernSummaryCard
                    label="Dikirim"
                    count={counts.shipped}
                    icon={Truck}
                    gradient="from-emerald-500 to-emerald-600"
                    bgColor="bg-emerald-50"
                    href="/dashboard/transaksi"
                />
                <ModernSummaryCard
                    label="Total Pesanan"
                    count={counts.total}
                    icon={ShoppingCart}
                    gradient="from-violet-500 to-violet-600"
                    bgColor="bg-violet-50"
                    href="/dashboard/transaksi"
                />
            </div>

            {/* ─── Quick Navigation & Reseller Card (One Row) ─── */}
            <div className={`grid gap-4 ${!upgradeRequest ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
                <QuickActionCard
                    icon={History}
                    title="Riwayat Transaksi"
                    desc="Pantau status pesanan Anda"
                    href="/dashboard/transaksi"
                />
                <QuickActionCard
                    icon={Wallet}
                    title="Profil & Akun"
                    desc="Atur profil dan preferensi"
                    href="/dashboard/profil"
                />
                
                {/* Show Reseller Card based on upgrade request status */}
                {!upgradeRequest && <ResellerCard />}
                {upgradeRequest?.status === "PENDING" && <PendingUpgradeCard />}
                {upgradeRequest?.status === "REJECTED" && <ResellerCard showRejected />}
                {/* If APPROVED, don't show any card */}
            </div>
        </div>
    );
}

// ─── Modern Summary Card Component ───
function ModernSummaryCard({ label, count, icon: Icon, gradient, bgColor, href }: any) {
    return (
        <Link href={href} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-gray-200">
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-300`} />
            
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
                
                <div className="mb-1">
                    <p className={`text-4xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent leading-none`}>
                        {count}
                    </p>
                </div>
                
                <p className={`text-xs font-bold uppercase tracking-wider ${bgColor.replace('bg-', 'text-').replace('50', '600')}`}>
                    {label}
                </p>
            </div>
            
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} style={{ background: `linear-gradient(135deg, transparent 0%, transparent 95%, rgba(0,0,0,0.05) 100%)` }} />
        </Link>
    );
}

// ─── Quick Action Card Component ───
function QuickActionCard({ icon: Icon, title, desc, href }: any) {
    return (
        <Link href={href} className="group p-6 bg-white rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-red-100 hover:-translate-y-1">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                    <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                        {title}
                    </h4>
                    <p className="text-sm text-gray-500 font-medium">
                        {desc}
                    </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300 -mt-1" />
            </div>
        </Link>
    );
}

// ─── Reseller Card Component ───
function ResellerCard({ showRejected = false }: { showRejected?: boolean }) {
    return (
        <Link href="/dashboard/upgrade" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-600 to-red-700 p-6 text-white shadow-lg hover:shadow-2xl hover:shadow-red-500/30 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-900/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

            <div className="relative z-10">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-lg font-bold leading-tight mb-1">
                            {showRejected ? "Upgrade Ditolak" : "Jadi Reseller"}
                        </h4>
                        <p className="text-sm text-red-100 font-medium">
                            {showRejected ? "Ajukan ulang permintaan" : "Dapatkan harga spesial"}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-red-50 font-medium mb-5 leading-relaxed">
                    {showRejected
                        ? "Perbaiki dokumen Anda dan ajukan ulang upgrade untuk mendapatkan akses ke harga reseller."
                        : "Upgrade akun Anda untuk mendapatkan akses ke harga reseller dan fitur eksklusif lainnya."
                    }
                </p>

                <div className="flex items-center gap-2 text-sm font-bold">
                    <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg group-hover:bg-white/30 transition-all duration-300">
                        {showRejected ? "Ajukan Ulang" : "Upgrade Sekarang"}
                    </span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}

// ─── Pending Upgrade Card Component ───
function PendingUpgradeCard() {
    return (
        <div className="rounded-2xl bg-amber-50 p-6 border-2 border-amber-200">
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-bold text-amber-900 leading-tight">
                            Permintaan Sedang Diproses
                        </h4>
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold uppercase rounded">
                            Pending
                        </span>
                    </div>
                    <p className="text-sm text-amber-700">Tim kami sedang meninjau dokumen Anda</p>
                </div>
            </div>

            <div className="bg-white rounded-lg p-3 mb-3 border border-amber-100">
                <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-sm font-semibold text-amber-900 mb-0.5">Waktu Proses: 1x24 Jam</p>
                        <p className="text-xs text-amber-700 leading-snug">
                            Anda akan menerima notifikasi melalui email setelah proses selesai.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-800 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Dokumen diterima - Menunggu verifikasi</span>
            </div>
        </div>
    );
}
