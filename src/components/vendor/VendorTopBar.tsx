"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    LogOut,
    User,
    Settings,
    ChevronDown,
} from "lucide-react";
import { useAuth } from "@/components/auth/CanAccess";

export default function VendorTopBar() {
    const router = useRouter();
    const { user } = useAuth();
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleLogout = async () => {
        const { logoutAction } = await import("@/app/actions/auth");
        await logoutAction();
    };

    const userInitials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase() || "VN";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-teal-100 shadow-sm flex items-center px-4 gap-3">
            <div className="w-[68px] flex-shrink-0 flex items-center justify-center">
                <img src="/logo-H.png" alt="Hokiindo" className="h-8 w-8 object-contain" />
            </div>

            <div className="flex-1">
            </div>

            <div className="flex items-center gap-2 ml-auto">
                <div ref={profileRef} className="relative">
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors border border-transparent hover:border-teal-100"
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-[11px] font-black shadow-sm flex-shrink-0">
                            {userInitials}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-[12px] font-bold text-slate-900 leading-none">
                                {user?.name?.replace(/Simulation/gi, "").trim() || user?.email || "Vendor"}
                            </p>
                            <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider leading-none mt-0.5">Vendor</p>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-teal-400 hidden md:block" />
                    </button>

                    {showProfile && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-teal-100 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-teal-50 bg-teal-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-sm font-black shadow-sm flex-shrink-0">
                                        {userInitials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">
                                            {user?.name?.replace(/Simulation/gi, "").trim() || "Vendor"}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="py-1.5">
                                <button onClick={() => { router.push("/vendor/settings"); setShowProfile(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 transition-colors text-left">
                                    <Settings className="w-4 h-4 text-teal-400" />
                                    Pengaturan Akun
                                </button>
                            </div>

                            <div className="border-t border-teal-50 py-1.5">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Keluar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
