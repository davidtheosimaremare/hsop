import { NextResponse } from 'next/server';
import { processWebhook } from '@/app/actions/webhook';

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const payload = JSON.parse(rawBody);

        // Forward to HSO Webhook (Fire and forget)
        try {
            const forwardHeaders = new Headers();
            req.headers.forEach((v, k) => {
                const lowerK = k.toLowerCase();
                if (!['host', 'connection', 'content-length'].includes(lowerK)) {
                    forwardHeaders.set(k, v);
                }
            });
            
            fetch('https://frmcfdelyznzpyctiugm.supabase.co/functions/v1/accurate-webhook-handler', {
                method: 'POST',
                headers: forwardHeaders,
                body: rawBody
            }).catch(e => console.error("HSO Forwarding error:", e));
        } catch (fwdErr) {
            console.error("HSO Forwarding setup error:", fwdErr);
        }

        // Accurate usually sends event type in headers or body.
        let event = req.headers.get("X-Accurate-Event") || (Array.isArray(payload) ? payload[0]?.type : payload.event) || "UNKNOWN";

        const result = await processWebhook(event, payload);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Webhook API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
