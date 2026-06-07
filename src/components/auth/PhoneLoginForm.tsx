"use client";

import { useState, useActionState, useEffect } from "react";
import { Loader2, ArrowRight, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPhoneOtpAction, verifyPhoneOtpAction } from "@/app/actions/auth";

export default function PhoneLoginForm() {
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [phone, setPhone] = useState("");

    // State for Request OTP Action
    const requestInitialState: any = { error: "", success: false, phone: "", message: "" };
    const [requestState, requestFormAction, isRequesting] = useActionState(requestPhoneOtpAction, requestInitialState);

    // State for Verify OTP Action
    const verifyInitialState: any = { error: "", success: false, redirectUrl: "" };
    const [verifyState, verifyFormAction, isVerifying] = useActionState(verifyPhoneOtpAction, verifyInitialState);

    useEffect(() => {
        if (requestState?.success) {
            setPhone(requestState.phone);
            setStep("otp");
        }
    }, [requestState?.success, requestState?.phone]);

    useEffect(() => {
        if (verifyState?.success) {
            window.location.href = verifyState.redirectUrl || "/";
        }
    }, [verifyState?.success, verifyState?.redirectUrl]);

    if (step === "otp") {
        return (
            <div className="space-y-4">
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-xs">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">OTP Terkirim</p>
                        <p>{requestState?.message || "Cek pesan WhatsApp Anda."}</p>
                    </div>
                </div>

                {verifyState?.error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
                        <EyeOff className="w-4 h-4 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Verifikasi Gagal</p>
                            <p>{verifyState.error}</p>
                        </div>
                    </div>
                )}

                <form action={verifyFormAction} className="space-y-4">
                    <input type="hidden" name="phone" value={phone} />
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Kode OTP
                        </label>
                        <Input
                            name="otp"
                            type="text"
                            placeholder="Masukkan 6 digit OTP"
                            className="h-10 text-sm tracking-widest text-center text-lg font-semibold"
                            maxLength={6}
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isVerifying}
                        className="w-full h-10 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-70"
                    >
                        {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verifikasi & Masuk"}
                    </Button>
                </form>

                <div className="text-center mt-4">
                    <button 
                        onClick={() => setStep("phone")}
                        className="text-xs text-gray-500 hover:text-gray-800 underline"
                        type="button"
                    >
                        Kembali atau ganti nomor HP
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requestState?.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
                    <EyeOff className="w-4 h-4 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Gagal</p>
                        <p>{requestState.error}</p>
                    </div>
                </div>
            )}

            <form action={requestFormAction} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nomor HP (WhatsApp)
                    </label>
                    <div className="relative flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            +62
                        </span>
                        <Input
                            name="phone"
                            type="tel"
                            placeholder="81234567890"
                            className="h-10 text-sm rounded-l-none"
                            required
                        />
                    </div>
                </div>
                <Button
                    type="submit"
                    disabled={isRequesting}
                    className="w-full h-10 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>Kirim OTP <ArrowRight className="w-4 h-4" /></>
                    )}
                </Button>
            </form>
        </div>
    );
}
