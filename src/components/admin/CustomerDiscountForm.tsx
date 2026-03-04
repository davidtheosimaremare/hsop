"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCustomerDiscounts } from "@/app/actions/customer";
import { Loader2, Save, Plug2, CircuitBoard, Flashlight, Percent, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

const calculateEffectiveDiscount = (expression: string): number => {
    if (!expression) return 0;
    const parts = expression.split('+').map(p => parseFloat(p.trim()));
    if (parts.some(isNaN)) return 0;
    const multiplier = parts.reduce((acc, curr) => acc * (1 - curr / 100), 1);
    return (1 - multiplier) * 100;
};

const DiscountRow = ({
    icon: Icon,
    label,
    color,
    valueStock,
    setValueStock,
    valueIndent,
    setValueIndent,
}: {
    icon: any;
    label: string;
    color: "blue" | "red" | "emerald";
    valueStock: string;
    setValueStock: (v: string) => void;
    valueIndent: string;
    setValueIndent: (v: string) => void;
}) => {
    const effectiveStock = calculateEffectiveDiscount(valueStock);
    const effectiveIndent = calculateEffectiveDiscount(valueIndent);

    const dotColor = { blue: "bg-blue-500", red: "bg-red-500", emerald: "bg-emerald-500" }[color];
    const iconBg = { blue: "bg-blue-50 text-blue-500", red: "bg-red-50 text-red-500", emerald: "bg-emerald-50 text-emerald-500" }[color];

    const renderInput = (val: string, setVal: (v: string) => void, placeholder: string, effective: number) => (
        <div className="relative">
            <Input
                type="text"
                value={val}
                onChange={(e) => {
                    const v = e.target.value;
                    if (/^[\d+.\s]*$/.test(v)) setVal(v);
                }}
                placeholder={placeholder}
                className="h-8 text-xs font-black text-right pr-6 rounded-lg border-gray-100 bg-gray-50 focus:bg-white"
            />
            <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gray-300 pointer-events-none" />
            {val.includes('+') && (
                <span className="absolute -bottom-4 right-0 text-[8px] font-bold text-gray-400 italic">Eff: {effective.toFixed(1)}%</span>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-[auto_1fr_1fr] gap-3 items-center py-3 border-b border-gray-50 last:border-0">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Ready Stock</p>
                {renderInput(valueStock, setValueStock, "0", effectiveStock)}
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Indent</p>
                {renderInput(valueIndent, setValueIndent, "0", effectiveIndent)}
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
                router.refresh();
            } else {
                alert(`Gagal menyimpan diskon: ${res.error}`);
            }
        });
    };

    return (
        <div className="space-y-3">

            <div>
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Siemens LP
                </p>
                <DiscountRow icon={Plug2} label="LP" color="blue" valueStock={lp} setValueStock={setLP} valueIndent={lpIndent} setValueIndent={setLPIndent} />
            </div>

            <div>
                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Siemens CP
                </p>
                <DiscountRow icon={CircuitBoard} label="CP" color="red" valueStock={cp} setValueStock={setCP} valueIndent={cpIndent} setValueIndent={setCPIndent} />
            </div>

            <div>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Lighting / Portable
                </p>
                <DiscountRow icon={Flashlight} label="Lighting" color="emerald" valueStock={lighting} setValueStock={setLighting} valueIndent={lightingIndent} setValueIndent={setLightingIndent} />
            </div>

            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl mt-2">
                <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-[9px] font-bold text-gray-500 leading-relaxed">
                    Format diskon bertingkat: <span className="text-gray-900 font-black">40+10+5</span>. Sistem kalkulasi otomatis nilai efektif.
                </p>
            </div>

            <Button
                onClick={handleSave}
                disabled={isPending}
                className="bg-gray-900 hover:bg-black text-white w-full h-9 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]"
            >
                {isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Simpan Diskon
            </Button>
        </div>
    );
}
