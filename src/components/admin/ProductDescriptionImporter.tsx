"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { importProductDescriptionBatchAction } from "@/app/actions/import-product-descriptions";
import Papa from "papaparse";

export function ProductDescriptionImporter() {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Progress State
    const [progress, setProgress] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [processedItems, setProcessedItems] = useState(0);
    const [successCount, setSuccessCount] = useState(0);
    const [failCount, setFailCount] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            resetStats();
        }
    };

    const resetStats = () => {
        setProgress(0);
        setTotalItems(0);
        setProcessedItems(0);
        setSuccessCount(0);
        setFailCount(0);
        setErrors([]);
        setIsComplete(false);
    };

    const handleImport = async () => {
        if (!file) return;
        setIsLoading(true);
        resetStats();

        // 1. Parse CSV Client-Side
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim().toLowerCase(),
            complete: async (results) => {
                const rows = results.data as any[];
                if (rows.length === 0) {
                    setErrors(["File is empty"]);
                    setIsLoading(false);
                    return;
                }

                // Identify Columns
                const keys = Object.keys(rows[0]);
                const skuKey = keys.find(k => k === "sku" || k === "no" || k === "item no");
                const descKey = keys.find(k => k === "description" || k === "desc" || k === "deskripsi");

                if (!skuKey || !descKey) {
                    setErrors(["CSV must have 'sku' and 'description' columns"]);
                    setIsLoading(false);
                    return;
                }

                // Filter valid rows
                const validRows = rows.filter(r => r[skuKey]?.trim() && r[descKey]?.trim()).map(r => ({
                    sku: r[skuKey].trim(),
                    description: r[descKey].trim()
                }));

                const total = validRows.length;
                setTotalItems(total);

                if (total === 0) {
                    setErrors(["No valid rows found (check empty SKU or Description)"]);
                    setIsLoading(false);
                    return;
                }

                // 2. Batch Processing
                const BATCH_SIZE = 20; // Process 20 items at a time

                let currentSuccess = 0;
                let currentFail = 0;
                let currentProcessed = 0;
                const currentErrors: string[] = [];

                for (let i = 0; i < total; i += BATCH_SIZE) {
                    const batch = validRows.slice(i, i + BATCH_SIZE);

                    try {
                        const result = await importProductDescriptionBatchAction(batch);

                        // Update stats
                        if (result) {
                            currentSuccess += result.processed || 0;
                            currentFail += result.failed || 0;
                            if (result.errors) {
                                currentErrors.push(...result.errors);
                            }
                        }
                    } catch (err) {
                        console.error("Batch error", err);
                        currentFail += batch.length;
                        currentErrors.push(`Batch ${i}-${i + BATCH_SIZE} failed entirely.`);
                    }

                    currentProcessed += batch.length;

                    // Update React State
                    setProcessedItems(currentProcessed);
                    setSuccessCount(currentSuccess);
                    setFailCount(currentFail);
                    setErrors(prev => [...prev, ...(currentErrors.slice(prev.length))]); // Append new errors
                    setProgress(Math.round((currentProcessed / total) * 100));
                }

                setIsLoading(false);
                setIsComplete(true);
            },
            error: (err) => {
                console.error("CSV Parse Error", err);
                setErrors([`Failed to parse CSV: ${err.message}`]);
                setIsLoading(false);
            }
        });
    };

    const resetDialog = () => {
        setOpen(false);
        setFile(null);
        resetStats();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!isLoading) setOpen(v); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Import Deskripsi CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Batch Import Descriptions</DialogTitle>
                    <DialogDescription>
                        Upload file CSV (SKU, Description).
                        Proses akan berjalan bertahap. Jangan tutup jendela ini.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!isComplete && !isLoading && processedItems === 0 ? (
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="csv-file-desc">CSV File</Label>
                            <Input
                                id="csv-file-desc"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                            />
                            <p className="text-xs text-gray-500">
                                Contoh: SKU, Description. Support ~1000+ baris.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progress: {progress}%</span>
                                    <span>{processedItems} / {totalItems}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-green-50 border border-green-100 rounded-md flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Berhasil</p>
                                        <p className="text-xl font-bold text-green-700">{successCount}</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-red-50 border border-red-100 rounded-md flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Gagal</p>
                                        <p className="text-xl font-bold text-red-700">{failCount}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Error Log */}
                            {errors.length > 0 && (
                                <div className="border rounded-md bg-gray-50 max-h-[150px] overflow-y-auto p-2">
                                    <p className="text-xs font-semibold mb-1 text-gray-700 sticky top-0 bg-gray-50 pb-1 border-b">Error Log:</p>
                                    <ul className="space-y-1">
                                        {errors.map((err, i) => (
                                            <li key={i} className="text-xs text-red-600 font-mono">{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {isComplete && (
                                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Proses Selesai!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" onClick={resetDialog} disabled={isLoading}>
                        {isComplete ? "Tutup" : "Batal"}
                    </Button>
                    {!isComplete && !isLoading && (
                        <Button onClick={handleImport} disabled={!file} className="bg-red-600 hover:bg-red-700">
                            <Upload className="mr-2 h-4 w-4" />
                            Mulai Import
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
