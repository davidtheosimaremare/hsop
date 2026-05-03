"use client";

import { useState, useRef } from "react";
import { Share2, Minus, Plus, ShoppingCart, MessageCircle, ChevronLeft, ChevronRight, Copy, FileDown, Check, Percent } from "lucide-react";
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
    const priceInfo = getPriceInfo(product.price, product.category || null, product.availableToSell);

    // Explicit prices for split scenario
    const readyPriceInfo = getPriceInfo(product.price, product.category || null, 100); // Force ready
    const indentPriceInfo = getPriceInfo(product.price, product.category || null, 0); // Force indent

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
                isCustomerDiscount: readyPriceInfo.isCustomerDiscount
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
                isCustomerDiscount: readyPriceInfo.isCustomerDiscount
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
                isCustomerDiscount: indentPriceInfo.isCustomerDiscount
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
                isCustomerDiscount: readyPriceInfo.isCustomerDiscount
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
                isCustomerDiscount: indentPriceInfo.isCustomerDiscount
            }, indentQty);
        }

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <>
            {/* Product Detail Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left - Product Image */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 relative">
                        {/* Main Image View */}
                        <div className="aspect-square bg-white rounded-lg mb-4 flex items-center justify-center relative overflow-hidden group">
                            {activeImage ? (
                                <Image
                                    src={activeImage}
                                    alt={product.name}
                                    fill
                                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                                    Tidak ada gambar
                                </div>
                            )}
                        </div>

                        {/* Thumbnails (Only show if more than 1 image) */}
                        {galleryImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin scrollbar-thumb-gray-200">
                                {galleryImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={cn(
                                            "relative w-16 h-16 flex-shrink-0 rounded-md border-2 overflow-hidden transition-all",
                                            activeImage === img ? "border-red-600 opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <Image
                                            src={img}
                                            alt={`${product.name} thumbnail ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Share Button */}
                        <ShareButton className="flex items-center justify-center gap-2 w-full text-sm text-teal-600 hover:text-teal-700 outline-none" text="Bagikan Halaman" />
                    </div>
                </div>

                {/* Middle - Product Info */}
                <div className="lg:col-span-5">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 uppercase">
                        {product.name}
                    </h1>
                    <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm text-gray-400">SKU: {product.sku}</p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(product.sku);
                                const btn = document.getElementById("copy-sku-icon");
                                if (btn) {
                                    btn.classList.add("text-green-500");
                                    setTimeout(() => btn.classList.remove("text-green-500"), 1000);
                                }
                                // Show copied text
                                const successMsg = document.getElementById("copy-success-msg");
                                if (successMsg) {
                                    successMsg.classList.remove("hidden");
                                    setTimeout(() => successMsg.classList.add("hidden"), 2000);
                                }
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors group relative"
                            title="Salin SKU"
                        >
                            <Copy id="copy-sku-icon" className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            <span className="sr-only">Salin SKU</span>
                        </button>
                        <span id="copy-success-msg" className="hidden text-[10px] bg-black text-white px-2 py-0.5 rounded transition-opacity">
                            Tersalin!
                        </span>
                    </div>

                    {/* Price Display */}
                    <div className="mb-4">
                        {/* Logic Check: Single Price or Split Range? */}
                        {/* If user selected qty > stock, we should show breakdown or range. 
                            But initially qty=1. So show base price. 
                            However, if discount differs between stock/indent, showing one price might be misleading if they plan to buy many.
                            For now, stick to showing the price for the CURRENT state (which is 1 unit).
                         */}

                        {product.availableToSell > 0 ? (
                            // Showing Ready Price
                            readyPriceInfo.hasDiscount ? (
                                <div className="flex flex-col">
                                    {readyPriceInfo.isCustomerDiscount && (
                                        <span className="text-sm text-gray-400 line-through">
                                            Rp {formatPrice(readyPriceInfo.originalPriceWithPPN)}
                                        </span>
                                    )}
                                    <p className="text-2xl md:text-3xl font-bold text-red-600">
                                        Rp {formatPrice(readyPriceInfo.discountedPriceWithPPN)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-2xl md:text-3xl font-bold text-red-600">
                                    Rp {formatPrice(readyPriceInfo.originalPriceWithPPN)}
                                </p>
                            )
                        ) : (
                            // Showing Indent Price
                            indentPriceInfo.hasDiscount ? (
                                <div className="flex flex-col">
                                    {indentPriceInfo.isCustomerDiscount && (
                                        <span className="text-sm text-gray-400 line-through">
                                            Rp {formatPrice(indentPriceInfo.originalPriceWithPPN)}
                                        </span>
                                    )}
                                    <p className="text-2xl md:text-3xl font-bold text-red-600">
                                        Rp {formatPrice(indentPriceInfo.discountedPriceWithPPN)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-2xl md:text-3xl font-bold text-red-600">
                                    Rp {formatPrice(indentPriceInfo.originalPriceWithPPN)}
                                </p>
                            )
                        )}
                    </div>


                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {product.availableToSell > 0 ? (
                            <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                                Stock: {product.availableToSell} Unit
                            </span>
                        ) : (
                            <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Indent ({product.indentTime || '12-16 Minggu'})
                            </span>
                        )}
                        <span className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-600 border border-teal-200">
                            Termasuk PPN 11%
                        </span>
                    </div>

                    {/* Datasheet Link */}
                    <a
                        href={`https://mall.industry.siemens.com/teddatasheet/?format=PDF&mlfbs=${product.sku}&language=en&caller=SiePortal`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:underline mb-6 font-medium"
                    >
                        <FileDown className="w-4 h-4" />
                        Download Datasheet (PDF)
                    </a>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-4">
                        <div className="flex gap-6">
                            <button
                                onClick={() => setActiveTab("description")}
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "description"
                                    ? "border-teal-600 text-teal-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Deskripsi Produk
                            </button>
                            <button
                                onClick={() => setActiveTab("specs")}
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "specs"
                                    ? "border-teal-600 text-teal-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Spesifikasi Produk
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "specs" ? (
                        <div className="space-y-3">
                            <div className="flex">
                                <span className="w-40 flex-shrink-0 text-sm text-gray-500">Merek</span>
                                <span className="text-sm text-gray-900 font-medium">{product.brand || "-"}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 flex-shrink-0 text-sm text-gray-500">Kategori</span>
                                <span className="text-sm text-gray-900">{product.category || "-"}</span>
                            </div>
                            {specsArray.map((spec) => (
                                <div key={spec.label} className="flex">
                                    <span className="w-40 flex-shrink-0 text-sm text-gray-500 capitalize">{spec.label.replace(/_/g, ' ')}</span>
                                    <span className="text-sm text-gray-900">{spec.value}</span>
                                </div>
                            ))}

                        </div>
                    ) : (
                        <div className="text-sm text-gray-600 space-y-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatRichText(product.description) || "Tidak ada deskripsi." }} />
                    )}
                </div>

                {/* Right - Purchase Card */}
                <div className="lg:col-span-3">


                    {/* Purchase Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-1">Subtotal</p>

                        {/* Dynamic Subtotal Calculation */}
                        {(() => {
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
                                    <p className="text-xl font-bold text-red-600">
                                        Rp {formatPrice(total)}
                                    </p>
                                    {(!pricesEqual && quantity > stock && stock > 0) && (
                                        <span className="text-xs text-amber-600 mt-1">
                                            *Harga campuran Ready & Indent
                                        </span>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Quantity */}
                        <p className="text-sm text-gray-600 mb-2">Atur Jumlah Pembelian</p>
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 bg-white"
                                disabled={quantity <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                    let val = parseInt(e.target.value) || 1;
                                    val = Math.max(1, val);
                                    setQuantity(val);
                                }}
                                className="w-16 h-8 text-center border border-gray-300 rounded-lg text-sm bg-white"
                            />
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 bg-white"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-600">x Unit</span>
                        </div>

                        {/* Stock Breakdown Info */}
                        {quantity > 0 && (
                            <div className="mb-4 p-2 rounded-lg bg-gray-50 border border-gray-100">
                                {(() => {
                                    const pricesEqual = readyPriceInfo.discountedPriceWithPPN === indentPriceInfo.discountedPriceWithPPN;
                                    const showPrice = !pricesEqual;

                                    return product.availableToSell > 0 ? (
                                        quantity <= product.availableToSell ? (
                                            <div className="flex items-center gap-2 text-[10px] text-green-600">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                <span>{quantity} unit (Ready Stock) {showPrice && `@ ${formatPrice(readyPriceInfo.discountedPriceWithPPN)}`}</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] text-green-600">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    <span>{product.availableToSell} unit (Ready Stock) {showPrice && `@ ${formatPrice(readyPriceInfo.discountedPriceWithPPN)}`}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-amber-600">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                    <span>{quantity - product.availableToSell} unit (Indent ({product.indentTime || '12-16 Minggu'})) {showPrice && `@ ${formatPrice(indentPriceInfo.discountedPriceWithPPN)}`}</span>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex items-center gap-2 text-[10px] text-amber-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                            <span>Indent ({product.indentTime || '12-16 Minggu'}) {showPrice && `@ ${formatPrice(indentPriceInfo.discountedPriceWithPPN)}`}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Button
                                className={`w-full font-bold flex items-center justify-center gap-2 transition-all ${isAdded ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                onClick={handleAddToCart}
                            >
                                {isAdded ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Berhasil Ditambahkan
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-4 h-4" />
                                        Tambahkan Keranjang
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full text-green-600 border-green-600 hover:bg-green-50"
                                onClick={handleChatSales}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Chat Sales
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Long Description */}
            {(product.longDescription && product.longDescription !== "<p></p>") && (
                <section className="mt-10 bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Deskripsi Produk Lengkap</h2>
                    <div
                        className="prose prose-sm md:prose-base max-w-none text-gray-700 rich-text-content"
                        dangerouslySetInnerHTML={{ __html: formatRichText(product.longDescription) }}
                    />
                </section>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="mt-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Produk Terkait</h2>
                        <div className="flex items-center gap-2">
                            <Link prefetch={false}  href={`/pencarian?category=${encodeURIComponent(product.category || '')}`} className="text-sm text-teal-600 hover:underline mr-2">
                                Lihat Semua
                            </Link>
                            <button
                                onClick={() => scrollRelated("left")}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => scrollRelated("right")}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Slider */}
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
                                    className="group flex-shrink-0 w-52 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <Link prefetch={false}  href={`/produk/${getProductSlug(relProduct)}`} className="block h-full flex flex-col">
                                        {/* Product Image */}
                                        <div className="aspect-square bg-white relative">
                                            {relProduct.image ? (
                                                <Image
                                                    src={relProduct.image}
                                                    alt={relProduct.name}
                                                    fill
                                                    className="object-contain p-2"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-3/4 h-3/4 bg-gray-200 rounded-lg" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-3 flex-1 flex flex-col">
                                            <p className="text-xs text-gray-500 mb-1">{relProduct.brand}</p>
                                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors uppercase">
                                                {relProduct.name}
                                            </h3>

                                            <div className="mt-auto mb-2">
                                                {relPriceInfo.hasDiscount ? (
                                                    <div className="flex flex-col">
                                                        {relPriceInfo.isCustomerDiscount && (
                                                            <span className="text-[10px] text-gray-400 line-through">
                                                                Rp {formatPrice(relPriceInfo.originalPriceWithPPN)}
                                                            </span>
                                                        )}
                                                        <p className="text-sm font-bold text-red-600">
                                                            Rp {formatPrice(relPriceInfo.discountedPriceWithPPN)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-bold text-red-600">
                                                        Rp {formatPrice(relPriceInfo.originalPriceWithPPN)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${relProduct.availableToSell > 0
                                                    ? "bg-green-50 text-green-600 border border-green-200"
                                                    : "bg-orange-50 text-orange-600 border border-orange-200"
                                                    }`}>
                                                    {relProduct.availableToSell > 0 ? "Ready Stock" : `Indent (${relProduct.indentTime || '12-16 Minggu'})`}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Admin Floating Bar — only visible to admin/super admin */}
            <AdminProductFloatingBar
                productId={product.id}
                productSku={product.sku}
                isVisible={product.isVisible ?? true}
            />
        </>
    );
}
