"use client";

import { useState, useEffect } from "react";
import { Shield, Cookie } from "lucide-react";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if cookie consent was already given
        const hasConsent = document.cookie.includes("_hki_acc=1");
        if (!hasConsent) {
            // Small delay for smoother UX
            const timer = setTimeout(() => setIsVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        // Set cookie for 365 days
        document.cookie = "_hki_acc=1;path=/;max-age=31536000;SameSite=Lax";
        setIsVisible(false);
    };

    const handleReject = () => {
        // Set a minimal cookie (required for site functionality only)
        document.cookie = "_hki_acc=0;path=/;max-age=86400;SameSite=Lax";
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Backdrop overlay */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-300"
                style={{ animation: "fadeIn 0.3s ease-out" }}
            />

            {/* Cookie consent modal */}
            <div 
                className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
                style={{ animation: "slideUp 0.4s ease-out" }}
            >
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header with icon */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Kami Menghargai Privasi Anda</h3>
                            <p className="text-teal-100 text-xs">Perlindungan data & keamanan website</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-5">
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            Dengan mengklik <strong>"Terima Cookie"</strong>, Anda menyetujui penyimpanan cookie di 
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
                                className="flex-1 px-5 py-3 text-sm font-medium text-gray-600 bg-gray-100 
                                         rounded-xl hover:bg-gray-200 transition-all duration-200 
                                         active:scale-[0.98]"
                            >
                                Tolak Cookie
                            </button>
                            <button
                                onClick={handleAccept}
                                className="flex-1 px-5 py-3 text-sm font-bold text-white 
                                         bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl 
                                         hover:from-teal-700 hover:to-teal-800 
                                         transition-all duration-200 shadow-lg shadow-teal-600/25
                                         active:scale-[0.98]"
                            >
                                ✓ Terima Cookie
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
