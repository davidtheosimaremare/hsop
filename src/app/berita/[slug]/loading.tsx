export default function LoadingBerita() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="h-[70px] bg-white border-b w-full" />

            <main className="flex-1 w-full relative">
                <div className="absolute top-0 left-0 w-full h-1">
                    <div className="h-full bg-red-600 animate-[loading-bar_1.5s_ease-in-out_infinite]" style={{ transformOrigin: '0% 50%' }}></div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
                    {/* Breadcrumb skeleton */}
                    <div className="h-5 bg-gray-200 rounded w-48 mb-8"></div>
                    
                    {/* Title */}
                    <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="flex gap-4 mb-8">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>

                    {/* Featured Image */}
                    <div className="aspect-video bg-gray-200 rounded-xl mb-8"></div>

                    {/* Content */}
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-[90%]"></div>
                        <div className="h-4 bg-gray-200 rounded w-[85%]"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
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
        </div>
    );
}
