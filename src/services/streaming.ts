import { StreamChunk } from '@/types';

export interface StreamWriter {
  write: (chunk: StreamChunk) => Promise<void>;
  close: () => Promise<void>;
}

export function createStreamWriter(writer: WritableStreamDefaultWriter<Uint8Array>): StreamWriter {
  const encoder = new TextEncoder();

  return {
    async write(chunk: StreamChunk) {
      const data = JSON.stringify(chunk) + '\n';
      await writer.write(encoder.encode(data));
    },

    async close() {
      await writer.close();
    },
  };
}

export async function sendPhaseUpdate(writer: StreamWriter, chunk: StreamChunk): Promise<void> {
  // Ensure timestamp is set if not provided
  if (!chunk.timestamp) {
    chunk.timestamp = new Date();
  }
  await writer.write(chunk);
}

// Client-side stream parser
export class StreamParser {
  private decoder = new TextDecoder();
  private buffer = '';

  parse(chunk: Uint8Array): StreamChunk[] {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    return lines
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as StreamChunk;
        } catch (e) {
          console.error('Failed to parse stream chunk:', line, e);
          return null;
        }
      })
      .filter((chunk): chunk is StreamChunk => chunk !== null);
  }

  flush(): StreamChunk[] {
    if (!this.buffer.trim()) return [];

    try {
      const chunk = JSON.parse(this.buffer) as StreamChunk;
      this.buffer = '';
      return [chunk];
    } catch (e) {
      console.error('Failed to parse remaining buffer:', this.buffer, e);
      this.buffer = '';
      return [];
    }
  }
}
