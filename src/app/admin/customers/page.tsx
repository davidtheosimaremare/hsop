import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Eye, Plus, RefreshCw, Filter, MoreVertical, Mail, Phone, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import CustomerSyncButton from "@/components/admin/CustomerSyncButton";
import { CustomerDeleteButton } from "@/components/admin/CustomerDeleteButton";
import { Prisma } from "@prisma/client";
import SortHeader from "@/components/admin/SortHeader";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.pageSize) || 20;
    const query = params?.q?.toString() || "";
    const sortField = params?.sort?.toString() || "createdAt";
    const sortOrder = params?.order?.toString() === "desc" ? "desc" : "asc";

    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = {};
    if (query) {
        where.OR = [
            { name: { contains: query, mode: "insensitive" } },
            { id: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
        ];
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    if (sortField === "name") {
        orderBy.name = sortOrder;
    } else if (sortField === "createdAt") {
        orderBy.createdAt = sortOrder;
    } else if (sortField === "id") {
        orderBy.id = sortOrder;
    } else {
        orderBy.createdAt = "desc";
    }

    const [customers, totalCustomers] = await Promise.all([
        db.customer.findMany({
            where,
            orderBy,
            skip,
            take: pageSize,
            include: {
                users: {
                    select: { id: true, isActive: true }
                }
            }
        }),
        db.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCustomers / pageSize);

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (page <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (page >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(page - 1);
                pages.push(page);
                pages.push(page + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-red-600" />
                        Database Pelanggan
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Kelola data {totalCustomers} pelanggan Hokiindo.</p>
                </div>
                <div className="flex items-center gap-2">
                    <CustomerSyncButton />
                    <Button asChild className="bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 font-bold h-10 px-6">
                        <Link href="/admin/customers/new" className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Tambah Manual
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filter Area - Full-Width Redesign */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <form className="flex-1 flex items-center gap-3 w-full mr-1">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                        <Input
                            name="q"
                            placeholder="Cari Nama Pelanggan, ID (C.00xxx), atau Email..."
                            defaultValue={query}
                            className="pl-10 h-11 bg-gray-50/50 border-gray-100 focus:bg-white rounded-xl transition-all font-medium text-sm w-full"
                        />
                    </div>
                    <select
                        name="pageSize"
                        defaultValue={pageSize}
                        className="h-11 px-4 rounded-xl border border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/10 cursor-pointer hidden sm:block"
                    >
                        <option value="20">20 Items</option>
                        <option value="50">50 Items</option>
                        <option value="100">100 Items</option>
                    </select>
                    <Button type="submit" className="h-11 px-8 bg-red-600 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100/50 transition-all shrink-0">
                        <Filter className="w-3.5 h-3.5 mr-2" /> Filter
                    </Button>
                </form>
            </div>

            {/* Table Area - Premium Dark Header Fixed */}
            <div className="border border-gray-100 shadow-sm rounded-xl bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-900 border-b border-gray-800">
                            <tr className="h-14">
                                <th className="px-5 text-left"><SortHeader title="ID" field="id" className="text-[10px] font-black text-white uppercase tracking-widest hover:text-white/80" /></th>
                                <th className="px-5 text-left"><SortHeader title="NAMA PELANGGAN" field="name" className="text-[10px] font-black text-white uppercase tracking-widest hover:text-white/80" /></th>
                                <th className="px-5 text-left"><SortHeader title="TIPE AKUN" field="type" className="text-[10px] font-black text-white uppercase tracking-widest hover:text-white/80" /></th>
                                <th className="px-5 text-left text-[10px] font-black text-white uppercase tracking-widest">INFORMASI KONTAK</th>
                                <th className="px-5 text-left"><SortHeader title="TERDAFTAR" field="createdAt" className="text-[10px] font-black text-white uppercase tracking-widest hover:text-white/80" /></th>
                                <th className="px-5 text-right text-[10px] font-black text-white uppercase tracking-widest">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                            <Users className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Database Kosong</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50/70 transition-colors group">
                                        {/* ID Column */}
                                        <td className="px-5 py-2.5">
                                            <Link href={`/admin/customers/${customer.id}`} className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 group-hover:bg-red-50 text-[10px] font-black text-gray-900 font-mono transition-colors">
                                                {customer.id}
                                            </Link>
                                        </td>

                                        {/* Name Column */}
                                        <td className="px-5 py-2.5">
                                            <Link href={`/admin/customers/${customer.id}`} className="flex items-center gap-3 group/link">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-gray-600 text-[10px] uppercase shrink-0 border border-gray-200/50 overflow-hidden transition-all group-hover/link:ring-2 group-hover/link:ring-red-100">
                                                    {customer.image ? (
                                                        <img src={customer.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        customer.name?.charAt(0) || '?'
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-gray-900 text-[13px] truncate max-w-[220px] group-hover/link:text-red-600 transition-colors uppercase tracking-tight">
                                                        {customer.type === "BISNIS" ? (customer.company || customer.name) : customer.name}
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>

                                        {/* Type Column */}
                                        <td className="px-5 py-2.5">
                                            <div className="flex items-center">
                                                {customer.type === "BISNIS" ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-blue-50 text-blue-600 uppercase">Perusahaan</span>
                                                ) : customer.type === "RESELLER" ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-orange-50 text-orange-600 uppercase">Reseller</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-gray-100 text-gray-500 uppercase">Retail</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Contact Column */}
                                        <td className="px-5 py-2.5">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-900">
                                                    <Mail className="w-3 h-3 text-gray-300 group-hover:text-red-400 transition-colors" />
                                                    {customer.type === "BISNIS" ? (customer.companyEmail || customer.email) : customer.email}
                                                </div>
                                                {(customer.type === "BISNIS" ? (customer.companyPhone || customer.phone) : customer.phone) && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 mt-0.5">
                                                        <Phone className="w-3 h-3 text-gray-300" />
                                                        {customer.type === "BISNIS" ? (customer.companyPhone || customer.phone) : customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Date Column */}
                                        <td className="px-5 py-2.5">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                <Calendar className="w-3 h-3 text-gray-200" />
                                                {format(new Date(customer.createdAt), 'dd/MM/yyyy')}
                                            </div>
                                        </td>

                                        {/* Actions Column */}
                                        <td className="px-5 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-50 group-hover:opacity-100 transition-all">
                                                <Button asChild variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                                                    <Link href={`/admin/customers/${customer.id}`}>
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Link>
                                                </Button>
                                                <div className="w-px h-3 bg-gray-100 mx-0.5"></div>
                                                <CustomerDeleteButton
                                                    customerId={customer.id}
                                                    customerName={customer.name}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Professional Pagination */}
                <div className="px-6 py-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                        Halaman {page} / {totalPages || 1} • {totalCustomers} TOTAL DATA
                    </div>

                    <div className="flex items-center gap-1 order-1 sm:order-2">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page <= 1}
                            asChild={page > 1}
                            className="h-8 w-8 rounded-lg border-gray-100 bg-white hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <Link href={`?page=${page - 1}&q=${query}&sort=${sortField}&order=${sortOrder}&pageSize=${pageSize}`}>
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                        </Button>

                        <div className="flex items-center gap-1.5 mx-2">
                            {getPageNumbers().map((p, idx) => (
                                typeof p === 'number' ? (
                                    <Button
                                        key={idx}
                                        variant={page === p ? "default" : "outline"}
                                        asChild={page !== p}
                                        className={cn(
                                            "h-8 min-w-[32px] rounded-lg text-xs font-black transition-all",
                                            page === p
                                                ? "bg-red-600 text-white shadow-md shadow-red-100 border-none"
                                                : "border-gray-100 bg-white text-gray-500 hover:border-red-200 hover:text-red-600 px-2"
                                        )}
                                    >
                                        {page === p ? (
                                            <span>{p}</span>
                                        ) : (
                                            <Link href={`?page=${p}&q=${query}&sort=${sortField}&order=${sortOrder}&pageSize=${pageSize}`}>
                                                {p}
                                            </Link>
                                        )}
                                    </Button>
                                ) : (
                                    <span key={idx} className="px-1 text-gray-300 font-bold text-xs">...</span>
                                )
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page >= totalPages}
                            asChild={page < totalPages}
                            className="h-8 w-8 rounded-lg border-gray-100 bg-white hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <Link href={`?page=${page + 1}&q=${query}&sort=${sortField}&order=${sortOrder}&pageSize=${pageSize}`}>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
