"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Mail, MessageCircle } from "lucide-react";
import { getSiteSetting, updateSiteSetting } from "@/app/actions/settings";

export default function AdminSettingsPage() {
    const [notifEmail, setNotifEmail] = useState("modibiid@gmail.com");
    const [salesPhone, setSalesPhone] = useState("081249009899");

    // WhatsApp Widget Config
    const [whatsappNumber, setWhatsappNumber] = useState("6281234567890");
    const [whatsappMessage, setWhatsappMessage] = useState("Halo Admin, saya mau tanya...");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            // Load Notification settings
            const notifResult = await getSiteSetting("notification_email") as Record<string, string> | null;
            if (notifResult?.email) setNotifEmail(notifResult.email);
            if (notifResult?.phone) setSalesPhone(notifResult.phone);

            // Load WhatsApp Widget settings
            const waResult = await getSiteSetting("whatsapp_config") as Record<string, string> | null;
            if (waResult?.number) setWhatsappNumber(waResult.number);
            if (waResult?.message) setWhatsappMessage(waResult.message);

        } catch (e) { /* use defaults */ }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaved(false);

        // Save Notification Settings
        await updateSiteSetting("notification_email", {
            email: notifEmail,
            phone: salesPhone,
        });

        // Save WhatsApp Widget Settings
        await updateSiteSetting("whatsapp_config", {
            number: whatsappNumber,
            message: whatsappMessage,
        });

        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Notifikasi Pesanan</h1>
            <p className="text-sm text-gray-500">Atur email dan nomor HP yang menerima notifikasi saat ada permintaan penawaran harga baru.</p>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-red-600" />
                        Pengaturan Notifikasi
                    </CardTitle>
                    <CardDescription>
                        Notifikasi akan dikirim ke email dan WhatsApp berikut setiap ada RFQ baru
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Email Sales</Label>
                                <Input
                                    type="email"
                                    value={notifEmail}
                                    onChange={(e) => setNotifEmail(e.target.value)}
                                    placeholder="email@example.com"
                                />
                                <p className="text-[11px] text-gray-500">
                                    Notifikasi RFQ akan dikirim ke email ini
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>No. HP Sales (WhatsApp)</Label>
                                <Input
                                    type="tel"
                                    value={salesPhone}
                                    onChange={(e) => setSalesPhone(e.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                />
                                <p className="text-[11px] text-gray-500">
                                    Notifikasi WhatsApp akan dikirim ke nomor ini
                                </p>
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !notifEmail.includes("@")}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : saved ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Tersimpan!
                                    </>
                                ) : (
                                    "Simpan Pengaturan"
                                )}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                        Pengaturan Chat WhatsApp
                    </CardTitle>
                    <CardDescription>
                        Konfigurasi tombol floating WhatsApp yang muncul di halaman pengunjung.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Nomor WhatsApp Admin</Label>
                                <Input
                                    type="tel"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                    placeholder="6281234567890"
                                />
                                <p className="text-[11px] text-gray-500">
                                    Gunakan format internasional (cth: 628...) tanpa tanda plus (+) atau spasi.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Pesan Default</Label>
                                <Input
                                    value={whatsappMessage}
                                    onChange={(e) => setWhatsappMessage(e.target.value)}
                                    placeholder="Halo Admin, saya mau tanya..."
                                />
                                <p className="text-[11px] text-gray-500">
                                    Pesan yang otomatis terisi saat customer membuka WhatsApp.
                                </p>
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : saved ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Tersimpan!
                                    </>
                                ) : (
                                    "Simpan Pengaturan Chat"
                                )}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
