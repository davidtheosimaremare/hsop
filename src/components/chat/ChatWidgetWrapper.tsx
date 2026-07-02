"use client";

import { useAuth } from "@/components/auth/CanAccess";
import ChatWidget from "@/components/chat/ChatWidget";

interface ChatWidgetWrapperProps {
    phoneNumber?: string;
    message?: string;
}

/**
 * Wrapper yang mengambil customerId dari AuthContext (client-side)
 * dan meneruskannya ke ChatWidget agar AI bisa menghitung harga diskon.
 */
export default function ChatWidgetWrapper({ phoneNumber, message }: ChatWidgetWrapperProps) {
    const { user } = useAuth();
    const customerId = (user as any)?.customerId || null;

    return (
        <ChatWidget
            phoneNumber={phoneNumber}
            message={message}
            customerId={customerId}
        />
    );
}
