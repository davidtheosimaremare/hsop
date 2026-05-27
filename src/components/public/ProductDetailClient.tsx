"use client";

import { useState, useRef } from "react";
import { 
    Share2, Minus, Plus, ShoppingCart, MessageCircle, 
    ChevronLeft, ChevronRight, Copy, FileDown, Check, 
    Percent, Clock, Shield, Sparkles, X, ZoomIn, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ShareButton from "./ShareButton";
import { getProductSlug, cn, formatRichText } from "@/lib/utils";
import { useCart } from "@/lib/useCart";
import { usePricing } from "@/lib/PricingContext";
import AdminProductFloatingBar from "./AdminProductFloatingBar";

type TabType = "specs" | "description";

interface ProductDetailClientProps {
    product: any; // Using any for Prisma Product type for simplicity in client component
    relatedProducts: any[];
    whatsappConfig?: Record<string, string> | null;
}

export default function ProductDetailClient({ product, relatedProducts, whatsappConfig }: ProductDetailClientProps) {
    const [activeTab, setActiveTab] = useState<TabType>("description");
    const [quantity, setQuantity] = useState(1);
    const [isAdded, setIsAdded] = useState(false);
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    
    const sliderRef = useRef<HTMLDivElement>(null);
    const { addItem } = useCart();
    const { getPriceInfo } = usePricing();

    const handleChatSales = () => {
        const waNumber = whatsappConfig?.number || "6281262220021"; // Fallback to footer/default
        const waMessage = whatsappConfig?.message || "Halo Admin, saya ingin bertanya tentang produk:";
        const productUrl = window.location.href;
        const fullMessage = `${waMessage}\n\n*${product.name}*\nSKU: ${product.sku}\nLink: ${productUrl}`;

        window.open(`https://wa.me/${waNumber.replace(/\+/g, '')}?text=${encodeURIComponent(fullMessage)}`, "_blank");
    };

    // Setup gallery images
    const galleryImages = [
        product.image,
        ...(product.sliderImages || [])
    ].filter(Boolean) as string[];

    const [activeImage, setActiveImage] = useState(galleryImages[0] || null);

    // Calculate price info
    // Standard price (mixed logic dependent on stock)
    const priceInfo = getPriceInfo(product.price, product.category || null, product.availableToSell, product.brand || null);

    // Explicit prices for split scenario
    const readyPriceInfo = getPriceInfo(product.price, product.category || null, 100, product.brand || null); // Force ready
    const indentPriceInfo = getPriceInfo(product.price, product.category || null, 0, product.brand || null); // Force indent

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID").format(Math.round(price));
    };

    const scrollRelated = (direction: "left" | "right") => {
        if (sliderRef.current) {
            const scrollAmount = 280;
            sliderRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    // Parse specifications if they exist
    const specs = product.specifications
        ? (typeof product.specifications === 'string'
            ? JSON.parse(product.specifications)
            : product.specifications)
        : {};

    // If specs is an object, convert to array for display
    const specsArray = Object.entries(specs).map(([key, value]) => ({
        label: key,
        value: String(value)
    }));

    // Helper to dynamically extract bullet points from technical descriptions
    const parseDescriptionToBullets = (htmlOrText: string) => {
        if (!htmlOrText) return [];
        // Strip HTML tags to process clean text
        const cleanText = htmlOrText.replace(/<[^>]*>/g, '').trim();
        
        // Split text by technical separators like semicolons, periods, or commas with keywords
        const sentences = cleanText
            .split(/(?:;|\. |, according to |, with |, containing |, featuring |, optimized for | wherein )+/i)
            .map(s => s.trim())
            .filter(s => s.length > 5 && !s.toLowerCase().includes("tidak ada deskripsi") && !s.toLowerCase().includes("selengkapnya"));
        
        // Return unique technical highlights
        return Array.from(new Set(sentences)).slice(0, 10);
    };

    const descriptionBullets = parseDescriptionToBullets(product.description || "");

    // Update add to cart to use discounted price
    const handleAddToCart = () => {
        const stock = product.availableToSell || 0;
        const pricesEqual = readyPriceInfo.discountedPriceWithPPN === indentPriceInfo.discountedPriceWithPPN;

        // Scenario: Prices are equal (merge logic)
        if (pricesEqual) {
            addItem({
                id: product.id,
                sku: product.sku,
                name: product.name,
                brand: product.brand || '',
                price: readyPriceInfo.discountedPriceWithPPN,
                originalPrice: readyPriceInfo.originalPriceWithPPN,
                image: product.image,
                availableToSell: stock,
                stockStatus: undefined, // No split status
                discountStr: readyPriceInfo.discountStr,
                isCustomerDiscount: readyPriceInfo.isCustomerDiscount,
                basePrice: product.price,
                category: product.category || null
            }, quantity);
        }
        // Scenario 1: Fully Ready (Non-equal prices or just logic)
        else if (stock > 0 && quantity <= stock) {
            addItem({
                id: `${product.id}-READY`, // Unique ID for ready item
                originalId: product.id,
                sku: product.sku,
                name: `${product.name} (Ready Stock)`,
                brand: product.brand || '',
                price: readyPriceInfo.discountedPriceWithPPN,
                originalPrice: readyPriceInfo.originalPriceWithPPN,
                image: product.image,
                availableToSell: stock,
                stockStatus: 'READY',
                discountStr: readyPriceInfo.discountStr,
                isCustomerDiscount: readyPriceInfo.isCustomerDiscount,
                basePrice: product.price,
                category: product.category || null
            }, quantity);
        }
        // Scenario 2: Fully Indent
        else if (stock === 0) {
            addItem({
                id: `${product.id}-INDENT`,
                originalId: product.id,
                sku: product.sku,
                name: `${product.name} (Indent (${product.indentTime || '12-16 Minggu'}))`,
                brand: product.brand || '',
                price: indentPriceInfo.discountedPriceWithPPN,
                originalPrice: indentPriceInfo.originalPriceWithPPN,
                image: product.image,
                availableToSell: 0,
                stockStatus: 'INDENT',
                discountStr: indentPriceInfo.discountStr,
                isCustomerDiscount: indentPriceInfo.isCustomerDiscount,
                basePrice: product.price,
                category: product.category || null
            }, quantity);
        }
        // Scenario 3: Mixed (Split)
        else {
            const readyQty = stock;
            const indentQty = quantity - stock;

            // Add Ready Bundle
            addItem({
                id: `${product.id}-READY`,
                originalId: product.id,
                sku: product.sku,
                name: `${product.name} (Ready Stock)`,
                brand: product.brand || '',
                price: readyPriceInfo.discountedPriceWithPPN,
                originalPrice: readyPriceInfo.originalPriceWithPPN,
                image: product.image,
                availableToSell: stock,
                stockStatus: 'READY',
                discountStr: readyPriceInfo.discountStr,
                isCustomerDiscount: readyPriceInfo.isCustomerDiscount,
                basePrice: product.price,
                category: product.category || null
            }, readyQty);

            // Add Indent Bundle
            addItem({
                id: `${product.id}-INDENT`,
                originalId: product.id,
                sku: product.sku,
                name: `${product.name} (Indent (${product.indentTime || '12-16 Minggu'}))`,
                brand: product.brand || '',
                price: indentPriceInfo.discountedPriceWithPPN,
                originalPrice: indentPriceInfo.originalPriceWithPPN,
                image: product.image,
                availableToSell: 0,
                stockStatus: 'INDENT',
                discountStr: indentPriceInfo.discountStr,
                isCustomerDiscount: indentPriceInfo.isCustomerDiscount,
                basePrice: product.price,
                category: product.category || null
            }, indentQty);
        }

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <>
            {/* Product Detail Grid - Top Premium Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left - Product Image Gallery (lg:col-span-4) */}
                <div className="lg:col-span-4 min-w-0">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs relative overflow-hidden flex flex-col">
                        
                        {/* Main Image View with Loupe Hover Zoom Interaction */}
                        <div 
                            onClick={() => setIsZoomOpen(true)}
                            className="aspect-square bg-slate-50/20 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden border border-slate-50 group cursor-zoom-in"
                            title="Klik untuk memperbesar gambar"
                        >
                            {activeImage ? (
                                <>
                                    <Image
                                        src={activeImage}
                                        alt={product.name}
                                        fill
                                        className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        priority
                                    />
                                    {/* Micro hover indicator badge */}
                                    <div className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <ZoomIn className="w-4 h-4" />
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full bg-slate-50/50 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    Tidak ada gambar
                                </div>
                            )}
                        </div>

                        {/* Thumbnails (Only show if more than 1 image exists) */}
                        {galleryImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2.5 mb-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {galleryImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={cn(
                                            "relative w-16 h-16 flex-shrink-0 rounded-xl border-2 overflow-hidden transition-all duration-200 shadow-2xs",
                                            activeImage === img 
                                                ? "border-red-500 bg-white scale-102" 
                                                : "border-slate-100 bg-slate-50/50 opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        <Image
                                            src={img}
                                            alt={`${product.name} thumbnail ${idx + 1}`}
                                            fill
                                            className="object-contain p-1"
                                            sizes="64px"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Elegant Share Button */}
                        <div className="border-t border-slate-50 pt-4 mt-2">
                            <ShareButton 
                                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-all border border-slate-100 shadow-2xs outline-none" 
                                text="Bagikan Halaman" 
                            />
                        </div>
                    </div>
                </div>

                {/* Middle - Premium Product Technical Details (lg:col-span-5) */}
                <div className="lg:col-span-5 flex flex-col min-w-0">
                    
                    {/* Brand Identifier */}
                    <div className="text-[10px] uppercase tracking-widest text-red-600 font-extrabold mb-1.5">
                        {product.brand || "SIEMENS"}
                    </div>

                    {/* Product Name with beautiful letter spacing & line height */}
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug uppercase mb-2 break-words">
                        {product.name}
                    </h1>

                    {/* Copy SKU Badge Wrapper - Thin with high contrast */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl py-1 px-3 w-fit mb-5 shadow-2xs select-none">
                        <span className="text-xs text-slate-400 font-normal tracking-wide">
                            SKU: <span className="text-slate-700 font-bold">{product.sku}</span>
                        </span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(product.sku);
                                const btn = document.getElementById("copy-sku-icon");
                                if (btn) {
                                    btn.classList.add("text-emerald-500");
                                    setTimeout(() => btn.classList.remove("text-emerald-500"), 1000);
                                }
                                const successMsg = document.getElementById("copy-success-msg");
                                if (successMsg) {
                                    successMsg.classList.remove("hidden");
                                    setTimeout(() => successMsg.classList.add("hidden"), 2000);
                                }
                            }}
                            className="p-1 hover:bg-slate-200/60 rounded-md transition-colors group relative"
                            title="Salin SKU"
                        >
                            <Copy id="copy-sku-icon" className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            <span className="sr-only">Salin SKU</span>
                        </button>
                        <span id="copy-success-msg" className="hidden text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold transition-opacity">
                            Tersalin!
                        </span>
                    </div>

                    {/* Direct Price - No box container for a premium, clean, spacious look */}
                    <div className="mb-5 select-none">
                        {readyPriceInfo.isHidden ? (
                            <div className="flex flex-col">
                                <p className="text-2xl font-extrabold text-red-600 tracking-tight italic">
                                    Harga Tersembunyi
                                </p>
                            </div>
                        ) : product.availableToSell > 0 ? (
                            readyPriceInfo.hasDiscount ? (
                                <div className="flex flex-col">
                                    {readyPriceInfo.isCustomerDiscount && (
                                        <span className="text-sm text-slate-400 line-through font-semibold mb-1">
                                            Rp {formatPrice(readyPriceInfo.originalPriceWithPPN)}
                                        </span>
                                    )}
                                    <p className="text-2xl font-extrabold text-red-600 tracking-tight">
                                        Rp {formatPrice(readyPriceInfo.discountedPriceWithPPN)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-2xl font-extrabold text-red-600 tracking-tight">
                                    Rp {formatPrice(readyPriceInfo.originalPriceWithPPN)}
                                </p>
                            )
                        ) : (
                            indentPriceInfo.hasDiscount ? (
                                <div className="flex flex-col">
                                    {indentPriceInfo.isCustomerDiscount && (
                                        <span className="text-sm text-slate-400 line-through font-semibold mb-1">
                                            Rp {formatPrice(indentPriceInfo.originalPriceWithPPN)}
                                        </span>
                                    )}
                                    <p className="text-2xl font-extrabold text-red-600 tracking-tight">
                                        Rp {formatPrice(indentPriceInfo.discountedPriceWithPPN)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-2xl font-extrabold text-red-600 tracking-tight">
                                    Rp {formatPrice(indentPriceInfo.originalPriceWithPPN)}
                                </p>
                            )
                        )}
                    </div>

                    {/* Highly Consistent Badges Panel with Icons */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {product.availableToSell > 0 ? (
                            <span className="text-[11px] px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold tracking-wide flex items-center gap-1.5 shadow-2xs select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Stok: {product.availableToSell} Unit
                            </span>
                        ) : (
                            <span className="text-[11px] px-3 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 font-bold tracking-wide flex items-center gap-1.5 shadow-2xs select-none">
                                <Clock className="w-3.5 h-3.5" />
                                Indent ({product.indentTime || '12-16 Minggu'})
                            </span>
                        )}
                        <span className="text-[11px] px-3 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 font-bold tracking-wide flex items-center gap-1.5 shadow-2xs select-none">
                            <Check className="w-3.5 h-3.5" />
                            Termasuk PPN 11%
                        </span>
                    </div>

                    {/* Premium Maron-firm Outline PDF Datasheet CTA to stand out as a document and have distinct look */}
                    <a
                        href={`https://mall.industry.siemens.com/teddatasheet/?format=PDF&mlfbs=${product.sku}&language=en&caller=SiePortal`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50/50 hover:bg-rose-50 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-black border-2 border-rose-200/80 hover:border-rose-300 shadow-2xs transition-all w-fit uppercase tracking-wider group mb-5"
                    >
                        <FileDown className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        Download Datasheet (PDF)
                    </a>

                    {/* Modern iOS Segmented Tab Navigation - Neat spacing with mb-4 */}
                    <div className="flex p-1 bg-slate-100/80 border border-slate-200/40 rounded-xl mb-4 max-w-sm select-none">
                        <button
                            onClick={() => setActiveTab("description")}
                            className={`flex-1 py-1.5 text-xs font-bold text-center rounded-lg transition-all duration-200 ${
                                activeTab === "description"
                                    ? "bg-white text-red-600 shadow-2xs"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Deskripsi Produk
                        </button>
                        <button
                            onClick={() => setActiveTab("specs")}
                            className={`flex-1 py-1.5 text-xs font-bold text-center rounded-lg transition-all duration-200 ${
                                activeTab === "specs"
                                    ? "bg-white text-red-600 shadow-2xs"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Informasi Produk
                        </button>
                    </div>

                    {/* Tab Contents - Highly optimized with line height */}
                    <div className="mt-2 min-h-[160px]">
                        {activeTab === "specs" ? (
                            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs select-none bg-white">
                                <div className="divide-y divide-slate-100">
                                    <div className="flex items-center px-4 py-2.5 bg-slate-50/30">
                                        <span className="w-1/3 flex-shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider">Merek</span>
                                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{product.brand || "SIEMENS"}</span>
                                    </div>
                                    <div className="flex items-center px-4 py-2.5 bg-white">
                                        <span className="w-1/3 flex-shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</span>
                                        <span className="text-xs font-semibold text-slate-700">{product.category || "-"}</span>
                                    </div>
                                    {specsArray.map((spec, idx) => (
                                        <div key={spec.label} className={`flex items-center px-4 py-2.5 ${idx % 2 === 0 ? 'bg-slate-50/20' : 'bg-white'}`}>
                                            <span className="w-1/3 flex-shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider capitalize">{spec.label.replace(/_/g, ' ')}</span>
                                            <span className="text-xs font-semibold text-slate-700">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs md:text-sm text-slate-600 leading-[1.75] prose prose-sm max-w-none font-medium product-description-container" dangerouslySetInnerHTML={{ __html: formatRichText(product.description) || "Tidak ada deskripsi." }} />
                        )}
                    </div>
                </div>

                {/* Right - Checkout Action Panel (lg:col-span-3) */}
                <div className="lg:col-span-3 min-w-0">
                    <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs hover:shadow-sm transition-all duration-300 relative overflow-hidden">
                        
                        {/* Premium Red Top Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600" />
                        
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Subtotal Pesanan</p>

                        {/* Dynamic Subtotal Calculation */}
                        {!readyPriceInfo.isHidden && (() => {
                            const stock = product.availableToSell || 0;
                            let total = 0;
                            const pricesEqual = readyPriceInfo.discountedPriceWithPPN === indentPriceInfo.discountedPriceWithPPN;

                            if (pricesEqual) {
                                total = readyPriceInfo.discountedPriceWithPPN * quantity;
                            } else if (stock > 0) {
                                if (quantity <= stock) {
                                    total = readyPriceInfo.discountedPriceWithPPN * quantity;
                                } else {
                                    total = (readyPriceInfo.discountedPriceWithPPN * stock) + (indentPriceInfo.discountedPriceWithPPN * (quantity - stock));
                                }
                            } else {
                                total = indentPriceInfo.discountedPriceWithPPN * quantity;
                            }

                            return (
                                <div className="flex flex-col mb-4">
                                    <p className="text-xl font-extrabold text-red-600 tracking-tight">
                                        Rp {formatPrice(total)}
                                    </p>
                                    {(!pricesEqual && quantity > stock && stock > 0) && (
                                        <span className="text-[10px] text-amber-600 mt-1 font-bold">
                                            *Harga campuran Ready & Indent
                                        </span>
                                    )}
                                </div>
                            );
                        })()}

                        {/* iOS Style Numeric Input Spinner */}
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Jumlah Pembelian</p>
                        <div className="flex items-center justify-between border border-slate-200/80 rounded-xl p-1 bg-slate-50/50 mb-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white active:bg-slate-100 hover:shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-transparent border border-transparent text-slate-600 font-bold"
                                disabled={quantity <= 1}
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                    let val = parseInt(e.target.value) || 1;
                                    val = Math.max(1, val);
                                    setQuantity(val);
                                }}
                                className="w-12 h-8 text-center text-xs font-black text-slate-800 bg-transparent border-0 focus:outline-none focus:ring-0"
                            />
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white active:bg-slate-100 hover:shadow-2xs transition-all bg-transparent border border-transparent text-slate-600 font-bold"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Premium Stock Breakdown Info Badge */}
                        {quantity > 0 && (
                            <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 select-none">
                                {(() => {
                                    const pricesEqual = readyPriceInfo.discountedPriceWithPPN === indentPriceInfo.discountedPriceWithPPN;
                                    const showPrice = !pricesEqual;

                                    return product.availableToSell > 0 ? (
                                        quantity <= product.availableToSell ? (
                                            <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <span>{quantity} unit (Ready) {showPrice && `@ ${formatPrice(readyPriceInfo.discountedPriceWithPPN)}`}</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span>{product.availableToSell} unit (Ready) {showPrice && `@ ${formatPrice(readyPriceInfo.discountedPriceWithPPN)}`}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-sky-600 font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                                                    <span>{quantity - product.availableToSell} unit (Indent ({product.indentTime || '12-16 Mgg'})) {showPrice && `@ ${formatPrice(indentPriceInfo.discountedPriceWithPPN)}`}</span>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex items-center gap-2 text-[10px] text-sky-600 font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                                            <span>Indent ({product.indentTime || '12-16 Mgg'}) {showPrice && `@ ${formatPrice(indentPriceInfo.discountedPriceWithPPN)}`}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* CTA Double Button Row */}
                        <div className="space-y-2 mt-4">
                            {readyPriceInfo.isHidden ? (
                                <a
                                    href={`https://wa.me/${readyPriceInfo.contactPhone?.replace(/[^0-9]/g, '')}?text=Halo,%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(product.name)}%20(SKU:%20${product.sku})`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full h-14 font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                    Hubungi Sales
                                </a>
                            ) : (
                                <>
                                    <Button
                                        className={cn(
                                            "w-full h-11 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-sm",
                                            isAdded 
                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100" 
                                                : "bg-red-600 hover:bg-red-700 text-white shadow-red-100/40 hover:shadow-md"
                                        )}
                                        onClick={handleAddToCart}
                                    >
                                        {isAdded ? (
                                            <>
                                                <Check className="w-4 h-4 animate-bounce" />
                                                Berhasil Ditambahkan
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-4 h-4" />
                                                Tambah Keranjang
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 text-xs font-black uppercase tracking-wider text-emerald-600 border-emerald-500/30 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-2xs group"
                                        onClick={handleChatSales}
                                    >
                                        <MessageCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                        Chat Sales
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Premium sidebar additional assurance info */}
                        <div className="border-t border-slate-100 pt-4 mt-4 space-y-2.5 text-[10px] font-semibold text-slate-500 select-none">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Shield className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                <span>Garansi Resmi</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                                <Sparkles className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                <span>100% Produk Original</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                                <MessageCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                <span>Layanan Dukungan Teknik (Technical Support)</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Long Rich-Text Description Section with higher, spacious line height for perfect readability */}
            {(product.longDescription && product.longDescription !== "<p></p>") && (
                <section className="mt-8 bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-full animate-pulse" />
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Deskripsi Produk Lengkap</h2>
                    </div>
                    <div
                        className="prose prose-sm md:prose-base max-w-none text-slate-700 leading-[1.75] font-medium rich-text-content"
                        dangerouslySetInnerHTML={{ __html: formatRichText(product.longDescription) }}
                    />
                </section>
            )}

            {/* Related Products Carousel */}
            {relatedProducts.length > 0 && (
                <section className="mt-10 select-none">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-full" />
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Produk Terkait</h2>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Link prefetch={false} href={`/pencarian?category=${encodeURIComponent(product.category || '')}`} className="text-xs font-black text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider mr-3">
                                Lihat Semua
                            </Link>
                            <button
                                onClick={() => scrollRelated("left")}
                                className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all shadow-2xs active:scale-95"
                            >
                                <ChevronLeft className="w-4.5 h-4.5 text-slate-500" />
                            </button>
                            <button
                                onClick={() => scrollRelated("right")}
                                className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all shadow-2xs active:scale-95"
                            >
                                <ChevronRight className="w-4.5 h-4.5 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    {/* Related Slider */}
                    <div
                        ref={sliderRef}
                        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                    >
                        {relatedProducts.map((relProduct, index) => {
                            const relPriceInfo = getPriceInfo(relProduct.price, relProduct.category || null, relProduct.availableToSell);

                            return (
                                <motion.div
                                    key={relProduct.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="group flex-shrink-0 w-52 bg-white rounded-2xl border border-slate-150 overflow-hidden hover:shadow-md hover:border-red-500/10 hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full shadow-2xs"
                                >
                                    <Link prefetch={false} href={`/produk/${getProductSlug(relProduct)}`} className="block h-full flex flex-col">
                                        
                                        {/* Product Image */}
                                        <div className="aspect-square bg-slate-50/30 relative p-3 transition-transform duration-500 group-hover:scale-102">
                                            {relProduct.image ? (
                                                <Image
                                                    src={relProduct.image}
                                                    alt={relProduct.name}
                                                    fill
                                                    className="object-contain p-3"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50">
                                                    <div className="w-3/4 h-3/4 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs uppercase font-extrabold tracking-widest">
                                                        No Image
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-3.5 flex-1 flex flex-col bg-white">
                                            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">{relProduct.brand || "SIEMENS"}</p>
                                            
                                            {/* Hover Expanding Tooltip Name */}
                                            <h3 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-red-600 transition-colors leading-tight min-h-[2.5em] uppercase mb-2" title={relProduct.name}>
                                                {relProduct.name}
                                            </h3>

                                            <div className="mt-auto mb-3">
                                                {relPriceInfo.hasDiscount ? (
                                                    <div className="flex flex-col">
                                                        {relPriceInfo.isCustomerDiscount && (
                                                            <span className="text-[10px] text-slate-400 line-through font-semibold">
                                                                Rp {formatPrice(relPriceInfo.originalPriceWithPPN)}
                                                            </span>
                                                        )}
                                                        <p className="text-sm font-black text-red-600">
                                                            Rp {formatPrice(relPriceInfo.discountedPriceWithPPN)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-black text-red-600">
                                                        Rp {formatPrice(relPriceInfo.originalPriceWithPPN)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Stock Status Badge */}
                                            <div className="flex flex-wrap gap-1 border-t border-slate-50 pt-2.5">
                                                {relProduct.availableToSell > 5 ? (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50 font-semibold tracking-wide flex items-center gap-1.5 select-none">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Stok: {relProduct.availableToSell} Unit
                                                    </span>
                                                ) : relProduct.availableToSell > 0 ? (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100/50 font-semibold tracking-wide flex items-center gap-1.5 select-none">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                        Stok: {relProduct.availableToSell} Unit
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-100/50 font-semibold tracking-wide flex items-center gap-1.5 select-none">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                        Pre-Order / Indent
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Premium Zoom/Lightbox Modal for Technical Image Inspection */}
            <AnimatePresence>
                {isZoomOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsZoomOpen(false)}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-10 cursor-zoom-out select-none"
                    >
                        {/* Close Button */}
                        <button 
                            onClick={() => setIsZoomOpen(false)}
                            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-md z-10 hover:scale-105 active:scale-95"
                            title="Tutup (Esc)"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Lightbox Image Panel */}
                        <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-4xl aspect-square max-h-[85vh] bg-white rounded-2xl border border-white/10 overflow-hidden shadow-2xl p-6 md:p-8 flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {activeImage && (
                                <Image
                                    src={activeImage}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-2 md:p-6"
                                    sizes="100vw"
                                    priority
                                />
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admin Floating Bar — only visible to admin/super admin */}
            <AdminProductFloatingBar
                productId={product.id}
                productSku={product.sku}
                isVisible={product.isVisible ?? true}
            />
        </>
    );
}
