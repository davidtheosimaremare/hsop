import HomeCTAManager from "@/components/admin/HomeCTAManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomeCTASettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan Home CTA</h1>
                <p className="text-sm text-gray-500">Kelola banner Call-to-Action yang muncul di halaman depan.</p>
            </div>

            <HomeCTAManager />
        </div>
    );
}
