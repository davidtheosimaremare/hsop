import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import { Loader2 } from "lucide-react";

export default function LoadingProduct() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader />

            <main className="flex-1 w-full relative">
                {/* Visual loading indicator for fast feedback */}
                <div className="absolute top-0 left-0 w-full h-1">
                    <div className="h-full bg-red-600 animate-[loading-bar_1.5s_ease-in-out_infinite]" style={{ transformOrigin: '0% 50%' }}></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
                    {/* Breadcrumb skeleton */}
                    <div className="h-5 bg-gray-200 rounded w-64 mb-6"></div>

                    {/* Main Content Skeleton */}
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        {/* Left: Images */}
                        <div className="w-full lg:w-[500px] flex-shrink-0 flex flex-col gap-4">
                            <div className="aspect-square bg-gray-200 rounded-xl w-full"></div>
                            <div className="flex gap-2 lg:gap-4 overflow-hidden">
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="flex-1 flex flex-col pt-2 lg:pt-4">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                            <div className="h-8 bg-gray-200 rounded w-[80%] mb-4"></div>
                            <div className="h-6 bg-gray-200 rounded w-[40%] mb-10"></div>
                            
                            <div className="space-y-3 mb-8">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-[90%]"></div>
                                <div className="h-4 bg-gray-200 rounded w-[85%]"></div>
                            </div>

                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 space-y-4">
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 mt-auto">
                                <div className="h-12 bg-gray-200 rounded w-32"></div>
                                <div className="h-12 bg-gray-200 rounded flex-1"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes loading-bar {
                        0% { transform: scaleX(0); opacity: 1; }
                        50% { transform: scaleX(1); opacity: 1; }
                        100% { transform: scaleX(1); opacity: 0; }
                    }
                `}} />
            </main>

            <Footer />
        </div>
    );
}
