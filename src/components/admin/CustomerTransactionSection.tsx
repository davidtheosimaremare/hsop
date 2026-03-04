"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Calendar, ChevronLeft, ChevronRight, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CustomerActivityChart } from "./CustomerActivityChart";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface CustomerTransactionSectionProps {
    orders: any[];
    quotations: any[];
}

export function CustomerTransactionSection({ orders, quotations }: CustomerTransactionSectionProps) {
    const [showChart, setShowChart] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const allTransactions = useMemo(() => {
        return [...orders.map(o => ({ ...o, type: 'ORDER' as const })), ...quotations.map(q => ({ ...q, type: 'QUOTE' as const }))]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [orders, quotations]);

    const totalPages = Math.ceil(allTransactions.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return allTransactions.slice(start, start + itemsPerPage);
    }, [allTransactions, currentPage]);

    const hasTransactions = allTransactions.length > 0;

    return (
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                            <ShoppingCart className="h-4 w-4 text-red-600" /> Histori Pesanan
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-gray-400 italic">Aktivitas transaksi (RFQ & Order) 6 bulan terakhir</CardDescription>
                    </div>
                    {hasTransactions && (
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                            <Label htmlFor="show-chart" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">
                                Tampilkan Grafik
                            </Label>
                            <Switch
                                id="show-chart"
                                checked={showChart}
                                onCheckedChange={setShowChart}
                                className="data-[state=checked]:bg-red-600"
                            />
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {!hasTransactions ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-gray-200" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic leading-none">Belum Ada Transaksi</p>
                            <p className="text-[10px] font-medium text-gray-400">Customer ini belum melakukan pemesanan atau permintaan harga.</p>
                        </div>
                    </div>
                ) : (
                    <div className={cn(
                        "grid grid-cols-1 gap-8",
                        showChart && "lg:grid-cols-5"
                    )}>
                        {/* Transaction Table */}
                        <div className={cn(
                            "space-y-4 flex flex-col",
                            showChart ? "lg:col-span-2" : "col-span-1"
                        )}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-3 bg-red-600 rounded-full" />
                                    Transaksi Terbaru
                                </h3>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none text-[9px] font-black px-2 py-0.5 rounded-lg">
                                    {allTransactions.length} TOTAL
                                </Badge>
                            </div>

                            <div className={cn(
                                "space-y-2 flex-grow",
                                !showChart && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                            )}>
                                {paginatedItems.map((item) => {
                                    const isQuote = item.type === 'QUOTE';
                                    const link = isQuote
                                        ? `/admin/sales/quotations/${item.id}`
                                        : `/admin/sales/orders/${item.id}`;
                                    const displayNo = isQuote
                                        ? (item as any).quotationNo
                                        : item.id.slice(-8).toUpperCase();
                                    const amount = isQuote
                                        ? (item as any).totalAmount
                                        : (item as any).total;

                                    return (
                                        <Link
                                            key={item.id}
                                            href={link}
                                            className={cn(
                                                "block p-3 rounded-xl border border-gray-100 hover:border-red-100 hover:bg-red-50/30 transition-all group",
                                                !showChart && "m-0"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[8px] font-black border-none px-1.5 py-0 rounded-md",
                                                        isQuote ? "bg-indigo-50 text-indigo-600" : "bg-orange-50 text-orange-600"
                                                    )}>
                                                        {isQuote ? "QUOTE" : "ORDER"}
                                                    </Badge>
                                                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                                                        {displayNo}
                                                    </span>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[9px] font-black border-none px-1.5 py-0.5 rounded",
                                                    item.status === "PENDING" ? "bg-amber-50 text-amber-600" :
                                                        item.status === "PROCESSED" || item.status === "PROCESSING" ? "bg-blue-50 text-blue-600" :
                                                            item.status === "SHIPPED" ? "bg-purple-50 text-purple-600" :
                                                                item.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" :
                                                                    "bg-gray-50 text-gray-600"
                                                )}>
                                                    {item.status || "DRAFT"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-gray-300" />
                                                    {format(new Date(item.createdAt), "dd MMM yyyy")}
                                                </div>
                                                <div className="text-xs font-black text-gray-900">
                                                    Rp {amount?.toLocaleString("id-ID") || "0"}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Hal {currentPage} dari {totalPages}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg border-gray-100"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg border-gray-100"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Activity Chart */}
                        {showChart && (
                            <div className="lg:col-span-3 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-3 bg-red-600 rounded-full" />
                                    Grafik Aktivitas
                                </h3>
                                <div className="p-4 rounded-3xl bg-gray-50/50 border border-gray-100 shadow-inner">
                                    <CustomerActivityChart orders={orders} quotations={quotations} />
                                </div>
                                <div className="flex items-center justify-center gap-6 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selesai</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-red-50" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diproses</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">RFQ</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
