import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { duration, mood, focus, note, tasks } = body;

        await new Promise((resolve) => setTimeout(resolve, 300));

        return NextResponse.json({
            success: true,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            duration,
            mood,
            focus,
            note,
            tasks,
        });
    } catch {
        return NextResponse.json(
            { success: false, error: "Failed to save session report" },
            { status: 500 }
        );
    }
}
