import { getSiteSetting } from "@/app/actions/settings";
import { CompanySettingsForm } from "@/components/admin/CompanySettingsForm";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
    const companyDetails = await getSiteSetting("company_details");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-7 h-7 text-red-600" />
                        Profil Perusahaan
                    </h1>
                    <p className="text-sm text-gray-500 font-medium ml-10">Kelola identitas resmi dan informasi kontak perusahaan anda.</p>
                </div>
            </div>

            <CompanySettingsForm initialData={companyDetails as any} />
        </div>
    );
}
