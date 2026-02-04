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
    discountCP: string;
    discountLighting: string;
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
    value,
    setValue,
    color
}: {
    icon: any,
    label: string,
    description: string,
    value: string,
    setValue: (v: string) => void,
    color: "yellow" | "blue" | "orange"
}) => {
    const effective = calculateEffectiveDiscount(value);

    const colorStyles = {
        yellow: { bg: "bg-yellow-100", text: "text-yellow-600", bar: "bg-yellow-500", border: "focus-within:ring-yellow-500/20" },
        blue: { bg: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-500", border: "focus-within:ring-blue-500/20" },
        orange: { bg: "bg-orange-100", text: "text-orange-600", bar: "bg-orange-500", border: "focus-within:ring-orange-500/20" }
    };

    const styles = colorStyles[color];

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
            <div className={`p-4 rounded-2xl ${styles.bg} shrink-0`}>
                <Icon className={`h-6 w-6 ${styles.text}`} />
            </div>
            <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Label className="text-base font-bold text-gray-900">{label}</Label>
                            {/* Optional: Add badge here if needed */}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 w-full sm:w-auto">
                        <div className={`flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm focus-within:ring-4 ${styles.border} focus-within:border-${color}-500 transition-all w-full sm:w-auto`}>
                            <Input
                                type="text"
                                value={value}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^[\d+.\s]*$/.test(val)) setValue(val);
                                }}
                                placeholder="0"
                                className="w-full sm:w-24 text-right font-mono font-bold text-lg border-none bg-transparent focus-visible:ring-0 h-10 p-0"
                            />
                            <span className="text-sm font-semibold text-gray-400 pr-3 select-none">%</span>
                        </div>
                        {value.includes('+') && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                Efektif: {effective.toFixed(2)}%
                            </span>
                        )}
                    </div>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${styles.bar} transition-all duration-500 ease-out`}
                        style={{ width: `${Math.min(effective, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export function CustomerDiscountForm({ customerId, discountLP, discountCP, discountLighting }: CustomerDiscountFormProps) {
    const [lp, setLP] = useState<string>(String(discountLP));
    const [cp, setCP] = useState<string>(String(discountCP));
    const [lighting, setLighting] = useState<string>(String(discountLighting));

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateCustomerDiscounts(customerId, lp, cp, lighting);
            if (res.success) {
                alert("Diskon berhasil disimpan!");
                router.refresh();
            } else {
                alert("Gagal menyimpan diskon.");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <DiscountItem
                    icon={Plug2}
                    label="Electrical Products"
                    description="Low Voltage, MCB, MCCB, dan komponen panel (LP)."
                    value={lp}
                    setValue={setLP}
                    color="yellow"
                />

                <DiscountItem
                    icon={CircuitBoard}
                    label="Control Products"
                    description="Sensor, relay, kontaktor, dan otomatisasi (CP)."
                    value={cp}
                    setValue={setCP}
                    color="blue"
                />

                <DiscountItem
                    icon={Flashlight}
                    label="Portable Lighting"
                    description="Lampu portable dan aksesoris pencahayaan."
                    value={lighting}
                    setValue={setLighting}
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
