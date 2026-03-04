"use client";

import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    AreaChart,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface CustomerActivityChartProps {
    orders: any[];
    quotations: any[];
}

export function CustomerActivityChart({ orders, quotations }: CustomerActivityChartProps) {
    // Process data for the last 6 months
    const chartData = useMemo(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const date = subMonths(new Date(), 5 - i);
            return {
                month: format(date, "MMM yyyy", { locale: localeId }),
                startDate: startOfMonth(date),
                endDate: endOfMonth(date),
                completed: 0,
                processed: 0,
                rfqs: 0,
            };
        });

        orders.forEach((order) => {
            const date = new Date(order.createdAt);
            last6Months.forEach((m) => {
                if (isWithinInterval(date, { start: m.startDate, end: m.endDate })) {
                    if (order.status === "COMPLETED") {
                        m.completed += 1;
                    } else {
                        m.processed += 1;
                    }
                }
            });
        });

        quotations.forEach((q) => {
            const date = new Date(q.createdAt);
            last6Months.forEach((m) => {
                if (isWithinInterval(date, { start: m.startDate, end: m.endDate })) {
                    if (q.status === "COMPLETED") {
                        m.completed += 1;
                    } else if (q.status === "CANCELLED") {
                        // Skip cancelled if you want, or count elsewhere. 
                        // For now let's keep it out of the areas or count as RFQ if it's just a canceled draft
                    } else {
                        m.rfqs += 1;
                    }
                }
            });
        });

        return last6Months;
    }, [orders, quotations]);

    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRFQs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                        dy={10}
                    />
                    <YAxis
                        hide
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-white p-4 shadow-2xl rounded-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{label}</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-6 justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span className="text-xs font-bold text-gray-600">Selesai</span>
                                                </div>
                                                <span className="text-xs font-black text-gray-900">{payload[0].value}</span>
                                            </div>
                                            <div className="flex items-center gap-6 justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                    <span className="text-xs font-bold text-gray-600">Diproses</span>
                                                </div>
                                                <span className="text-xs font-black text-gray-900">{payload[1].value}</span>
                                            </div>
                                            <div className="flex items-center gap-6 justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span className="text-xs font-bold text-gray-600">RFQ</span>
                                                </div>
                                                <span className="text-xs font-black text-gray-900">{payload[2].value}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="completed"
                        name="Selesai"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorCompleted)"
                    />
                    <Area
                        type="monotone"
                        dataKey="processed"
                        name="Diproses"
                        stroke="#ef4444"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorProcessed)"
                    />
                    <Area
                        type="monotone"
                        dataKey="rfqs"
                        name="RFQ"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRFQs)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
