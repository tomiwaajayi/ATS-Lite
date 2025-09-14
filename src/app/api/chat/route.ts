import { NextRequest } from 'next/server';
import { loadCandidatesServer } from '@/lib/candidates-server';
import { runMCPWorkflow } from '@/lib/mcp/workflow';
import { createStreamWriter } from '@/lib/streaming';
import { Candidate } from '@/types';

// Cache candidates data to avoid re-reading CSV on every request
let candidatesCache: Candidate[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    // Get cached candidates data
    const candidates = await getCachedCandidates();

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Create streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const streamWriter = createStreamWriter(writer);

    console.log('Starting MCP workflow...');
    // Run MCP workflow in background
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
