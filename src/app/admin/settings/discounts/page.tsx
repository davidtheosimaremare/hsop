import { db } from "@/lib/db";
import { getDiscountRules, saveDiscountRule } from "@/app/actions/discount";
import { DiscountRuleForm } from "@/components/admin/DiscountRuleForm";

export const dynamic = "force-dynamic";

export default async function DiscountSettingsPage() {
    const rules = await getDiscountRules();

    // Ensure default structure for the 3 main groups if not exists
    const ruleGroups = [
        { key: "LP", label: "Siemens LP (Low Voltage & Distribution)", defaultDesc: "Low Voltage Products, Energy Automation..." },
        { key: "CP", label: "Siemens CP (Control Products)", defaultDesc: "Control Products, Drive Technology..." },
        { key: "LIGHTING", label: "Portable Lighting (Senter)", defaultDesc: "All portable lighting products" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pengaturan Diskon Default</h2>
                    <p className="text-muted-foreground">
                        Atur logika diskon otomatis berdasarkan Grup Kategori dan status stok.
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {ruleGroups.map((group) => {
                    const existingRule = rules.find(r => r.categoryGroup === group.key);
                    return (
                        <DiscountRuleForm
                            key={group.key}
                            groupKey={group.key}
                            groupLabel={group.label}
                            defaultDesc={group.defaultDesc}
                            initialData={existingRule}
                        />
                    );
                })}
            </div>
        </div>
    );
}
