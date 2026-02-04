
import { db } from "@/lib/db";
import { ProductEditForm } from "@/components/admin/ProductEditForm";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminProductEditPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    const product = await db.product.findUnique({
        where: { id },
    });

    if (!product) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/admin/products/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
                    <p className="text-sm text-gray-500">{product.name}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Form Edit Detail</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProductEditForm
                        product={product}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
