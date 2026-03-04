"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGA4DummyData } from "@/app/actions/dashboard";
import { Loader2, TrendingUp, Users } from "lucide-react";

export function DashboardChart() {
    const [data, setData] = useState<any[]>([]);
    const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            const res = await getGA4DummyData(period);
            if (res.success && res.data) {
                setData(res.data);
            }
            setIsLoading(false);
        }
        loadData();
    }, [period]);

    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-gray-100/60 overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-50 flex flex-row items-center justify-between py-4">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-red-600" />
                        Traffic Pengunjung Website
                    </CardTitle>
                    <CardDescription>
                        Data analitik dari Google Analytics (GA4)
                    </CardDescription>
                </div>
                <Select value={period} onValueChange={(v: "weekly" | "monthly") => setPeriod(v)}>
                    <SelectTrigger className="w-[140px] h-9 text-xs rounded-lg font-medium">
                        <SelectValue placeholder="Pilih Periode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="weekly">7 Hari Terakhir</SelectItem>
                        <SelectItem value="monthly">1 Bulan Terakhir</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="p-0 pt-6">
                {isLoading ? (
                    <div className="h-[300px] flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                        <p className="text-sm font-medium text-slate-500">Memuat data Analytics...</p>
                    </div>
                ) : (
                    <div className="h-[300px] w-full px-4 pb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fca5a5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#fca5a5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                                    }}
                                    cursor={{ stroke: '#f87171', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="pageviews"
                                    name="Page Views"
                                    stroke="#fca5a5"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorPageviews)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="visitors"
                                    name="Visitors"
                                    stroke="#DC2626"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorVisitors)"
                                    activeDot={{ r: 6, fill: "#DC2626", stroke: "#fff", strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
                {!isLoading && (
                    <div className="flex items-center justify-center gap-6 pb-6 pt-2 border-t border-gray-50 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                            <span className="text-xs font-semibold text-gray-600">Visitor Unik</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-300"></div>
                            <span className="text-xs font-semibold text-gray-600">Page Views</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
