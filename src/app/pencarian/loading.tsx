import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";

export default function LoadingSearch() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader />

            <main className="flex-1 w-full relative">
                {/* Visual loading indicator */}
                <div className="absolute top-0 left-0 w-full h-1">
                    <div className="h-full bg-red-600 animate-[loading-bar_1.5s_ease-in-out_infinite]" style={{ transformOrigin: '0% 50%' }}></div>
                </div>

                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Sidebar Skeleton */}
                        <div className="hidden lg:block w-64 flex-shrink-0 animate-pulse">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">
                                <div className="h-5 bg-gray-200 rounded w-2/3 mb-6"></div>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Search Area Skeleton */}
                        <div className="flex-1 animate-pulse">
                            {/* Toolbar Skeleton */}
                            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between mb-6">
                                <div className="h-5 bg-gray-200 rounded w-48"></div>
                                <div className="h-10 bg-gray-200 rounded w-40 hidden sm:block"></div>
                            </div>

                            {/* Product List Skeleton */}
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white border text-left flex flex-col sm:flex-row p-4 gap-4 sm:gap-6 rounded-2xl border-gray-100 shadow-sm relative overflow-hidden">
                                        <div className="w-full sm:w-48 aspect-square sm:aspect-auto bg-gray-200 rounded-xl flex-shrink-0"></div>
                                        <div className="flex-1 flex flex-col py-1 space-y-3">
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                            <div className="space-y-2 pt-2">
                                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                            </div>
                                        </div>
                                        <div className="sm:w-[220px] flex-shrink-0 flex flex-col border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 justify-between">
                                            <div>
                                                <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                                                <div className="h-8 bg-gray-200 rounded w-32"></div>
                                            </div>
                                            <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
                                        </div>
                                    </div>
                                ))}
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
