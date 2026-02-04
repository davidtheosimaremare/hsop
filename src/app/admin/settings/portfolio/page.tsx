import { db } from "@/lib/db";
import { PortfolioManager } from "@/components/admin/PortfolioManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function PortfolioSettingsPage() {
    const clients = await db.clientProject.findMany({
        orderBy: { order: 'asc' },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Portfolio & Klien</h1>
                <p className="text-sm text-gray-500">Kelola daftar klien dan proyek yang telah dikerjakan.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Portfolio</CardTitle>
                    <CardDescription>
                        Akan ditampilkan di section Klien / Portfolio.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PortfolioManager initialClients={clients} />
                </CardContent>
            </Card>
        </div>
    );
}
