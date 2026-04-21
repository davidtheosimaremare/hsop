import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full animate-in fade-in duration-300">
            <div className="absolute top-0 left-0 w-full h-1 overflow-hidden rounded-t-xl">
                <div className="h-full bg-red-600 animate-[loading-bar_1.5s_ease-in-out_infinite]" style={{ transformOrigin: '0% 50%' }}></div>
            </div>

            <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                <div className="absolute inset-0 border-4 border-red-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Memuat Dasbor...</h3>
            <p className="text-sm text-gray-500 animate-pulse">Menyiapkan profil & pesanan Anda</p>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes loading-bar {
                    0% { transform: scaleX(0); opacity: 1; }
                    50% { transform: scaleX(1); opacity: 1; }
                    100% { transform: scaleX(1); opacity: 0; }
                }
            `}} />
        </div>
    );
}
