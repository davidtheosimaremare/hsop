
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, UserCog, Percent } from "lucide-react";
import Link from "next/link";
import CustomerSyncButton from "@/components/admin/CustomerSyncButton";
import { Prisma } from "@prisma/client";
import SortHeader from "@/components/admin/SortHeader";

export default async function AdminCustomersPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.pageSize) || 20;
    const query = params?.q?.toString() || "";
    const sortField = params?.sort?.toString() || "name";
    const sortOrder = params?.order?.toString() === "desc" ? "desc" : "asc";

    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = {};
    if (query) {
        where.OR = [
            { name: { contains: query, mode: "insensitive" } },
            { id: { contains: query, mode: "insensitive" } },
        ];
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    if (sortField === "name") {
        orderBy.name = sortOrder;
    } else if (sortField === "createdAt") {
        orderBy.createdAt = sortOrder;
    } else if (sortField === "id") {
        orderBy.id = sortOrder;
    } else if (sortField === "email") {
        orderBy.email = sortOrder;
    } else if (sortField === "type") {
        orderBy.type = sortOrder;
    } else if (sortField === "businessCategory") {
        orderBy.businessCategory = sortOrder;
    } else {
        orderBy.name = "asc";
    }

    const [customers, totalCustomers] = await Promise.all([
        db.customer.findMany({
            where,
            orderBy,
            skip,
            take: pageSize,
        }),
        db.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCustomers / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Data Customer</h1>
                    <p className="text-sm text-gray-500">Kelola pelanggan dan diskon khusus.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/admin/customers/new">
                            + Tambah Customer
                        </Link>
                    </Button>
                    <CustomerSyncButton />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <CardTitle>Daftar Pelanggan</CardTitle>
                        </div>

                        {/* Filter Toolbar */}
                        <form className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    name="q"
                                    placeholder="Cari nama atau No. Pelanggan..."
                                    defaultValue={query}
                                    className="pl-9 w-full"
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    name="pageSize"
                                    defaultValue={pageSize}
                                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-[100px]"
                                >
                                    <option value="20">20 Items</option>
                                    <option value="50">50 Items</option>
                                    <option value="100">100 Items</option>
                                </select>

                                <Button type="submit">Filter</Button>
                            </div>
                        </form>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left text-gray-700">
                            <thead className="bg-gray-50 text-gray-900 font-medium">
                                <tr>
                                    <th className="px-4 py-3"><SortHeader title="No. Pelanggan" field="id" /></th>
                                    <th className="px-4 py-3"><SortHeader title="Nama / Perusahaan" field="name" /></th>
                                    <th className="px-4 py-3"><SortHeader title="Tipe" field="type" /></th>
                                    <th className="px-4 py-3"><SortHeader title="Kategori" field="businessCategory" /></th>
                                    <th className="px-4 py-3"><SortHeader title="Kontak (Email)" field="email" /></th>
                                    <th className="px-4 py-3"><SortHeader title="Tanggal Dibuat" field="createdAt" /></th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                            Belum ada data customer. Silakan Sync dari Accurate.
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-xs">{customer.id}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{customer.name}</div>
                                                {customer.company && <div className="text-xs text-gray-500">{customer.company}</div>}
                                                {customer.userId && (
                                                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                                        Akun Aktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${customer.type === "BISNIS" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                                                    }`}>
                                                    {customer.type === "BISNIS" ? "Perusahaan" : "Retail"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {customer.businessCategory || "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col text-sm">
                                                    <span>{customer.email || "-"}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                {customer.createdAt.toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/customers/${customer.id}`}>
                                                        Detail
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="text-sm text-gray-500 mr-4">
                            Page {page} of {totalPages || 1} (Total {totalCustomers})
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            asChild={page > 1}
                        >
                            <Link href={`?page=${page - 1}&q=${query}&sort=${sortField}&order=${sortOrder}&pageSize=${pageSize}`}>Previous</Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            asChild={page < totalPages}
                        >
                            <Link href={`?page=${page + 1}&q=${query}&sort=${sortField}&order=${sortOrder}&pageSize=${pageSize}`}>Next</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
