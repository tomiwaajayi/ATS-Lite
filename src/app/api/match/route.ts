import { NextRequest } from 'next/server';
import { loadCandidatesServer } from '@/services/candidates-server';
import { runMCPWorkflow } from '@/services/mcp/workflow';
import { createStreamWriter } from '@/services/streaming';
import { Candidate } from '@/types';

// Don't reload the CSV file every time
let candidatesCache: Candidate[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // Cache for 5 minutes

async function getCachedCandidates(): Promise<Candidate[]> {
  const now = Date.now();
  if (candidatesCache && now - cacheTime < CACHE_TTL) {
    return candidatesCache;
  }

  console.log('Loading candidates from CSV...');
  candidatesCache = await loadCandidatesServer('candidates.csv');
  cacheTime = now;
  console.log(`Cached ${candidatesCache.length} candidates`);
  return candidatesCache;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage?.content) {
      return new Response('No message content provided', { status: 400 });
    }

    // Load candidates (cached)
    const candidates = await getCachedCandidates();

    // Make sure we have the OpenAI key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Set up streaming
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const streamWriter = createStreamWriter(writer);

    console.log('Starting MCP workflow...');
    // Start the main workflow
    runMCPWorkflow(streamWriter, lastMessage.content, candidates).catch(error => {
      console.error('MCP Workflow failed:', error);
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}
