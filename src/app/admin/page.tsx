import { getDashboardStats } from "@/app/actions/dashboard";
import DashboardClient from "@/components/admin/DashboardClient";

export default async function AdminDashboard() {
    const stats = await getDashboardStats();

    if (!stats.success) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-red-500 font-bold">Gagal memuat data dashboard.</p>
            </div>
        );
    }

    return <DashboardClient stats={stats as any} />;
}
