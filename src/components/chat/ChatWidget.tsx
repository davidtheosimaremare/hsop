"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
    MessageCircle,
    X,
    Send,
    Paperclip,
    ChevronDown,
    Bot,
    Package,
    FileText,
    ShoppingCart,
    Check,
    Loader2,
} from "lucide-react";
import ChatProductCard, { ChatProduct } from "./ChatProductCard";
import { useCart } from "@/lib/useCart";
import { UIMessage } from "ai";

interface ChatWidgetProps {
    phoneNumber?: string;
    message?: string;
    customerId?: string | null;
}

interface BomItem {
    requestedSku: string;
    qty: number;
    found: boolean;
    product: ChatProduct | null;
}

interface BomResult {
    success: boolean;
    parseMethod: string;
    fileName: string;
    totalExtracted: number;
    foundCount: number;
    notFoundCount: number;
    hasCustomerPricing: boolean;
    grandTotal: number;
    grandTotalDisplay: string;
    items: BomItem[];
}

// Extract text content from message parts
function getMessageText(msg: UIMessage): string {
    return msg.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text || "")
        .join("");
}

// Parse product results from tool call parts
function parseProductsFromMessage(msg: UIMessage): ChatProduct[] | null {
    try {
        if (msg.toolInvocations && Array.isArray(msg.toolInvocations)) {
            for (const tool of msg.toolInvocations) {
                if (tool.state === "result") {
                    const result = tool.result;
                    if (result?.products && Array.isArray(result.products) && result.found) {
                        return result.products as ChatProduct[];
                    }
                    if (result?.product && result.found) {
                        return [result.product as ChatProduct];
                    }
                }
            }
        }
    } catch {}
    return null;
}

// Parse external Siemens results from tool parts
function parseExternalFromMessage(msg: UIMessage): any[] | null {
    try {
        if (msg.toolInvocations && Array.isArray(msg.toolInvocations)) {
            for (const tool of msg.toolInvocations) {
                if (tool.state === "result") {
                    const result = tool.result;
                    if (result?.source?.includes("Siemens") && result.found && result.products) {
                        return result.products;
                    }
                }
            }
        }
    } catch {}
    return null;
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1 px-1">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
                />
            ))}
        </div>
    );
}

function BomResultPanel({
    result,
    onAddAll,
}: {
    result: BomResult;
    onAddAll: (items: BomItem[]) => void;
}) {
    const [addedAll, setAddedAll] = useState(false);
    const foundItems = result.items.filter((i) => i.found && i.product);

    const handleAddAll = () => {
        onAddAll(foundItems);
        setAddedAll(true);
        setTimeout(() => setAddedAll(false), 2000);
    };

    return (
        <div className="space-y-3 mt-2">
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-800 mb-1">📄 {result.fileName}</p>
                <div className="flex items-center gap-3 text-xs text-blue-700">
                    <span>✅ {result.foundCount} ditemukan</span>
                    {result.notFoundCount > 0 && (
                        <span className="text-orange-600">⚠️ {result.notFoundCount} tidak ada</span>
                    )}
                </div>
                {result.grandTotal > 0 && (
                    <p className="text-xs font-bold text-blue-900 mt-1.5">
                        Total: {result.grandTotalDisplay}
                        {result.hasCustomerPricing && (
                            <span className="text-[10px] text-blue-600 ml-1">(harga diskon)</span>
                        )}
                    </p>
                )}
            </div>

            {/* Product cards */}
            {foundItems.length > 0 && (
                <div className="space-y-2">
                    {foundItems.map((item, idx) => (
                        <ChatProductCard
                            key={idx}
                            product={{ ...item.product!, qty: item.qty }}
                            showQty={true}
                        />
                    ))}
                    {foundItems.length > 1 && (
                        <button
                            onClick={handleAddAll}
                            className={`w-full h-9 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 ${
                                addedAll
                                    ? "bg-green-500 text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                        >
                            {addedAll ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Semua Ditambahkan!
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="w-4 h-4" />
                                    Tambah Semua ke Keranjang ({foundItems.length} produk)
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Not found items */}
            {result.items.filter((i) => !i.found).length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-orange-800 mb-1.5">
                        ⚠️ Kode tidak ditemukan di database:
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {result.items
                            .filter((i) => !i.found)
                            .map((item, idx) => (
                                <span
                                    key={idx}
                                    className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-mono"
                                >
                                    {item.requestedSku} ×{item.qty}
                                </span>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Component to handle expanding product lists
function ProductListWithToggle({ products }: { products: ChatProduct[] }) {
    const [showAll, setShowAll] = useState(false);
    const displayedProducts = showAll ? products : products.slice(0, 3);
    const hiddenCount = products.length - 3;

    return (
        <div className="space-y-2 mt-1">
            {displayedProducts.map((product, pIdx) => (
                <ChatProductCard key={pIdx} product={product} />
            ))}
            {hiddenCount > 0 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 flex items-center justify-center gap-1"
                >
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAll ? "rotate-180" : ""}`} />
                    {showAll ? "Tampilkan Lebih Sedikit" : `Lihat Semua (${hiddenCount} produk lainnya)`}
                </button>
            )}
        </div>
    );
}

// Welcome message (static, not from AI SDK)
const WELCOME_ID = "welcome-static";

export default function ChatWidget({
    phoneNumber = "6281234567890",
    message = "Halo Admin Hokiindo, saya mau tanya tentang produk...",
    customerId = null,
}: ChatWidgetProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [bomResult, setBomResult] = useState<BomResult | null>(null);
    const [bomMessageId, setBomMessageId] = useState<string | null>(null);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { addItem } = useCart();

    const { messages, append: sendMessage, status, setMessages } = useChat({
        api: "/api/chat",
        id: "hokiindo-ai-chat",
        body: { customerId },
        maxSteps: 5,
    } as any);

    const isLoading = status === "streaming" || status === "submitted";

    // Auto scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        if (isOpen) setTimeout(scrollToBottom, 100);
    }, [messages, isOpen, scrollToBottom]);

    const handleScroll = useCallback(() => {
        const c = scrollContainerRef.current;
        if (!c) return;
        setShowScrollDown(c.scrollHeight - c.scrollTop - c.clientHeight > 80);
    }, []);

    const handleWhatsApp = () => {
        const clean = phoneNumber.replace(/\D/g, "");
        window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, "_blank");
    };

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || isLoading) return;
        setInputText("");
        await sendMessage({ text });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Handle file upload
    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        setBomResult(null);

        // Add user message
        const msgId = `file-${Date.now()}`;
        setMessages((prev) => [
            ...prev,
            {
                id: msgId,
                role: "user",
                parts: [{ type: "text", text: `📎 Upload file: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)\n\nTolong analisis kode produk dan ketersediaannya.` }],
            } as any,
        ]);

        try {
            const formData = new FormData();
            formData.append("file", file);
            if (customerId) formData.append("customerId", customerId);

            const res = await fetch("/api/chat/upload", { method: "POST", body: formData });
            const data: BomResult = await res.json();

            if (!res.ok) throw new Error((data as any).error || "Gagal memproses file");

            setBomResult(data);
            const aiId = `ai-file-${Date.now()}`;
            setBomMessageId(aiId);

            const aiText = data.success
                ? `✅ Berhasil membaca **${file.name}**!\n\nSaya menemukan **${data.totalExtracted}** kode produk — **${data.foundCount}** tersedia di database kami${data.notFoundCount > 0 ? `, ${data.notFoundCount} tidak ditemukan` : ""}.\n\n${data.grandTotal > 0 ? `💰 **Total estimasi: ${data.grandTotalDisplay}**${data.hasCustomerPricing ? " (harga khusus Anda)" : ""}\n\n` : ""}Berikut detail produk yang saya temukan:`
                : `⚠️ Tidak ada kode produk yang berhasil diekstrak. Pastikan file berisi kolom SKU/Part Number.`;

            setMessages((prev) => [
                ...prev,
                {
                    id: aiId,
                    role: "assistant",
                    parts: [{ type: "text", text: aiText }],
                } as any,
            ]);
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    parts: [{ type: "text", text: `❌ Maaf, terjadi kesalahan: ${err.message}. Silakan coba lagi.` }],
                } as any,
            ]);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddAllBom = (items: BomItem[]) => {
        for (const item of items) {
            if (item.found && item.product) {
                addItem(
                    {
                        id: item.product.id,
                        sku: item.product.sku,
                        name: item.product.name,
                        brand: item.product.brand || "",
                        price: item.product.unitPrice || item.product.finalPrice || 0,
                        image: item.product.image,
                        availableToSell: item.product.availableToSell,
                    },
                    item.qty
                );
            }
        }
    };

    const quickActions = [
        { label: "🔍 Cari MCB Siemens", value: "Cari MCB Siemens terbaru" },
        { label: "📦 Stok Contactor", value: "Ada Contactor 3RT Siemens?" },
        { label: "📋 Info produk", value: "Jelaskan produk dengan SKU 5SL6116-7" },
    ];

    if (pathname?.startsWith("/admin")) return null;

    return (
        <>
            {/* ========== CHAT PANEL ========== */}
            <div
                className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] max-w-[420px] flex flex-col rounded-2xl shadow-2xl bg-white border border-gray-200 transition-all duration-300 origin-bottom-right ${
                    isOpen
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-90 pointer-events-none"
                }`}
                style={{ maxHeight: "calc(100vh - 120px)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-tight">Hokiindo AI</p>
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                <p className="text-[10px] text-red-100">Online sekarang</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Messages */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth"
                    style={{ minHeight: "220px" }}
                >
                    {/* Static welcome message */}
                    <div className="flex justify-start">
                        <div className="max-w-[88%] space-y-2">
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                    <Bot className="w-3 h-3 text-red-600" />
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium">Hokiindo AI</span>
                            </div>
                            <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-3 py-2.5 text-xs leading-relaxed">
                                <p>Halo! 👋 Saya <strong>Hokiindo AI Assistant</strong>.</p>
                                <p className="mt-1">Saya bisa membantu Anda:</p>
                                <ul className="mt-1 space-y-0.5 ml-1">
                                    <li>🔍 Mencari produk Siemens Electrical</li>
                                    <li>📋 Informasi detail & spesifikasi produk</li>
                                    <li>📄 Baca file BOM (Excel/PDF/Gambar)</li>
                                    <li>📦 Cek status pesanan</li>
                                </ul>
                                <p className="mt-1.5">Ada yang bisa saya bantu?</p>
                            </div>
                            {/* Quick actions */}
                            <div className="flex flex-wrap gap-1.5">
                                {quickActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setInputText(action.value);
                                            setTimeout(() => {
                                                if (!isLoading) sendMessage({ text: action.value });
                                                setInputText("");
                                            }, 10);
                                        }}
                                        className="text-[11px] px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full transition-colors font-medium"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic messages from AI SDK */}
                    {messages.map((msg, index) => {
                        const isUser = msg.role === "user";
                        const textContent = getMessageText(msg);
                        const products = !isUser ? parseProductsFromMessage(msg) : null;
                        const externalResults = !isUser ? parseExternalFromMessage(msg) : null;
                        const isBomResult =
                            !isUser &&
                            bomResult &&
                            msg.id === bomMessageId;

                        return (
                            <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[88%] space-y-2">
                                    {!isUser && (
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                                <Bot className="w-3 h-3 text-red-600" />
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium">Hokiindo AI</span>
                                        </div>
                                    )}
                                    {textContent && (
                                        <div
                                            className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                                isUser
                                                    ? "bg-red-600 text-white rounded-tr-sm"
                                                    : "bg-gray-100 text-gray-800 rounded-tl-sm"
                                            }`}
                                        >
                                            <MessageContent 
                                                content={
                                                    !isUser && products && products.length > 0
                                                        ? textContent.replace(/(?:\d+\.\s.*|\[Lihat produk\].*|Harga:.*|Stok:.*|https?:\/\/[^\s]+)/gi, "").trim() || "Saya menemukan beberapa produk untuk Anda. Silakan lihat daftarnya di bawah ini."
                                                        : textContent
                                                } 
                                            />
                                        </div>
                                    )}
                                    {/* Product cards */}
                                    {products && products.length > 0 && (
                                        <ProductListWithToggle products={products} />
                                    )}
                                    {/* External Siemens results */}
                                    {externalResults && externalResults.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-1">
                                            <p className="text-[10px] font-semibold text-blue-700 mb-2">
                                                🔗 Referensi dari Siemens iMall:
                                            </p>
                                            {externalResults.map((item: any, idx: number) => (
                                                <a
                                                    key={idx}
                                                    href={item.url || "#"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 py-1.5 hover:bg-blue-100 rounded-lg px-1 transition-colors"
                                                >
                                                    <Package className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[11px] font-medium text-blue-800 font-mono">
                                                            {item.sku}
                                                        </p>
                                                        {item.name && (
                                                            <p className="text-[10px] text-blue-600 line-clamp-1">
                                                                {item.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {/* BOM Result */}
                                    {isBomResult && bomResult && (
                                        <BomResultPanel result={bomResult} onAddAll={handleAddAllBom} />
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Loading indicator */}
                    {(isLoading || isUploading) && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                                <TypingDots />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll down button */}
                {showScrollDown && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-20 right-3 w-7 h-7 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                    >
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                )}

                {/* Input Area */}
                <div className="border-t border-gray-100 px-3 py-2.5 flex-shrink-0 bg-white rounded-b-2xl">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <p className="text-[10px] text-gray-400">
                            Upload BOM: PDF, Excel (.xlsx), atau Gambar
                        </p>
                    </div>
                    <div className="flex items-end gap-2">
                        {/* File Upload */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || isLoading}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-40"
                            title="Upload file BOM"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                            ) : (
                                <Paperclip className="w-4 h-4 text-gray-500" />
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                                e.target.value = "";
                            }}
                        />
                        {/* Text input */}
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ketik pesan atau tanya produk..."
                            rows={1}
                            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all max-h-24 overflow-y-auto"
                            style={{ minHeight: "36px" }}
                            disabled={isLoading || isUploading}
                        />
                        {/* Send */}
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim() || isLoading || isUploading}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-200 flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
                        >
                            <Send className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ========== FAB BUTTONS ========== */}
            <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-2">
                {/* WhatsApp (shown only when chat is closed) */}
                {!isOpen && (
                    <button
                        onClick={handleWhatsApp}
                        className="flex items-center gap-2 px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 text-xs font-medium"
                        title="Chat WhatsApp"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        WhatsApp
                    </button>
                )}

                {/* AI Chat Toggle */}
                <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
                        isOpen ? "bg-gray-700 hover:bg-gray-800" : "bg-red-600 hover:bg-red-700"
                    }`}
                    title={isOpen ? "Tutup chat" : "Buka Hokiindo AI Assistant"}
                >
                    {isOpen ? (
                        <X className="w-6 h-6 text-white" />
                    ) : (
                        <>
                            <MessageCircle className="w-6 h-6 text-white" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <span className="text-[7px] text-white font-bold">AI</span>
                            </span>
                        </>
                    )}
                </button>
            </div>
        </>
    );
}

// Render basic markdown bold + newlines
function MessageContent({ content }: { content: string }) {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return part.split("\n").map((line, j, arr) => (
                    <React.Fragment key={`${i}-${j}`}>
                        {line}
                        {j < arr.length - 1 && <br />}
                    </React.Fragment>
                ));
            })}
        </>
    );
}
