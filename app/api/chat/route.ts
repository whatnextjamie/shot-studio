import Anthropic from '@anthropic-ai/sdk';
import { STORYBOARD_SYSTEM_PROMPT } from '@/lib/ai/prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: STORYBOARD_SYSTEM_PROMPT,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Convert to ReadableStream
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta') {
            const text = chunk.delta.type === 'text_delta' ? chunk.delta.text : '';

            // Split text by newlines and prefix each line with 0:
            // This ensures multi-line chunks are properly formatted
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
              // Add 0: prefix to each line
              // For all lines except the last, add \n after
              const line = lines[i];
              if (i < lines.length - 1) {
                controller.enqueue(encoder.encode(`0:${line}\n`));
              } else {
                // Last line: only add \n if the original text ended with \n
                controller.enqueue(encoder.encode(`0:${line}\n`));
              }
            }
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}