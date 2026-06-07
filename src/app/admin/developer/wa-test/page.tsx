"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function WATestPage() {
    const [phone, setPhone] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSendTest = async () => {
        if (!phone || phone.length < 8) {
            setStatus("error");
            setMessage("Masukkan nomor handphone yang valid.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/admin/test-wa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatus("success");
                setMessage("Pesan WhatsApp test berhasil dikirim! Silakan periksa HP Anda.");
            } else {
                setStatus("error");
                setMessage(data.error || "Gagal mengirim pesan WhatsApp.");
            }
        } catch (error: any) {
            setStatus("error");
            setMessage(error.message || "Terjadi kesalahan jaringan.");
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">WhatsApp (Fontee) Tester</h1>
                <p className="text-muted-foreground mt-1">Uji coba konfigurasi pengiriman pesan WhatsApp menggunakan API Fontee.</p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        Kirim Pesan Percobaan
                    </CardTitle>
                    <CardDescription>
                        Sistem akan mencoba mengirimkan pesan teks ke nomor di bawah menggunakan token Fontee yang ada di file <code>.env</code>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nomor WhatsApp (Contoh: 08123456789)</label>
                        <Input 
                            type="tel" 
                            placeholder="08xxxxxxxx" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={status === "loading"}
                        />
                    </div>

                    <Button 
                        onClick={handleSendTest} 
                        disabled={status === "loading" || !phone}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    >
                        {status === "loading" ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mengirim...
                            </>
                        ) : (
                            <>Kirim Pesan Test</>
                        )}
                    </Button>

                    {status === "success" && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-start gap-3 mt-4 border border-green-200">
                            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="text-sm">{message}</div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 mt-4 border border-red-200">
                            <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold mb-1">Gagal mengirim:</p>
                                <p className="font-mono text-xs break-all">{message}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
