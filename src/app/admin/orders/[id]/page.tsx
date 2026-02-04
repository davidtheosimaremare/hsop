import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, MapPin, Mail, Upload, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrder, updateOrderStatus } from "@/app/actions/order";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Client Component for interactivity
import { OrderDetailActions } from "@/components/admin/OrderDetailActions";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    const order = await db.order.findUnique({
        where: { id },
        include: {
            customer: true,
            items: {
                include: {
                    product: true,
                }
            }
        },
    });

    if (!order) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/orders">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Detail Pesanan</h1>
                    <p className="text-sm text-gray-500">ID: {order.id}</p>
                </div>
                <div className="ml-auto">
                    <Badge className="text-lg px-4 py-1" variant={
                        order.status === "PENDING" ? "secondary" :
                            order.status === "PROCESSED" ? "default" :
                                order.status === "COMPLETED" ? "outline" : "destructive"
                    }>
                        {order.status}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Barang</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produk</TableHead>
                                        <TableHead className="text-right">Harga</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.product.name}</div>
                                                <div className="text-xs text-gray-500">{item.product.sku}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                Rp {item.price.toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                            <TableCell className="text-right">
                                                Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-right font-medium">Total Harga Barang</TableCell>
                                        <TableCell className="text-right font-bold">
                                            Rp {order.total.toLocaleString("id-ID")}
                                        </TableCell>
                                    </TableRow>
                                    {/* Discount Row will be handled dynamically in client component if possible, 
                                        but for now we show static DB value */}
                                    {order.discount > 0 && (
                                        <TableRow className="bg-green-50">
                                            <TableCell colSpan={3} className="text-right font-medium text-green-700">Diskon Tambahan</TableCell>
                                            <TableCell className="text-right font-bold text-green-700">
                                                - Rp {order.discount.toLocaleString("id-ID")}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow className="bg-gray-50">
                                        <TableCell colSpan={3} className="text-right font-bold text-lg">Grand Total</TableCell>
                                        <TableCell className="text-right font-bold text-lg">
                                            Rp {(order.total - order.discount).toLocaleString("id-ID")}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Interactive Actions Component for Client Side Logic */}
                    <OrderDetailActions order={order} />
                </div>

                {/* Right Column: Customer & Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" /> Informasi Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-500">Nama</div>
                                <div className="font-medium">{order.customer.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Email</div>
                                <div className="font-medium">{order.customer.email || "-"}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Telepon</div>
                                <div className="font-medium">{order.customer.phone || "-"}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Alamat</div>
                                <div className="font-medium whitespace-pre-wrap">{order.customer.address || "-"}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Lampiran Dokumen
                            </CardTitle>
                            <CardDescription>File penunjang pesanan ini.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="border rounded-md p-3 flex items-center justify-between">
                                <span className="text-sm font-medium">Penawaran (Quote)</span>
                                {order.attachmentQuote ? (
                                    <Button variant="link" size="sm" asChild>
                                        <Link href={order.attachmentQuote} target="_blank">Lihat</Link>
                                    </Button>
                                ) : <span className="text-xs text-gray-400">Tidak ada</span>}
                            </div>
                            <div className="border rounded-md p-3 flex items-center justify-between">
                                <span className="text-sm font-medium">Purchase Order (PO)</span>
                                {order.attachmentPO ? (
                                    <Button variant="link" size="sm" asChild>
                                        <Link href={order.attachmentPO} target="_blank">Lihat</Link>
                                    </Button>
                                ) : <span className="text-xs text-gray-400">Tidak ada</span>}
                            </div>
                            <div className="border rounded-md p-3 flex items-center justify-between">
                                <span className="text-sm font-medium">Invoice</span>
                                {order.attachmentInvoice ? (
                                    <Button variant="link" size="sm" asChild>
                                        <Link href={order.attachmentInvoice} target="_blank">Lihat</Link>
                                    </Button>
                                ) : <span className="text-xs text-gray-400">Tidak ada</span>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
