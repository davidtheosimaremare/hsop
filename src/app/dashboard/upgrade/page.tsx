"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/app/actions/upload";
import { submitUpgradeRequest } from "@/app/actions/upgrade";

export default function UpgradeAccountPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [requestType, setRequestType] = useState<"RESELLER" | "EXCLUSIVE">("RESELLER");

    // Form State
    const [ktpName, setKtpName] = useState("");

    // File State
    const [ktpFile, setKtpFile] = useState<File | null>(null);
    const [npwpFile, setNpwpFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "ktp" | "npwp") => {
        if (e.target.files && e.target.files[0]) {
            if (type === "ktp") setKtpFile(e.target.files[0]);
            if (type === "npwp") setNpwpFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Upload Files
            let ktpUrl = "";
            let npwpUrl = "";

            if (!ktpFile) {
                toast.error("Mohon upload foto KTP");
                setIsLoading(false);
                return;
            }

            const ktpFormData = new FormData();
            ktpFormData.append("file", ktpFile);
            const ktpUpload = await uploadFile(ktpFormData);

            if (!ktpUpload.success || !ktpUpload.url) {
                throw new Error("Gagal upload KTP");
            }
            ktpUrl = ktpUpload.url;

            if (npwpFile) {
                const npwpFormData = new FormData();
                npwpFormData.append("file", npwpFile);
                const npwpUpload = await uploadFile(npwpFormData);
                if (npwpUpload.success && npwpUpload.url) {
                    npwpUrl = npwpUpload.url;
                }
            }

            // 2. Submit Request
            const result = await submitUpgradeRequest({
                requestType: "RESELLER",
                ktpName,
                ktp: ktpUrl,
                npwp: npwpUrl
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Permintaan upgrade berhasil dikirim!");
                router.push("/dashboard/settings");
            }

        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulir Upgrade Reseller</h2>
            <p className="text-gray-500 mb-8">
                Isi formulir di bawah ini untuk mengajukan upgrade akun Anda menjadi Reseller Resmi.
                Pastikan data profil Anda (Nomor Telepon & Alamat) sudah lengkap sebelum mengajukan.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 2. Data Diri */}
                <div className="space-y-4">
                    <Label className="text-base font-semibold">Data Diri</Label>

                    <div className="space-y-2">
                        <Label>Nama Lengkap Sesuai KTP</Label>
                        <Input
                            placeholder="Nama Lengkap"
                            required
                            value={ktpName}
                            onChange={(e) => setKtpName(e.target.value)}
                        />
                    </div>
                </div>

                {/* 3. Upload Dokumen */}
                <div className="space-y-4">
                    <Label className="text-base font-semibold">Upload Dokumen</Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleFileChange(e, "ktp")}
                                required
                            />
                            {ktpFile ? (
                                <div className="flex flex-col items-center text-green-600">
                                    <CheckCircle2 className="w-8 h-8 mb-2" />
                                    <span className="text-sm font-medium truncate max-w-[200px]">{ktpFile.name}</span>
                                    <span className="text-xs text-gray-500">Klik untuk ganti</span>
                                </div>
                            ) : (
                                <>
                                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-gray-700">Upload Foto KTP</span>
                                    <span className="text-xs text-gray-500 mt-1">Wajib (Max 5MB)</span>
                                </>
                            )}
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleFileChange(e, "npwp")}
                            />
                            {npwpFile ? (
                                <div className="flex flex-col items-center text-green-600">
                                    <CheckCircle2 className="w-8 h-8 mb-2" />
                                    <span className="text-sm font-medium truncate max-w-[200px]">{npwpFile.name}</span>
                                    <span className="text-xs text-gray-500">Klik untuk ganti</span>
                                </div>
                            ) : (
                                <>
                                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-gray-700">Upload Foto NPWP</span>
                                    <span className="text-xs text-gray-500 mt-1">Opsional (Max 5MB)</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <p>
                        Permintaan Anda akan ditinjau oleh tim kami dalam waktu 1x24 jam.
                        Pastikan data yang Anda masukkan benar dan valid.
                    </p>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="outline" className="mr-4" onClick={() => router.back()}>
                        Batal
                    </Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white min-w-[150px]" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mengirim...
                            </>
                        ) : (
                            "Kirim Permintaan"
                        )}
                    </Button>
                </div>

            </form>
        </div>
    );
}
