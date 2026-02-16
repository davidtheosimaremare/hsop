"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Loader2, X } from "lucide-react";
import { saveDiscountRule } from "@/app/actions/discount";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface DiscountRuleFormProps {
    groupKey: string;
    groupLabel: string;
    defaultDesc: string;
    initialData?: any;
}

export function DiscountRuleForm({ groupKey, groupLabel, defaultDesc, initialData }: DiscountRuleFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Discounts

    // Discounts
    const [stockDiscount, setStockDiscount] = useState<string>(initialData?.stockDiscount || "0");
    const [indentDiscount, setIndentDiscount] = useState<string>(initialData?.indentDiscount || "0");



    const handleSave = async () => {
        setIsLoading(true);
        try {
            const result = await saveDiscountRule({
                categoryGroup: groupKey,
                description: groupLabel,
                stockDiscount,
                indentDiscount,
            });

            if (result.success) {
                alert("Pengaturan tersimpan!");
            } else {
                alert(result.error || "Gagal menyimpan.");
            }
        } catch (error) {
            console.error(error);
            alert("Error saving rule.");
        } finally {
            setIsLoading(false);
        }
    };





    return (
        <Card>
            <CardHeader>
                <CardTitle>{groupLabel}</CardTitle>
                <CardDescription>
                    Atur diskon default untuk grup kategori ini.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Category Selector */}


                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-6">
                    {/* Stock Logic */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-3 w-3 rounded-full bg-green-500" />
                            <h4 className="font-semibold text-sm">Jika Stok READY ( &gt; 0 )</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label>Diskon Stok (%)</Label>
                                <Input
                                    type="text"
                                    value={stockDiscount}
                                    onChange={e => setStockDiscount(e.target.value)}
                                    placeholder="Contoh: 30+35"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Format: gunakan "+" untuk diskon bertingkat. Contoh: "30+35"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Indent Logic */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-3 w-3 rounded-full bg-orange-400" />
                            <h4 className="font-semibold text-sm">Jika Stok KOSONG / INDENT ( &lt;= 0 )</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label>Diskon Indent (%)</Label>
                                <Input
                                    type="text"
                                    value={indentDiscount}
                                    onChange={e => setIndentDiscount(e.target.value)}
                                    placeholder="Contoh: 30+35"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Format: gunakan "+" untuk diskon bertingkat. Contoh: "30+35"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Simpan Pengaturan
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
