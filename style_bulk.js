const fs = require('fs');
const file = 'src/components/bulk-order/BulkOrderClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Compact Info Banner
const oldBanner = `<div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Cara Menggunakan Bulk Order:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                            <li>Unduh template Excel di panel samping, isi SKU & QTY, lalu unggah.</li>
                            <li>Atau cari produk satu per satu menggunakan kolom pencarian di bawah.</li>
                            <li>Produk dengan stok terbatas otomatis dipisah menjadi baris Ready & Indent.</li>
                        </ul>
                    </div>
                </div>`;
const newBanner = `<div className="bg-blue-50/50 border border-blue-100/50 rounded-lg py-2 px-3 flex items-center gap-2 text-xs text-blue-800">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <p>
                        <span className="font-semibold mr-1">Tips:</span>
                        Cari produk satu per satu, copy-paste list SKU, atau unggah Excel di panel samping. Produk dengan stok terbatas otomatis dipisah (Ready/Indent).
                    </p>
                </div>`;
content = content.replace(oldBanner, newBanner);

// 2. Tab Navigation - Segmented Control Style
const oldTabs = `<div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                        <button 
                            className={\`text-sm font-semibold pb-1 transition-colors \${activeTab === 'search' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-700'}\`}
                            onClick={() => setActiveTab('search')}
                        >
                            Cari Produk
                        </button>
                        <button 
                            className={\`text-sm font-semibold pb-1 transition-colors \${activeTab === 'paste' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-700'}\`}
                            onClick={() => setActiveTab('paste')}
                        >
                            Copy & Paste List
                        </button>
                    </div>`;
const newTabs = `<div className="flex items-center p-1 bg-gray-100/80 rounded-lg w-fit mb-3">
                        <button 
                            className={\`text-xs font-semibold px-4 py-1.5 rounded-md transition-all \${activeTab === 'search' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                            onClick={() => setActiveTab('search')}
                        >
                            Cari Produk
                        </button>
                        <button 
                            className={\`text-xs font-semibold px-4 py-1.5 rounded-md transition-all \${activeTab === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                            onClick={() => setActiveTab('paste')}
                        >
                            Copy & Paste List
                        </button>
                    </div>`;
content = content.replace(oldTabs, newTabs);

// 3. Compact Search Bar & Textarea
// Input and form button
content = content.replace(/className="pl-9 pr-8 h-10 text-sm rounded-lg/g, 'className="pl-9 pr-8 h-9 text-sm rounded-md');
content = content.replace(/className="h-10 px-4 rounded-lg font-medium shadow-sm/g, 'className="h-9 px-4 rounded-md text-xs font-medium shadow-sm');
// Textarea
content = content.replace(/className="w-full h-32 p-3 text-sm border/g, 'className="w-full h-24 p-2.5 text-xs border');
// Submit button
content = content.replace(/className="h-10 px-6 rounded-lg font-medium text-sm shadow-sm"/g, 'className="h-8 px-4 rounded-md font-medium text-xs shadow-sm"');
// Panel padding
content = content.replace(/className="bg-white rounded-xl border border-gray-200 p-4/g, 'className="bg-white rounded-xl border border-gray-200 p-3.5');

// 4. Empty State
const oldEmpty = `<div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">Daftar pesanan masih kosong</p>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto">Cari produk menggunakan pencarian di atas atau unggah file Excel di panel samping.</p>
                    </div>`;
const newEmpty = `<div className="bg-white rounded-xl border border-dashed border-gray-200 py-10 text-center shadow-sm">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ShoppingCart className="w-5 h-5 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-semibold text-sm">Daftar pesanan masih kosong</p>
                        <p className="text-gray-500 mt-1 text-xs max-w-xs mx-auto">Tambahkan produk dari pencarian, copy-paste, atau file Excel.</p>
                    </div>`;
content = content.replace(oldEmpty, newEmpty);

// 5. Sidebar - Impor via Excel
content = content.replace(/className="w-full lg:w-\[280px\]/g, 'className="w-full lg:w-[260px]');

// Excel Upload Button & Template button
content = content.replace(/className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"/g, 'className="w-full inline-flex justify-center items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"');
content = content.replace(/className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700/g, 'className="w-full inline-flex justify-center items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700');

// Impor Excel panel padding & text
content = content.replace(/className={\`bg-white rounded-2xl border-2 transition-all p-5 shadow-sm/g, 'className={`bg-white rounded-xl border transition-all p-4 shadow-sm');
content = content.replace(/<p className="text-sm text-gray-500 mb-5 leading-relaxed">/g, '<p className="text-xs text-gray-500 mb-4 leading-relaxed">');
content = content.replace(/<h3 className="font-bold text-gray-900 text-base">Impor via Excel<\/h3>/g, '<h3 className="font-bold text-gray-900 text-sm">Impor via Excel</h3>');
content = content.replace(/<div className="flex items-center gap-2.5 mb-2">/g, '<div className="flex items-center gap-2 mb-2">');

// 6. Sidebar - Ringkasan Pesanan
content = content.replace(/<div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">/g, '<div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">');
content = content.replace(/<h3 className="font-bold text-gray-900 mb-4 text-base">Ringkasan Pesanan<\/h3>/g, '<h3 className="font-bold text-gray-900 mb-3 text-sm">Ringkasan Pesanan</h3>');
content = content.replace(/<div className="space-y-3.5 mb-6">/g, '<div className="space-y-2 mb-4">');

// Total numbers and sizes
content = content.replace(/<span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md">{items.length}<\/span>/g, '<span className="font-semibold text-gray-900 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-xs">{items.length}</span>');
content = content.replace(/<span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md">{totalQty}<\/span>/g, '<span className="font-semibold text-gray-900 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-xs">{totalQty}</span>');
content = content.replace(/<span className="text-gray-500">Total Macam Item<\/span>/g, '<span className="text-gray-500 text-xs">Total Macam Item</span>');
content = content.replace(/<span className="text-gray-500">Total Kuantitas<\/span>/g, '<span className="text-gray-500 text-xs">Total Kuantitas</span>');

content = content.replace(/<div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-1">/g, '<div className="pt-3 mt-2 border-t border-gray-100 flex flex-col gap-0.5">');
content = content.replace(/<span className="text-gray-900 font-bold">Total<\/span>/g, '<span className="text-gray-900 font-bold text-sm">Total</span>');
content = content.replace(/<span className="font-black text-red-600 text-xl tracking-tight">/g, '<span className="font-black text-red-600 text-base tracking-tight">');
content = content.replace(/<p className="text-\[11px\] text-gray-400 text-right">/g, '<p className="text-[10px] text-gray-400 text-right">');

// Buttons in Summary
content = content.replace(/className="w-full gap-2 h-12 rounded-xl shadow-lg shadow-red-100 font-bold text-base transition-all hover:shadow-red-200"/g, 'className="w-full gap-2 h-10 rounded-lg shadow-md shadow-red-100 font-semibold text-sm transition-all hover:shadow-red-200"');
content = content.replace(/className="inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-50 border/g, 'className="inline-flex justify-center items-center gap-1.5 px-2 py-2 rounded-lg bg-gray-50 border');

// 7. Make table container less rounded
content = content.replace(/<div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">/g, '<div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">');
// Table header padding
content = content.replace(/<th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">/g, '<th className="px-3 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">');
content = content.replace(/<th className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">/g, '<th className="px-3 py-2 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">');
content = content.replace(/<th className="px-3 py-2.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">/g, '<th className="px-3 py-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide">');

fs.writeFileSync(file, content);
console.log("Style updates applied.");
