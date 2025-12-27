/**
 * Fetch Interceptor
 *
 * This module is loaded via NODE_OPTIONS --import to intercept
 * all fetch() calls made by Claude Code to the Anthropic API.
 *
 * It logs request/response pairs to JSONL for later analysis.
 * Handles both regular JSON responses and SSE streaming responses.
 */

import * as fs from 'fs';

const outputPath = process.env.CLAUDE_WORKFLOW_OUTPUT;
const ANTHROPIC_API_HOST = 'api.anthropic.com';

// Types for SSE parsing
interface ContentBlock {
  type: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  text?: string;
}

interface StreamingMessage {
  id?: string;
  model?: string;
  role?: string;
  content: ContentBlock[];
  stop_reason?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

/**
 * Parse SSE data from a chunk of text
 */
function parseSSEEvents(text: string): Array<{ event?: string; data?: string }> {
  const events: Array<{ event?: string; data?: string }> = [];
  const lines = text.split('\n');

  let currentEvent: { event?: string; data?: string } = {};

  for (const line of lines) {
    if (line.startsWith('event:')) {
      currentEvent.event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      currentEvent.data = line.slice(5).trim();
    } else if (line === '' && (currentEvent.event || currentEvent.data)) {
      events.push(currentEvent);
      currentEvent = {};
    }
  }

  // Don't forget the last event if there's no trailing newline
  if (currentEvent.event || currentEvent.data) {
    events.push(currentEvent);
  }

  return events;
}

/**
 * Create a streaming interceptor that captures SSE events
 */
function createStreamingInterceptor(
  url: string,
  method: string,
  requestBody: Record<string, unknown> | null,
  startTime: number,
  originalBody: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const reader = originalBody.getReader();

  // Accumulated message data
  const message: StreamingMessage = {
    content: [],
  };

  // Track content blocks being built (for tool_use with streaming input)
  const contentBlocks: Map<number, ContentBlock> = new Map();
  let inputJsonBuffer: Map<number, string> = new Map();

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();

        if (done) {
          // Stream complete - log the accumulated message
          const endTime = Date.now();

          // Finalize any remaining content blocks
          for (const [index, block] of contentBlocks) {
            const jsonBuffer = inputJsonBuffer.get(index);
            if (jsonBuffer && block.type === 'tool_use') {
              try {
                block.input = JSON.parse(jsonBuffer);
              } catch {
                // Partial JSON, keep as string
                block.input = { _raw: jsonBuffer };
              }
            }
            message.content.push(block);
          }

          const logEntry = {
            timestamp: new Date().toISOString(),
            duration_ms: endTime - startTime,
            request: {
              url,
              method,
              body: requestBody,
            },
            response: {
              status: 200,
              body: message,
              streaming: true,
            },
          };

          appendToLog(logEntry);
          controller.close();
          return;
        }

        // Parse the chunk for SSE events
        const text = decoder.decode(value, { stream: true });
        const events = parseSSEEvents(text);

        for (const event of events) {
          if (!event.data) continue;

          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'message_start':
                if (data.message) {
                  message.id = data.message.id;
                  message.model = data.message.model;
                  message.role = data.message.role;
                  if (data.message.usage) {
                    message.usage = data.message.usage;
                  }
                }
                break;

              case 'content_block_start':
                if (data.content_block) {
                  const block: ContentBlock = {
                    type: data.content_block.type,
                  };
                  if (data.content_block.id) block.id = data.content_block.id;
                  if (data.content_block.name) block.name = data.content_block.name;
                  if (data.content_block.text !== undefined) block.text = data.content_block.text;
                  if (data.content_block.input) block.input = data.content_block.input;

                  contentBlocks.set(data.index, block);
                  inputJsonBuffer.set(data.index, '');
                }
                break;

              case 'content_block_delta':
                if (data.delta) {
                  const block = contentBlocks.get(data.index);
                  if (block) {
                    if (data.delta.type === 'text_delta' && data.delta.text) {
                      block.text = (block.text || '') + data.delta.text;
                    } else if (data.delta.type === 'input_json_delta' && data.delta.partial_json) {
                      const current = inputJsonBuffer.get(data.index) || '';
                      inputJsonBuffer.set(data.index, current + data.delta.partial_json);
                    }
                  }
                }
                break;

              case 'content_block_stop':
                // Finalize this content block
                const block = contentBlocks.get(data.index);
                if (block) {
                  const jsonBuffer = inputJsonBuffer.get(data.index);
                  if (jsonBuffer && block.type === 'tool_use') {
                    try {
                      block.input = JSON.parse(jsonBuffer);
                    } catch {
                      block.input = { _raw: jsonBuffer };
                    }
                  }
                  message.content.push(block);
                  contentBlocks.delete(data.index);
                  inputJsonBuffer.delete(data.index);
                }
                break;

              case 'message_delta':
                if (data.delta) {
                  if (data.delta.stop_reason) {
                    message.stop_reason = data.delta.stop_reason;
                  }
                }
                if (data.usage) {
                  message.usage = {
                    ...message.usage,
                    ...data.usage,
                  };
                }
                break;

              case 'message_stop':
                // Message complete - content will be logged when stream closes
                break;
            }
          } catch {
            // Ignore parse errors for individual events
          }
        }

        // Pass through the original chunk
        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },

    cancel() {
      reader.cancel();
    },
  });
}

// Only intercept if we have an output path
if (outputPath) {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async function interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Only intercept Anthropic API calls
    if (!url.includes(ANTHROPIC_API_HOST)) {
      return originalFetch(input, init);
    }

    const startTime = Date.now();
    let requestBody: Record<string, unknown> | null = null;

    try {
      requestBody = init?.body ? JSON.parse(init.body.toString()) : null;
    } catch {
      // Body might not be JSON
    }

    const isStreaming = requestBody?.stream === true;

    try {
      const response = await originalFetch(input, init);

      if (isStreaming && response.body) {
        // Handle streaming response
        const interceptedBody = createStreamingInterceptor(
          url,
          init?.method || 'GET',
          requestBody,
          startTime,
          response.body
        );

        return new Response(interceptedBody, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } else {
        // Handle non-streaming response (token counting, etc.)
        const clonedResponse = response.clone();
        const responseBody = await clonedResponse.json().catch(() => null);

        const endTime = Date.now();

        const logEntry = {
          timestamp: new Date().toISOString(),
          duration_ms: endTime - startTime,
          request: {
            url,
            method: init?.method || 'GET',
            body: requestBody,
          },
          response: {
            status: response.status,
            body: responseBody,
          },
        };

        appendToLog(logEntry);

        return response;
      }
    } catch (error) {
      const endTime = Date.now();

      const logEntry = {
        timestamp: new Date().toISOString(),
        duration_ms: endTime - startTime,
        request: {
          url,
          method: init?.method || 'GET',
          body: requestBody,
        },
        error: error instanceof Error ? error.message : String(error),
      };

      appendToLog(logEntry);

      throw error;
    }
  };
}

function appendToLog(entry: object): void {
  if (!outputPath) return;

  try {
    fs.appendFileSync(outputPath, JSON.stringify(entry) + '\n');
  } catch (e) {
    // Silently fail - don't interrupt Claude Code
    console.error('[claude-workflow] Failed to write log:', e);
  }
}

// Export for type checking
export {};
