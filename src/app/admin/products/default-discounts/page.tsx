import { getDiscountRules } from "@/app/actions/discount";
import { DiscountRuleForm } from "@/components/admin/DiscountRuleForm";
import { Plug2, CircuitBoard, Zap, Info } from "lucide-react";

export const dynamic = "force-dynamic";

const RULE_GROUPS = [
    {
        key: "LP",
        label: "Siemens LP",
        defaultDesc: "Low Voltage Products, Energy Automation, Distribution...",
        icon: Plug2,
        accent: {
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-600",
            headerBg: "bg-yellow-50",
            headerBorder: "border-yellow-100",
            badgeBg: "bg-yellow-100",
            badgeText: "text-yellow-700",
        },
    },
    {
        key: "CP",
        label: "Siemens CP",
        defaultDesc: "Control Products, Drive Technology, SINAMIC...",
        icon: CircuitBoard,
        accent: {
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            headerBg: "bg-blue-50",
            headerBorder: "border-blue-100",
            badgeBg: "bg-blue-100",
            badgeText: "text-blue-700",
        },
    },
    {
        key: "LIGHTING",
        label: "Portable Lighting",
        defaultDesc: "Seluruh produk pencahayaan portabel (Senter dll.)",
        icon: Zap,
        accent: {
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            headerBg: "bg-orange-50",
            headerBorder: "border-orange-100",
            badgeBg: "bg-orange-100",
            badgeText: "text-orange-700",
        },
    },
];

export default async function DiscountSettingsPage() {
    const rules = await getDiscountRules();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Diskon Default</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Atur persentase diskon otomatis untuk setiap grup produk berdasarkan ketersediaan stok.
                </p>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700 space-y-1">
                    <p className="font-semibold">Cara kerja diskon bertingkat</p>
                    <p>
                        Format <code className="bg-blue-100 px-1 rounded font-mono">30+35</code> berarti: harga list dikurangi 30%, kemudian hasilnya dikurangi lagi 35%.
                        Diskon ini diterapkan otomatis untuk pelanggan B2B yang login (CORPORATE / RETAIL).
                    </p>
                </div>
            </div>

            {/* Discount rule cards */}
            <div className="space-y-4">
                {RULE_GROUPS.map((group) => {
                    const existingRule = rules.find(r => r.categoryGroup === group.key);
                    return (
                        <DiscountRuleForm
                            key={group.key}
                            groupKey={group.key}
                            groupLabel={group.label}
                            defaultDesc={group.defaultDesc}
                            initialData={existingRule}
                            accent={group.accent}
                        />
                    );
                })}
            </div>
        </div>
    );
}
