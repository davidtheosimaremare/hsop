"use client";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { googleLoginAction } from "@/app/actions/auth";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GoogleLoginButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // Use placeholder if clientId is missing to avoid crashing the app during development
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID";

    const handleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        setError("");
        
        try {
            const result = await googleLoginAction(credentialResponse.credential);
            
            if (result.error) {
                setError(result.error);
                setIsLoading(false);
            } else if (result.success) {
                // Hard redirect to ensure auth state updates globally
                window.location.href = result.redirectUrl || "/";
            }
        } catch (err) {
            setError("Terjadi kesalahan sistem saat login Google.");
            setIsLoading(false);
        }
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="w-full flex flex-col items-center justify-center space-y-2 mt-4">
                {error && <p className="text-xs text-red-600">{error}</p>}
                
                {isLoading ? (
                    <div className="w-full h-10 border border-gray-300 rounded-md flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                        <span className="ml-2 text-sm text-gray-600">Sedang memproses...</span>
                    </div>
                ) : (
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => {
                            setError("Login Google dibatalkan atau gagal.");
                        }}
                        useOneTap
                        shape="rectangular"
                        theme="outline"
                        text="signin_with"
                        size="large"
                        width="100%"
                    />
                )}
            </div>
        </GoogleOAuthProvider>
    );
}
