"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { quickSearch, QuickSearchResult } from "@/app/actions/search";
import { getProductSlug } from "@/lib/utils";
import { startProgress } from "@/components/layout/NavigationProgress";

const SEARCH_HISTORY_KEY = "hsop-search-history";
const MAX_HISTORY_ITEMS = 5;

interface SearchBoxProps {
    isMobile?: boolean;
}

export default function SearchBox({ isMobile = false }: SearchBoxProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<QuickSearchResult[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Load history from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setHistory(parsed);
                }
            }
        } catch (error) {
            console.error("Failed to load search history:", error);
        }
    }, []);

    // Save history to localStorage
    const saveHistory = useCallback((newHistory: string[]) => {
        try {
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
            setHistory(newHistory);
        } catch (error) {
            console.error("Failed to save search history:", error);
        }
    }, []);

    // Add to history
    const addToHistory = useCallback((searchTerm: string) => {
        if (!searchTerm.trim()) return;
        const filtered = history.filter(h => h.toLowerCase() !== searchTerm.toLowerCase());
        const newHistory = [searchTerm.trim(), ...filtered].slice(0, MAX_HISTORY_ITEMS);
        saveHistory(newHistory);
    }, [history, saveHistory]);

    // Remove from history
    const removeFromHistory = useCallback((term: string) => {
        const newHistory = history.filter(h => h !== term);
        saveHistory(newHistory);
    }, [history, saveHistory]);

    // Clear all history
    const clearHistory = useCallback(() => {
        saveHistory([]);
    }, [saveHistory]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.trim().length >= 2) {
            setIsLoading(true);
            debounceRef.current = setTimeout(async () => {
                try {
                    const data = await quickSearch(query);
                    setResults(data);
                } catch (error) {
                    console.error("Search error:", error);
                    setResults([]);
                } finally {
                    setIsLoading(false);
                }
            }, 300);
        } else {
            setResults([]);
            setIsLoading(false);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            addToHistory(query.trim());
        }
        setIsOpen(false);
        startProgress();
        router.push(`/pencarian?q=${encodeURIComponent(query)}`);
    };

    const handleHistoryClick = (term: string) => {
        setQuery(term);
        addToHistory(term);
        setIsOpen(false);
        startProgress();
        router.push(`/pencarian?q=${encodeURIComponent(term)}`);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    const showDropdown = isOpen && (query.length > 0 || history.length > 0);

    if (isMobile) {
        return (
            <div ref={containerRef} className="relative w-full">
                <form onSubmit={handleSubmit} className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Cari produk..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        className="w-full h-10 pl-9 pr-3 rounded-full border border-gray-200 focus:border-red-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none bg-white text-sm"
                    />
                </form>

                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-[70vh] overflow-y-auto"
                        >
                            {/* History Section */}
                            {query.length === 0 && history.length > 0 && (
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-500">Riwayat Pencarian</span>
                                        <button
                                            onClick={clearHistory}
                                            className="text-[10px] text-red-500 hover:text-red-600"
                                        >
                                            Hapus Semua
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {history.map((term) => (
                                            <div
                                                key={term}
                                                className="flex items-center justify-between group"
                                            >
                                                <button
                                                    onClick={() => handleHistoryClick(term)}
                                                    className="flex items-center gap-2 py-1.5 text-sm text-gray-700 hover:text-red-600 flex-1 text-left"
                                                >
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{term}</span>
                                                </button>
                                                <button
                                                    onClick={() => removeFromHistory(term)}
                                                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Loading */}
                            {isLoading && query.length >= 2 && (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    Mencari...
                                </div>
                            )}

                            {/* Results */}
                            {!isLoading && results.length > 0 && (
                                <div className="p-2">
                                    {results.map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/produk/${getProductSlug(product)}`}
                                            onClick={() => {
                                                addToHistory(query);
                                                setIsOpen(false);
                                            }}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                                                {product.image ? (
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        fill
                                                        className="object-contain p-1"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                        <span className="text-[8px] text-gray-400">No Image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                                <p className="text-xs text-gray-500">{product.sku}</p>
                                            </div>
                                        </Link>
                                    ))}
                                    <Link
                                        href={`/pencarian?q=${encodeURIComponent(query)}`}
                                        onClick={() => addToHistory(query)}
                                        className="block mt-2 p-2 text-center text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
                                    >
                                        Lihat Semua Hasil →
                                    </Link>
                                </div>
                            )}

                            {/* No Results */}
                            {!isLoading && query.length >= 2 && results.length === 0 && (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    Tidak ada hasil untuk "{query}"
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Desktop version
    return (
        <div ref={containerRef} className="relative w-full">
            <form onSubmit={handleSubmit} className="relative w-full group">
                <Input
                    type="text"
                    placeholder="Cari solusi Siemens & Produk Elektrikal"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className="w-full h-11 pl-4 pr-14 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none bg-white"
                />
                <Button
                    type="submit"
                    variant="red"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-11 rounded-lg transition-all duration-300"
                >
                    <Search className="h-4 w-4 text-white" />
                </Button>
            </form>

            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-[60vh] overflow-y-auto"
                    >
                        {/* History Section */}
                        {query.length === 0 && history.length > 0 && (
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Riwayat Pencarian</span>
                                    <button
                                        onClick={clearHistory}
                                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Hapus Semua
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {history.map((term) => (
                                        <div
                                            key={term}
                                            className="flex items-center justify-between group"
                                        >
                                            <button
                                                onClick={() => handleHistoryClick(term)}
                                                className="flex items-center gap-2 py-2 text-sm text-gray-700 hover:text-red-600 flex-1 text-left"
                                            >
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span>{term}</span>
                                            </button>
                                            <button
                                                onClick={() => removeFromHistory(term)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Loading */}
                        {isLoading && query.length >= 2 && (
                            <div className="p-6 text-center text-sm text-gray-500">
                                <div className="inline-block w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                Mencari...
                            </div>
                        )}

                        {/* Results */}
                        {!isLoading && results.length > 0 && (
                            <div className="p-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">Hasil Pencarian</p>
                                {results.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/produk/${getProductSlug(product)}`}
                                        onClick={() => {
                                            addToHistory(query);
                                            setIsOpen(false);
                                        }}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                                            {product.image ? (
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-contain p-1"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-[8px] text-gray-400">No Image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.sku}</p>
                                        </div>
                                    </Link>
                                ))}
                                <Link
                                    href={`/pencarian?q=${encodeURIComponent(query)}`}
                                    onClick={() => addToHistory(query)}
                                    className="block mt-2 p-2.5 text-center text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium border border-red-100"
                                >
                                    Lihat Semua Hasil untuk "{query}" →
                                </Link>
                            </div>
                        )}

                        {/* No Results */}
                        {!isLoading && query.length >= 2 && results.length === 0 && (
                            <div className="p-6 text-center">
                                <p className="text-sm text-gray-500">Tidak ada hasil untuk "<strong>{query}</strong>"</p>
                                <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau periksa ejaan</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
