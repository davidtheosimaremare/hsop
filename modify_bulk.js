const fs = require('fs');
const file = 'src/components/bulk-order/BulkOrderClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update interface
content = content.replace(
    '    isCustom?: boolean;\n}',
    '    isCustom?: boolean;\n    isNotFound?: boolean;\n}'
);

// 2. Add state for Tabs
const stateInjection = `    const [activeTab, setActiveTab] = useState<'search' | 'paste'>('search');
    const [pasteContent, setPasteContent] = useState("");
    const [isProcessingPaste, setIsProcessingPaste] = useState(false);`;

content = content.replace(
    '    const [skuInput, setSkuInput] = useState("");',
    `    const [skuInput, setSkuInput] = useState("");\n${stateInjection}`
);

// 3. Update addItemToList signature
content = content.replace(
    '    const addItemToList = (product: BulkOrderProduct, qty: number, isCustom: boolean = false) => {',
    '    const addItemToList = (product: BulkOrderProduct, qty: number, isCustom: boolean = false, isNotFound: boolean = false) => {'
);

// Update addItemToList logic to handle isNotFound
content = content.replace(
    `            if (isCustom) {
                // Custom products are always "Indent" as they aren't in DB
                const customId = \`custom-\${product.sku}\`;`,
    `            if (isCustom) {
                // Custom products are always "Indent" as they aren't in DB
                const customId = isNotFound ? \`not-found-\${product.sku}\` : \`custom-\${product.sku}\`;`
);

content = content.replace(
    `                    itemsToAdd.push({
                        ...product,
                        qty,
                        finalPrice: Math.ceil((product.price * 1.11) / 1000) * 1000, // Manual price + PPN for custom, rounded up to nearest thousand
                        hasDiscount: false,
                        stockStatus: 'INDENT',
                        customId,
                        isCustom: true
                    });`,
    `                    itemsToAdd.push({
                        ...product,
                        qty,
                        finalPrice: Math.ceil((product.price * 1.11) / 1000) * 1000, // Manual price + PPN for custom, rounded up to nearest thousand
                        hasDiscount: false,
                        stockStatus: 'INDENT',
                        customId,
                        isCustom: true,
                        isNotFound
                    });`
);

// 4. Add handleProcessPaste before handleExcelUpload
const pasteLogic = `
    const handleProcessPaste = async () => {
        if (!pasteContent.trim()) return;
        setIsProcessingPaste(true);
        
        const rawSkus = pasteContent.split(/[\\n,]+/).map(s => s.trim()).filter(Boolean);
        if (rawSkus.length === 0) {
            setIsProcessingPaste(false);
            return;
        }
        
        const skuMap = new Map<string, number>();
        rawSkus.forEach(sku => {
            const cleanSku = sku.toLowerCase();
            skuMap.set(cleanSku, (skuMap.get(cleanSku) || 0) + 1);
        });
        
        const uniqueSkus = Array.from(skuMap.keys());
        
        try {
            const products = await searchProductsBySkus(uniqueSkus);
            const foundSkus = new Set(products.map(p => p.sku.toLowerCase()));
            
            // Add found products
            products.forEach(p => {
                const qty = skuMap.get(p.sku.toLowerCase()) || 1;
                addItemToList(p, qty);
            });
            
            // Add NOT FOUND products
            uniqueSkus.forEach(sku => {
                if (!foundSkus.has(sku)) {
                    const qty = skuMap.get(sku) || 1;
                    const notFoundProduct: BulkOrderProduct = {
                        id: \`not-found-\${Date.now()}-\${sku}\`,
                        sku: sku,
                        name: "Tidak Ditemukan",
                        price: 0,
                        image: null,
                        availableToSell: 0,
                        brand: "-",
                        category: "Not Found",
                        isValid: false
                    };
                    addItemToList(notFoundProduct, qty, true, true);
                }
            });
            
            setPasteContent("");
            setActiveTab('search');
        } catch (error) {
            console.error("Paste error", error);
            alert("Terjadi kesalahan saat memproses SKU.");
        } finally {
            setIsProcessingPaste(false);
        }
    };
`;
content = content.replace(
    '    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {',
    `${pasteLogic}\n    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {`
);

// 5. Update downloads and add to cart to ignore isNotFound
content = content.replace(
    'items: items.map(item => ({',
    'items: items.filter(i => !i.isNotFound).map(item => ({'
); // for downloadPDF
content = content.replace(
    'items: items.map(item => ({',
    'items: items.filter(i => !i.isNotFound).map(item => ({'
); // for downloadExcel

content = content.replace(
    '    const handleAddToCart = () => {\n        items.forEach(item => {',
    '    const handleAddToCart = () => {\n        items.filter(i => !i.isNotFound).forEach(item => {'
);


// 6. Fix UI replacements
const uiStart = '<div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm relative" ref={searchContainerRef}>';
const uiEnd = '{/* Product Table */}';

const uiReplacement = `                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative" ref={searchContainerRef}>
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
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
                    </div>

                    {activeTab === 'search' ? (
                        <form onSubmit={handleSkuSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Ketik SKU atau nama produk untuk ditambahkan..."
                                    value={skuInput}
                                    onChange={e => setSkuInput(e.target.value)}
                                    onFocus={() => {
                                        if (skuInput.trim().length >= 2) setShowSuggestions(true);
                                    }}
                                    className="pl-9 pr-8 h-10 text-sm rounded-lg border-gray-300 focus-visible:ring-red-500"
                                    autoComplete="off"
                                />
                                {skuInput && (
                                    <button
                                        type="button"
                                        onClick={() => { setSkuInput(""); setShowSuggestions(false); }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <Button type="submit" disabled={isSearching || !skuInput} variant="red" className="h-10 px-4 rounded-lg font-medium shadow-sm hover:shadow-md transition-all text-sm">
                                {isSearching ? "Mencari..." : "Tambah"}
                            </Button>
                        </form>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <textarea
                                value={pasteContent}
                                onChange={e => setPasteContent(e.target.value)}
                                placeholder="Paste daftar SKU di sini (pisahkan dengan koma atau baris baru)...&#10;Contoh:&#10;SKU-A&#10;SKU-B&#10;SKU-C"
                                className="w-full h-32 p-3 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                            />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-400 italic">*SKU yang tidak ditemukan akan ditandai</p>
                                <Button 
                                    onClick={handleProcessPaste} 
                                    disabled={isProcessingPaste || !pasteContent.trim()} 
                                    variant="red" 
                                    className="h-10 px-6 rounded-lg font-medium text-sm shadow-sm"
                                >
                                    {isProcessingPaste ? "Memproses..." : "Submit List"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Suggestions Dropdown */}
                    {activeTab === 'search' && showSuggestions && (suggestions.length > 0 || isSearchingSuggestions) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-80 overflow-y-auto overflow-x-hidden">
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
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 group"
                                    >
                                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden text-[10px] flex items-center justify-center text-gray-400">
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
                                            <div className="flex items-center gap-2 mt-1">
                                                {priceInfo.hasDiscount && priceInfo.isCustomerDiscount && (
                                                    <span className="text-xs text-gray-400 line-through leading-tight">
                                                        Rp {priceInfo.originalPriceWithPPN.toLocaleString("id-ID")}
                                                    </span>
                                                )}
                                                <p className="text-xs font-bold text-red-600">Rp {priceInfo.discountedPriceWithPPN.toLocaleString("id-ID")}</p>
                                            </div>
                                        </div>
                                        <div className="w-7 h-7 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                `;
                
let sIdx = content.indexOf(uiStart);
let eIdx = content.indexOf(uiEnd);
if(sIdx > -1 && eIdx > -1) {
    content = content.substring(0, sIdx) + uiReplacement + content.substring(eIdx);
}

// Compact layout
content = content.replace('w-full lg:w-[340px]', 'w-full lg:w-[280px]'); // make sidebar smaller
content = content.replace(/px-4 py-3\.5/g, 'px-3 py-2.5'); // compact table headers
content = content.replace(/px-4 py-3/g, 'px-3 py-2'); // compact row cells
content = content.replace('className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm relative"', 'className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative"');

// 7. Update SortableRow for isNotFound
const rowStart = '            {/* Product */}';
const rowEnd = '            {/* Price — fixed width, no layout shift */}';

const rowRepl = `            {/* Product */}
            <td className="px-3 py-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                        {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Img</div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className={\`font-medium text-sm line-clamp-1 \${item.isNotFound ? 'text-red-500' : 'text-gray-900'}\`}>{item.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">SKU: {item.sku}</p>
                    </div>
                </div>
            </td>

            {/* Price — fixed width, no layout shift */}`;

sIdx = content.indexOf(rowStart);
eIdx = content.indexOf(rowEnd);
if(sIdx > -1 && eIdx > -1) {
    content = content.substring(0, sIdx) + rowRepl + content.substring(eIdx);
}

content = content.replace(
    `                            {item.isCustom && (
                                <span className="text-[10px] text-gray-400">Produk Kustom</span>
                            )}`,
    `                            {item.isNotFound ? (
                                <span className="text-[10px] text-red-500 font-bold">Tidak Tersedia</span>
                            ) : item.isCustom && (
                                <span className="text-[10px] text-gray-400">Produk Kustom</span>
                            )}`
);

fs.writeFileSync(file, content);
console.log("Modifications complete.");
