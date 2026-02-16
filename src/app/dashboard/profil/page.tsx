"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getUserProfile } from "@/app/actions/profile";
import { Loader2, Zap, Clock, User, Phone, Mail, Award, CheckCircle2, Store } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function ProfilPage() {
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

    if (!profile) {
        return <div className="p-6 text-center text-red-500">Gagal memuat profil.</div>;
    }

    const customerType = profile.customer?.type || "PERORANGAN";
    const pendingUpgrade = profile.pendingUpgrade;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                    Profil Pengguna
                </h2>
                <div className="flex flex-col items-end">
                    <Badge variant="outline" className={`
                        text-sm px-3 py-1 font-semibold uppercase tracking-wide
                        ${customerType === "RESELLER" ? "bg-purple-100 text-purple-700 border-purple-200" : ""}
                        ${customerType === "EXCLUSIVE" ? "bg-amber-100 text-amber-700 border-amber-200" : ""}
                        ${customerType === "PERORANGAN" ? "bg-gray-100 text-gray-700 border-gray-200" : ""}
                        ${customerType === "BISNIS" ? "bg-blue-100 text-blue-700 border-blue-200" : ""}
                    `}>
                        {customerType}
                    </Badge>
                    {/* Show discount info based on type? */}
                </div>
            </div>

            {/* Upgrade moved to /dashboard/settings */}

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <User className="w-4 h-4" /> Nama Lengkap
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                            {profile.name || "-"}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Email
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                            {profile.email}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Phone className="w-4 h-4" /> No. Handphone
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                            {profile.phone || "-"}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Award className="w-4 h-4" /> Tipe Customer
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                            {customerType}
                        </div>
                    </div>

                    {profile.customer?.company && (
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-500">Perusahaan</label>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                                {profile.customer.company}
                            </div>
                        </div>
                    )}

                    {profile.customer?.address && (
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-500">Alamat</label>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                                {profile.customer.address}
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Button? For now just static display as per requirement focus on upgrade */}
                {/* <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full sm:w-auto">
                        Edit Profil
                    </Button>
                </div> */}
            </div>
        </div>
    );
}
