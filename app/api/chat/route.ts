import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AVAILABLE_TOOLS, runTool, ToolDefinition } from '@/lib/ai/tools-wrapper';

// --- Configuration ---
const BUN_AI_URL = process.env.BUN_AI_API_URL || 'https://ai.foodfastpro.com/chat';

// Generate System Prompt
const toolsDescription = AVAILABLE_TOOLS.map(t =>
    `- ${t.name}: ${t.description} Params: ${t.parameters}`
).join('\n');

const SYSTEM_PROMPT = `
You are a high-performance Business Intelligence AI.
Current Date: ${new Date().toISOString()}

AVAILABLE TOOLS:
${toolsDescription}

CRITICAL INSTRUCTIONS FOR SPEED AND TRUTH:
1. If the user asks for data present in the tools, DO NOT CHAT. IMMEDIATELY output the tool call JSON.
2. FORMAT: __TOOL_CALL__ {"name": "...", "args": { ... }}
3. NEVER invent or hallucinate data. If the tool returns no data, say "No encontré información para esa fecha".
4. If you don't call a tool, you CANNOT know the sales or orders. Do not guess.
5. After receiving the TOOL_RESULT, answer concisely in Spanish based ONLY on that result.
`;

export async function POST(req: NextRequest) {
    const interactionId = Math.random().toString(36).substring(7);
    console.time(`[${interactionId}] Total Request`);

    // 1. Auth Check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: businessman } = await supabase
        .from('businessmans')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!businessman) {
        return new NextResponse("Business profile not found", { status: 404 });
    }

    const businessmanId = businessman.id;

    // 2. Parse Request
    const body = await req.json();
    const messages = body.messages || [];

    // Inject System Prompt if not present
    if (messages.length === 0 || messages[0].role !== 'system') {
        messages.unshift({ role: 'system', content: SYSTEM_PROMPT });
    }

    console.log(`[${interactionId}] Sending request to AI (First Pass)...`);
    console.time(`[${interactionId}] AI First Pass`);

    // 3. Step A: Call Bun AI
    try {
        const response = await fetch(BUN_AI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });
        console.timeEnd(`[${interactionId}] AI First Pass`);

        if (!response.ok || !response.body) {
            console.error(`[${interactionId}] AI Error Status: ${response.status}`);
            return new NextResponse("Error communicating with AI service", { status: 502 });
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let accumulatedText = "";
        let isToolCall = false;
        let toolCallBuffer: Uint8Array[] = [];
        let bufferLength = 0;

        // Fast detection loop
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            toolCallBuffer.push(value);
            bufferLength += value.length;
            accumulatedText += decoder.decode(value, { stream: true });

            // Check pattern aggressively
            if (accumulatedText.includes("__TOOL_CALL__")) {
                isToolCall = true;
                // Consume rest
                while (true) {
                    const { done: d2, value: v2 } = await reader.read();
                    if (d2) break;
                    accumulatedText += decoder.decode(v2, { stream: true });
                }
                break;
            }

            // Lower buffer threshold for speed perceived
            if (accumulatedText.length > 50 && !accumulatedText.includes("_")) {
                // If 50 chars in and no underscore, probably not a tool call (heuristic optimization)
                break;
            }
            // Absolute safety max
            if (bufferLength > 300) break;
        }

        if (isToolCall) {
            console.log(`[${interactionId}] Tool Call Detected`);
            const jsonStr = accumulatedText.split('__TOOL_CALL__')[1].trim();
            let toolCall;
            try {
                toolCall = JSON.parse(jsonStr);
            } catch (e) {
                console.error(`[${interactionId}] JSON Parse Error:`, jsonStr);
                return new NextResponse("Error parsing AI tool request", { status: 500 });
            }

            console.time(`[${interactionId}] Tool Execution (${toolCall.name})`);
            const result = await runTool(toolCall.name, toolCall.args, businessmanId);
            console.timeEnd(`[${interactionId}] Tool Execution (${toolCall.name})`);

            messages.push({ role: 'assistant', content: accumulatedText });
            messages.push({ role: 'system', content: `TOOL_RESULT: ${JSON.stringify(result)}` });

            console.log(`[${interactionId}] Sending request to AI (Second Pass)...`);
            console.time(`[${interactionId}] AI Second Pass`);

            const finalResponse = await fetch(BUN_AI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });

            console.timeEnd(`[${interactionId}] AI Second Pass`);
            console.timeEnd(`[${interactionId}] Total Request`);

            return new NextResponse(finalResponse.body);

        } else {
            // Stream immediately
            const stream = new ReadableStream({
                async start(controller) {
                    for (const chunk of toolCallBuffer) {
                        controller.enqueue(chunk);
                    }
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        controller.enqueue(value);
                    }
                    controller.close();
                    console.timeEnd(`[${interactionId}] Total Request`);
                }
            });
            return new NextResponse(stream);
        }

    } catch (e) {
        console.error(`[${interactionId}] Fatal Error:`, e);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
