import { getSiteSetting } from "@/app/actions/settings";
import { EmailTemplateForm } from "@/components/admin/EmailTemplateForm";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmailTemplatePage() {
    const emailTemplate = await getSiteSetting("email_template");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Mail className="w-7 h-7 text-red-600" />
                        Tampilan Email Notifikasi
                    </h1>
                    <p className="text-sm text-gray-500 font-medium ml-10">Kustomisasi header dan footer untuk seluruh email yang dikirim oleh sistem.</p>
                </div>
            </div>

            <EmailTemplateForm initialData={emailTemplate as any} />
        </div>
    );
}
