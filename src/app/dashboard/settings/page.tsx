"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Loader2, Clock, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserProfile } from "@/app/actions/profile";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const result = await getUserProfile();
                // @ts-ignore
                if (result.success) {
                    // @ts-ignore
                    setProfile(result.user);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const customerType = profile?.customer?.type || "PERORANGAN";
    const pendingUpgrade = profile?.pendingUpgrade;

    return (
        <div className="space-y-6">

            {/* Pending Status Banner */}
            {pendingUpgrade && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-yellow-800">Permintaan Upgrade Sedang Diproses</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            Permintaan Anda untuk menjadi <span className="font-bold">{pendingUpgrade.requestType}</span> sedang ditinjau oleh tim kami.
                        </p>
                    </div>
                </div>
            )}

            {/* Upgrade Banner for PERORANGAN -> EXCLUSIVE MEMBER */}
            {!pendingUpgrade && customerType === "PERORANGAN" && (
                <div className="bg-[#D80000] rounded-xl shadow-lg text-white overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="p-8 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Store className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold tracking-tight">Upgrade ke Member Exclusive</h3>
                                </div>
                                <p className="text-white/90 mb-6 max-w-xl leading-relaxed">
                                    Nikmati keuntungan status eksklusif: Diskon Spesial, Prioritas Penawaran, dan Layanan Personal untuk pengalaman belanja yang lebih baik.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {["Diskon Spesial", "Prioritas Penawaran", "Layanan Personal"].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20 text-xs font-medium backdrop-blur-sm">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <Link href="/dashboard/upgrade">
                                    <Button className="bg-white text-[#D80000] hover:bg-white/90 font-bold px-8 h-12 shadow-xl transition-transform hover:scale-105 text-base">
                                        Upgrade Sekarang
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Akses Cepat Pengaturan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/dashboard/profil" className="block p-4 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-1">Profil Pengguna</h4>
                                <p className="text-sm text-gray-500">Ubah nama, email, dan detail kontak Anda.</p>
                            </div>
                            {profile && (
                                <Badge variant="outline" className="text-xs">{profile.customer?.type}</Badge>
                            )}
                        </div>
                    </Link>
                    <Link href="/dashboard/password" className="block p-4 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-all">
                        <h4 className="font-semibold text-gray-900 mb-1">Keamanan Akun</h4>
                        <p className="text-sm text-gray-500">Ubah kata sandi untuk menjaga keamanan akun.</p>
                    </Link>
                    <Link href="/dashboard/alamat" className="block p-4 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-all">
                        <h4 className="font-semibold text-gray-900 mb-1">Buku Alamat</h4>
                        <p className="text-sm text-gray-500">Kelola daftar alamat pengiriman pesanan.</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
