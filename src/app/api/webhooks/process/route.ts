import { NextResponse } from 'next/server';
import { processQueueAction } from '@/app/actions/webhook';

export async function GET() {
    try {
        const result = await processQueueAction();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Queue API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * Also support POST for triggering via different methods
 */
export async function POST() {
    try {
        const result = await processQueueAction();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Queue API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
