import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Users, Building2, UserPlus, AlertCircle, CheckCircle2, Shield, Share2, ShoppingCart, TrendingUp, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TeamManager } from "@/components/dashboard/TeamManager";

export default async function ManageTeamPage() {
    const session = await getSession();

    if (!session?.user?.email) {
        redirect("/masuk");
    }

    // Fetch User and Customer Data
    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { customer: true }
    });

    if (!user) {
        redirect("/masuk");
    }

    // Unified check for accounts that can manage teams
    // Supported types: CORPORATE, RESELLER, BISNIS
    // GENERAL / INDIVIDUAL see benefits
    const canManageTeam = user.customer?.type === "CORPORATE" || user.customer?.type === "RESELLER" || user.customer?.type === "BISNIS";
    const customer = user.customer;

    // Fetch Team Members
    const teamMembers = canManageTeam ? await db.user.findMany({
        where: { customerId: user.customerId },
        orderBy: { createdAt: "asc" }
    }) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kelola Tim</h1>
                    <p className="text-gray-500">Atur akses dan anggota tim Anda.</p>
                </div>
            </div>

            {/* Content */}
            {!canManageTeam ? (
                // Retail Account View - Show Company/Business Benefits
                <div className="space-y-6">
                    {/* Hero Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Building2 className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Akun Bisnis & Reseller</h2>
                                    <p className="text-sm text-slate-300">Solusi terbaik untuk operasional tim Anda</p>
                                </div>
                            </div>

                            <p className="text-slate-300 max-w-2xl leading-relaxed">
                                Tingkatkan efisiensi bisnis Anda dengan fitur kolaborasi tim yang lengkap.
                                Kelola akses, bagi tanggung jawab, dan pantau semua aktivitas dalam satu akun terpusat.
                            </p>
                        </div>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <BenefitCard
                            icon={Users}
                            title="Multi-User Access"
                            description="Satu akun untuk banyak user. Tim Anda bisa login bersamaan dengan akses yang disesuaikan."
                            color="blue"
                        />
                        <BenefitCard
                            icon={Shield}
                            title="Role-Based Access"
                            description="Atur peran dan izin akses untuk setiap anggota tim (Admin, Purchasing, Finance, dll)."
                            color="purple"
                        />
                        <BenefitCard
                            icon={Share2}
                            title="Shared Resources"
                            description="Berbagi keranjang belanja, invoice, dan riwayat transaksi dengan seluruh tim."
                            color="green"
                        />
                        <BenefitCard
                            icon={ShoppingCart}
                            title="Purchasing Team"
                            description="Tim purchasing dapat membuat dan mengelola pesanan secara independen."
                            color="orange"
                        />
                        <BenefitCard
                            icon={TrendingUp}
                            title="Business Analytics"
                            description="Pantau pengeluaran dan aktivitas pembelian tim dengan laporan lengkap."
                            color="indigo"
                        />
                        <BenefitCard
                            icon={Building}
                            title="Company Profile"
                            description="Profil perusahaan lengkap dengan NPWP untuk kebutuhan faktur pajak."
                            color="red"
                        />
                    </div>

                    {/* Comparison Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <h3 className="text-lg font-bold text-gray-900">Perbandingan Fitur</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fitur</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <span className="text-gray-400">Akun Pribadi</span>
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gradient-to-r from-red-600 to-red-700">
                                            <span className="flex items-center justify-center gap-1">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Akun Bisnis
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    <ComparisonRow feature="Login Multi-User" personal={false} company={true} />
                                    <ComparisonRow feature="Kelola Tim & Role" personal={false} company={true} />
                                    <ComparisonRow feature="Shared Cart & Invoice" personal={false} company={true} />
                                    <ComparisonRow feature="Faktur Pajak (NPWP)" personal={false} company={true} />
                                    <ComparisonRow feature="TOP (Term of Payment)" personal={false} company={true} />
                                    <ComparisonRow feature="Laporan Pembelian" personal={true} company={true} />
                                    <ComparisonRow feature="Diskon Spesial" personal={false} company={true} />
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="relative overflow-hidden bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

                        <div className="relative z-10 p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-base font-bold text-gray-900 mb-2">
                                        Ingin Upgrade ke Akun Bisnis?
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                        Nikmati berbagai fitur eksklusif untuk perusahaan dan reseller dengan melakukan upgrade akun Anda sekarang.
                                    </p>
                                    <Link prefetch={false} 
                                        href="/dashboard/upgrade"
                                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors group"
                                    >
                                        <span className="bg-blue-50 px-4 py-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                                            Ajukan Upgrade Akun
                                        </span>
                                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Company/Reseller Account View - Team Management
                <TeamManager
                    initialMembers={JSON.parse(JSON.stringify(teamMembers))}
                    currentUserId={user.id}
                    customer={JSON.parse(JSON.stringify(customer))}
                />
            )}
        </div>
    );
}

// Benefit Card Component
function BenefitCard({ icon: Icon, title, description, color }: any) {
    const colors: any = {
        blue: "from-blue-500 to-blue-600",
        purple: "from-purple-500 to-purple-600",
        green: "from-green-500 to-green-600",
        orange: "from-orange-500 to-orange-600",
        indigo: "from-indigo-500 to-indigo-600",
        red: "from-red-500 to-red-600",
    };

    return (
        <div className="group p-5 bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-2">{title}</h4>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{description}</p>
        </div>
    );
}

// Comparison Row Component
function ComparisonRow({ feature, personal, company }: any) {
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-sm font-medium text-gray-900">{feature}</td>
            <td className="px-6 py-4 text-center">
                {personal ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                ) : (
                    <span className="text-gray-300">—</span>
                )}
            </td>
            <td className="px-6 py-4 text-center bg-gradient-to-r from-red-50/50 to-transparent">
                <CheckCircle2 className="w-5 h-5 text-red-600 mx-auto" />
            </td>
        </tr>
    );
}
