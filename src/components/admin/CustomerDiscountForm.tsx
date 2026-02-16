"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCustomerDiscounts } from "@/app/actions/customer";
import { Loader2, Save, Plug2, CircuitBoard, Flashlight } from "lucide-react";
import { useRouter } from "next/navigation";

interface CustomerDiscountFormProps {
    customerId: string;
    discountLP: string;
    discountLPIndent: string;
    discountCP: string;
    discountCPIndent: string;
    discountLighting: string;
    discountLightingIndent: string;
    mappings?: {
        LP: string[];
        CP: string[];
        LIGHTING: string[];
    };
}

// Helper to calculate effective discount for visualization
const calculateEffectiveDiscount = (expression: string): number => {
    if (!expression) return 0;

    // Split by '+' and clean whitespace
    const parts = expression.split('+').map(p => parseFloat(p.trim()));

    if (parts.some(isNaN)) return 0;

    // Calculate: Price * (1 - d1/100) * (1 - d2/100) ...
    // Effective Discount = 1 - (Result Multiplier)
    const multiplier = parts.reduce((acc, curr) => acc * (1 - curr / 100), 1);
    return (1 - multiplier) * 100;
};

const DiscountItem = ({
    icon: Icon,
    label,
    description,
    valueStock,
    setValueStock,
    valueIndent,
    setValueIndent,
    color
}: {
    icon: any,
    label: string,
    description: string,
    valueStock: string,
    setValueStock: (v: string) => void,
    valueIndent: string,
    setValueIndent: (v: string) => void,
    color: "yellow" | "blue" | "orange"
}) => {
    const effectiveStock = calculateEffectiveDiscount(valueStock);
    const effectiveIndent = calculateEffectiveDiscount(valueIndent);

    const colorStyles = {
        yellow: { bg: "bg-yellow-100", text: "text-yellow-600", bar: "bg-yellow-500", border: "focus-within:ring-yellow-500/20" },
        blue: { bg: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-500", border: "focus-within:ring-blue-500/20" },
        orange: { bg: "bg-orange-100", text: "text-orange-600", bar: "bg-orange-500", border: "focus-within:ring-orange-500/20" }
    };

    const styles = colorStyles[color];

    const renderInput = (val: string, setVal: (v: string) => void, labelType: "Ready Stock" | "Indent", effective: number) => (
        <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
            <span className="text-xs font-semibold text-gray-500 self-start mb-1">{labelType}</span>
            <div className={`flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm focus-within:ring-4 ${styles.border} focus-within:border-${color}-500 transition-all w-full sm:w-auto`}>
                <Input
                    type="text"
                    value={val}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (/^[\d+.\s]*$/.test(v)) setVal(v);
                    }}
                    placeholder="0"
                    className="w-full sm:w-24 text-right font-mono font-bold text-lg border-none bg-transparent focus-visible:ring-0 h-10 p-0"
                />
                <span className="text-sm font-semibold text-gray-400 pr-3 select-none">%</span>
            </div>
            {val.includes('+') && (
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    Efektif: {effective.toFixed(2)}%
                </span>
            )}
        </div>
    );

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
            <div className={`p-4 rounded-2xl ${styles.bg} shrink-0`}>
                <Icon className={`h-6 w-6 ${styles.text}`} />
            </div>
            <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                    <div className="sm:max-w-xs">
                        <div className="flex items-center gap-2 mb-1">
                            <Label className="text-base font-bold text-gray-900">{label}</Label>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        {renderInput(valueStock, setValueStock, "Ready Stock", effectiveStock)}
                        {renderInput(valueIndent, setValueIndent, "Indent", effectiveIndent)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export function CustomerDiscountForm({
    customerId,
    discountLP, discountLPIndent,
    discountCP, discountCPIndent,
    discountLighting, discountLightingIndent,
    mappings
}: CustomerDiscountFormProps) {
    const [lp, setLP] = useState<string>(String(discountLP));
    const [lpIndent, setLPIndent] = useState<string>(String(discountLPIndent || "0"));

    const [cp, setCP] = useState<string>(String(discountCP));
    const [cpIndent, setCPIndent] = useState<string>(String(discountCPIndent || "0"));

    const [lighting, setLighting] = useState<string>(String(discountLighting));
    const [lightingIndent, setLightingIndent] = useState<string>(String(discountLightingIndent || "0"));

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateCustomerDiscounts(customerId, lp, lpIndent, cp, cpIndent, lighting, lightingIndent);
            if (res.success) {
                alert("Diskon berhasil disimpan!");
                router.refresh();
            } else {
                alert(`Gagal menyimpan diskon: ${res.error}`);
            }
        });
    };

    const getDescription = (categories: string[] | undefined) => {
        if (!categories || categories.length === 0) {
            return "Silahkan pilih sub kategorinya.";
        }
        return categories.join(", ");
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <DiscountItem
                    icon={Plug2}
                    label="Siemens LP (Low Voltage)"
                    description={getDescription(mappings?.LP)}
                    valueStock={lp}
                    setValueStock={setLP}
                    valueIndent={lpIndent}
                    setValueIndent={setLPIndent}
                    color="yellow"
                />

                <DiscountItem
                    icon={CircuitBoard}
                    label="Siemens CP (Control Product)"
                    description={getDescription(mappings?.CP)}
                    valueStock={cp}
                    setValueStock={setCP}
                    valueIndent={cpIndent}
                    setValueIndent={setCPIndent}
                    color="blue"
                />

                <DiscountItem
                    icon={Flashlight}
                    label="Portable Lighting"
                    description={getDescription(mappings?.LIGHTING)}
                    valueStock={lighting}
                    setValueStock={setLighting}
                    valueIndent={lightingIndent}
                    setValueIndent={setLightingIndent}
                    color="orange"
                />
            </div>

            <div className="flex justify-end pt-2">
                <Button
                    onClick={handleSave}
                    disabled={isPending}
                    className="bg-[#E31E2D] hover:bg-[#C21A26] text-white w-full sm:w-auto"
                >
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Simpan Perubahan Diskon
                </Button>
            </div>
        </div>
    );
}
