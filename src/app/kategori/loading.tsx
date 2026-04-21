export default function LoadingKategori() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="h-[70px] bg-white border-b w-full" />

            <main className="flex-1 w-full relative">
                <div className="absolute top-0 left-0 w-full h-1">
                    <div className="h-full bg-red-600 animate-[loading-bar_1.5s_ease-in-out_infinite]" style={{ transformOrigin: '0% 50%' }}></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                            </div>
                        ))}
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
