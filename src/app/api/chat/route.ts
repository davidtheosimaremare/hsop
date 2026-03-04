import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const rateLimit = new Map<string, { count: number; lastReset: number }>();

const groq = createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
    // Simple IP-based Rate Limiting (In-Memory)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 30; // Limit per IP (Groq allow more)

    const record = rateLimit.get(ip) || { count: 0, lastReset: now };

    if (now - record.lastReset > windowMs) {
        record.count = 0;
        record.lastReset = now;
    }

    if (record.count >= maxRequests) {
        return new Response("Too many requests. Please try again later.", { status: 429 });
    }

    record.count++;
    rateLimit.set(ip, record);

    const { messages } = await req.json();

    console.log("Incoming messages (raw):", JSON.stringify(messages, null, 2));

    // Manual core message conversion for Groq compatibility
    const coreMessages: any[] = [];

    for (const m of messages) {
        // Skip the initial welcome message from the UI
        if (m.id === 'welcome') continue;

        if (m.role === 'user') {
            coreMessages.push({ role: 'user', content: m.content });
        } else if (m.role === 'assistant') {
            if (m.toolInvocations) {
                // Assistant message with tool calls
                const toolCalls = m.toolInvocations.map((ti: any) => ({
                    type: 'function',
                    id: ti.toolCallId,
                    function: {
                        name: ti.toolName,
                        arguments: JSON.stringify(ti.args),
                    },
                }));
                coreMessages.push({ role: 'assistant', content: m.content || "", tool_calls: toolCalls });

                // Tool result messages
                for (const ti of m.toolInvocations) {
                    if ('result' in ti) {
                        coreMessages.push({
                            role: 'tool',
                            tool_call_id: ti.toolCallId,
                            content: JSON.stringify(ti.result),
                        });
                    }
                }
            } else {
                // Standard assistant message
                if (m.content && m.content.trim() !== "") {
                    coreMessages.push({ role: 'assistant', content: m.content });
                }
            }
        }
    }

    console.log("Sanitized Core Messages:", JSON.stringify(coreMessages, null, 2));

    try {
        const result = streamText({
            model: groq("llama-3.3-70b-versatile"),
            system: `You are Hokiindo Assistant, an intelligent virtual assistant for "Shop Hokiindo" (a Siemens Electrical Distributor in Indonesia).
        
        YOUR GOAL:
        Help customers find products and check their order status. Be friendly, professional, and concise.
        
        TOOLS:
        - use 'searchProducts' to find products when user asks for specific items (e.g., "Cari MCB", "Ada Contactor?").
        - use 'checkOrder' to check status when user provides a Quotation Number (e.g., "Status Q-2024...", "Cek pesanan").
        
        RULES:
        1. Language: Indonesian (Bahasa Indonesia).
        2. If you find products, listing them briefly is enough. The UI will show detailed cards.
        3. If you find an order, summarize the status.
        4. ABSOLUTELY CRITICAL: If you are UNSURE, if the tool returns no data, or if the user asks something outside your scope (like "Resep Masakan"), you MUST apologize and direct them to WhatsApp.
        
        WHATSAPP HANDOFF:
        "Maaf, saya tidak menemukan informasi tersebut. Silakan hubungi Admin kami via WhatsApp untuk bantuan lebih lanjut: https://wa.me/6281234567890"`,
            messages,
            tools: {
                searchProducts: tool({
                    description: "Search for products in the database by name, brand, or SKU",
                    parameters: z.object({
                        query: z.string().describe("The search keyword (e.g., 'MCB', 'Schneider')"),
                    }),
                    // @ts-ignore
                    execute: async ({ query }: { query: string }) => {
                        try {
                            const products = await db.product.findMany({
                                where: {
                                    OR: [
                                        { name: { contains: query, mode: "insensitive" } },
                                        { brand: { contains: query, mode: "insensitive" } },
                                        { sku: { contains: query, mode: "insensitive" } },
                                    ],
                                },
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                    price: true,
                                    image: true,
                                },
                                take: 5,
                            });
                            return products.length > 0 ? products : "No products found.";
                        } catch (err) {
                            return "Error searching products.";
                        }
                    },
                }),
                checkOrder: tool({
                    description: "Check the status of a sales quotation or order",
                    parameters: z.object({
                        quotationNo: z.string().describe("The quotation number (e.g., 'Q-2024-001')"),
                    }),
                    // @ts-ignore
                    execute: async ({ quotationNo }: { quotationNo: string }) => {
                        try {
                            const quotation = await db.salesQuotation.findUnique({
                                where: { quotationNo: quotationNo.toUpperCase() },
                                select: {
                                    quotationNo: true,
                                    status: true,
                                    totalAmount: true,
                                    trackingNumber: true,
                                    shippingNotes: true,
                                },
                            });
                            return quotation || "Order not found.";
                        } catch (err) {
                            return "Error checking order.";
                        }
                    },
                }),
            },
            // maxSteps removed as it is not supported in this version
        });

        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error("AI Stream Error:", error);
        const status = error.message?.includes("429") || error.status === 429 ? 429 : 500;
        return new Response(JSON.stringify({ error: error.message }), { status });
    }
}
