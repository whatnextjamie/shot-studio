import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';
import { STORYBOARD_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Convert UIMessage[] to ModelMessage[]
    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: anthropic('claude-3-5-sonnet-latest'),
      system: STORYBOARD_SYSTEM_PROMPT,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}