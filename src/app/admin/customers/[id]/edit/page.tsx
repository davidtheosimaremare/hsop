import { db } from "@/lib/db";
import { CustomerEditForm } from "@/components/admin/CustomerEditForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminCustomerEditPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    const customer = await db.customer.findUnique({
        where: { id },
    });

    if (!customer) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/admin/customers/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
                    <p className="text-sm text-gray-500">Ubah data informasi pelanggan.</p>
                </div>
            </div>

            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Formulir Edit Customer</CardTitle>
                        <CardDescription>
                            Pastikan data seperti email dan telepon valid.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CustomerEditForm customer={customer} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
