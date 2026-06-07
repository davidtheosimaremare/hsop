const fs = require('fs');
const file = 'src/components/bulk-order/BulkOrderClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '        <div className="space-y-6">\n            {/* Info Banner */}';
const endStr = '            {/* Custom Product Modal */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
    console.error("Start or end not found!");
    process.exit(1);
}

const replacement = `        <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Column: Search & Product List */}
            <div className="flex-1 space-y-4 w-full min-w-0">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Cara Menggunakan Bulk Order:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                            <li>Unduh template Excel di panel samping, isi SKU & QTY, lalu unggah.</li>
                            <li>Atau cari produk satu per satu menggunakan kolom pencarian di bawah.</li>
                            <li>Produk dengan stok terbatas otomatis dipisah menjadi baris Ready & Indent.</li>
                        </ul>
                    </div>
                </div>

                {/* SKU Search */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm relative" ref={searchContainerRef}>
                    <form onSubmit={handleSkuSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Ketik SKU atau nama produk untuk ditambahkan..."
                                value={skuInput}
                                onChange={e => setSkuInput(e.target.value)}
                                onFocus={() => {
                                    if (skuInput.trim().length >= 2) setShowSuggestions(true);
                                }}
                                className="pl-12 pr-10 h-12 text-base rounded-xl border-gray-300 focus-visible:ring-red-500"
                                autoComplete="off"
                            />
                            {skuInput && (
                                <button
                                    type="button"
                                    onClick={() => { setSkuInput(""); setShowSuggestions(false); }}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" disabled={isSearching || !skuInput} variant="red" className="h-12 px-6 rounded-xl font-medium shadow-sm hover:shadow-md transition-all">
                            {isSearching ? "Mencari..." : "Tambah Produk"}
                        </Button>
                    </form>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (suggestions.length > 0 || isSearchingSuggestions) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto overflow-x-hidden">
                            {isSearchingSuggestions && (
                                <div className="p-6 text-center text-sm text-gray-400 flex flex-col items-center justify-center gap-3">
                                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    Mencari produk...
                                </div>
                            )}
                            {!isSearchingSuggestions && suggestions.length === 0 && (
                                <div className="p-6 text-center text-sm text-gray-400">
                                    Produk tidak ditemukan
                                </div>
                            )}
                            {!isSearchingSuggestions && suggestions.map((suggestion) => {
                                const priceInfo = getPriceInfo(suggestion.price, suggestion.category || null, suggestion.availableToSell);
                                return (
                                    <button
                                        key={suggestion.id}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 group"
                                    >
                                        <div className="w-12 h-12 bg-white border border-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden text-[10px] flex items-center justify-center text-gray-400">
                                            {suggestion.image ? (
                                                <Image src={suggestion.image} alt={suggestion.name} fill className="object-contain p-1" />
                                            ) : "No Img"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{suggestion.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">SKU: {suggestion.sku}</p>
                                                <span className={\`text-[10px] font-medium px-2 py-0.5 rounded-full \${suggestion.availableToSell > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}\`}>
                                                    {suggestion.availableToSell > 0 ? \`Ready: \${suggestion.availableToSell}\` : 'Indent'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                {priceInfo.hasDiscount && priceInfo.isCustomerDiscount && (
                                                    <span className="text-xs text-gray-400 line-through leading-tight">
                                                        Rp {priceInfo.originalPriceWithPPN.toLocaleString("id-ID")}
                                                    </span>
                                                )}
                                                <p className="text-sm font-bold text-red-600">Rp {priceInfo.discountedPriceWithPPN.toLocaleString("id-ID")}</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Product Table */}
                {items.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={items.map(i => i.customId)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                        <colgroup>
                                            <col style={{ width: '4%' }} />
                                            <col style={{ width: '32%' }} />
                                            <col style={{ width: '16%' }} />
                                            <col style={{ width: '12%' }} />
                                            <col style={{ width: '14%' }} />
                                            <col style={{ width: '16%' }} />
                                            <col style={{ width: '6%' }} />
                                        </colgroup>
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="w-[4%]"></th>
                                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produk</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Harga Satuan</th>
                                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                                                <th className="px-4 py-3.5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {items.map((item) => (
                                                <SortableRow
                                                    key={item.customId}
                                                    item={item}
                                                    updateQty={updateQty}
                                                    removeItem={removeItem}
                                                    isLoggedIn={isLoggedIn}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">Daftar pesanan masih kosong</p>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto">Cari produk menggunakan pencarian di atas atau unggah file Excel di panel samping.</p>
                    </div>
                )}
            </div>

            {/* Right Column: Excel Import & Summary */}
            <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-4 lg:sticky lg:top-24">
                
                {/* Excel Import Panel */}
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={\`bg-white rounded-2xl border-2 transition-all p-5 shadow-sm \${isDragging
                        ? "border-emerald-500 border-dashed bg-emerald-50/50 scale-[1.02] shadow-emerald-100"
                        : "border-gray-200 border-solid"
                        }\`}
                >
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-base">Impor via Excel</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                        Masukkan daftar produk dalam jumlah besar dengan format Excel (.xlsx, .csv).
                    </p>
                    
                    <div className="space-y-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            {isUploading ? "Memproses Data..." : "Pilih File Excel"}
                        </button>
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleExcelUpload}
                        />
                        <button
                            onClick={downloadTemplate}
                            className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-4 h-4 text-gray-400" />
                            Unduh Template
                        </button>
                    </div>
                    
                    {isDragging ? (
                        <p className="text-xs text-center text-emerald-600 font-medium mt-4 animate-pulse">
                            Lepaskan file di sini...
                        </p>
                    ) : (
                        <p className="text-xs text-center text-gray-400 mt-4 italic">
                            * Atau tarik & drop file ke area ini
                        </p>
                    )}
                </div>

                {/* Summary Panel */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 text-base">Ringkasan Pesanan</h3>
                    
                    <div className="space-y-3.5 mb-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total Macam Item</span>
                            <span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md">{items.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total Kuantitas</span>
                            <span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md">{totalQty}</span>
                        </div>
                        <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-1">
                            <div className="flex justify-between items-end">
                                <span className="text-gray-900 font-bold">Total</span>
                                <span className="font-black text-red-600 text-xl tracking-tight">
                                    Rp {totalAmount.toLocaleString("id-ID")}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 text-right">* Sudah termasuk PPN 11%</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            size="lg"
                            variant="red"
                            onClick={handleAddToCart}
                            disabled={items.length === 0}
                            className="w-full gap-2 h-12 rounded-xl shadow-lg shadow-red-100 font-bold text-base transition-all hover:shadow-red-200"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Masukkan Keranjang
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={downloadPDF}
                                disabled={items.length === 0}
                                className="inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <FileDown className="w-4 h-4 text-red-500" />
                                Est. PDF
                            </button>
                            <button
                                onClick={downloadExcel}
                                disabled={items.length === 0}
                                className="inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                                Est. Excel
                            </button>
                        </div>

                        {items.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="w-full inline-flex justify-center items-center gap-1.5 px-3 py-2 mt-2 rounded-lg text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Bersihkan Daftar
                            </button>
                        )}
                    </div>
                </div>
            </div>
`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(file, content);
console.log("Replaced successfully!");
