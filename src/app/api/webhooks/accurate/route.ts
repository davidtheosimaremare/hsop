import { NextResponse } from 'next/server';
import { processWebhook } from '@/app/actions/webhook';

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Accurate usually sends event type in headers or body.
        let event = req.headers.get("X-Accurate-Event") || (Array.isArray(payload) ? payload[0]?.type : payload.event) || "UNKNOWN";

        const result = await processWebhook(event, payload);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Webhook API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
