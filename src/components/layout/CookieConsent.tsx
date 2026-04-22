"use client";

import { useState, useEffect } from "react";
import { Shield, Cookie } from "lucide-react";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasConsent = document.cookie.includes("_hki_acc=1") || document.cookie.includes("_hki_acc=0");
        if (!hasConsent) {
            const timer = setTimeout(() => setIsVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        document.cookie = "_hki_acc=1;path=/;max-age=31536000;SameSite=Lax";
        setIsVisible(false);
    };

    const handleReject = () => {
        document.cookie = "_hki_acc=0;path=/;max-age=86400;SameSite=Lax";
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Backdrop overlay */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]" />

            {/* Cookie consent modal */}
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-[slideUp_0.4s_ease-out]">
                    {/* Header with icon */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Kami Menghargai Privasi Anda</h3>
                            <p className="text-teal-100 text-xs">Perlindungan data &amp; keamanan website</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-5">
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            Dengan mengklik <strong>&quot;Terima Cookie&quot;</strong>, Anda menyetujui penyimpanan cookie di
                            perangkat Anda untuk meningkatkan navigasi, menganalisis penggunaan situs, serta membantu
                            upaya kami dalam menjaga keamanan dan kinerja website.
                        </p>

                        <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 mb-5">
                            <Cookie className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Cookie digunakan untuk verifikasi keamanan, mencegah akses otomatis oleh bot,
                                dan memastikan pengalaman terbaik bagi pelanggan kami.
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col-reverse sm:flex-row gap-3">
                            <button
                                onClick={handleReject}
                                className="flex-1 px-5 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 active:scale-95"
                            >
                                Tolak Cookie
                            </button>
                            <button
                                onClick={handleAccept}
                                className="flex-1 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg shadow-teal-600/25 active:scale-95"
                            >
                                ✓ Terima Cookie
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </>
    );
}
