import { NextResponse } from 'next/server';
import NeonClient from "@/lib/database/NeonClient";

export async function POST(request: Request) {
    try {
        const data = await request.json();
        console.log("Received data:", data);
        const text = data.text;
        const rippleId = Number(data.id);
        const neon = await NeonClient.getInstance();
        const result = await neon.postCommentToRipple(text, rippleId);
        
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return NextResponse.json(
            { message: 'Error processing data', error: "problem" },
            { status: 500 }
        );
    }
}