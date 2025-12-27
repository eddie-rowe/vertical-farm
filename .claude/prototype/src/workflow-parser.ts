/**
 * Workflow Parser
 *
 * Extracts meaningful workflow events from raw API trace data.
 * Converts low-level request/response pairs into high-level workflow events.
 */

export interface WorkflowEvent {
  timestamp: string;
  type: 'command' | 'tool_call' | 'file_read' | 'file_write' | 'bash' | 'system_interaction' | 'message';
  name: string;
  target?: string;
  system?: 'github' | 'datadog' | 'supabase' | 'local' | 'web';
  duration_ms?: number;
  details?: Record<string, unknown>;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface CostEstimate {
  input_cost_usd: number;
  output_cost_usd: number;
  total_cost_usd: number;
}

export interface WorkflowSummary {
  events: WorkflowEvent[];
  systems: Set<string>;
  filesRead: Set<string>;
  filesWritten: Set<string>;
  bashCommands: string[];
  toolCalls: Map<string, number>;
  duration_ms: number;
  startTime: string;
  endTime: string;
  // Token usage tracking
  totalTokens: TokenUsage;
  costEstimate: CostEstimate;
  model?: string;
  // System-specific operations tracking
  githubOps: string[];
  supabaseOps: string[];
}

interface RawLogEntry {
  timestamp: string;
  duration_ms: number;
  request: {
    url: string;
    method: string;
    body: {
      messages?: Array<{
        role: string;
        content: Array<{
          type: string;
          text?: string;
          tool_use_id?: string;
          name?: string;
          input?: Record<string, unknown>;
          content?: string | Array<{ type: string; text?: string }>;
        }>;
      }>;
    };
  };
  response?: {
    status: number;
    body: {
      content?: Array<{
        type: string;
        name?: string;
        input?: Record<string, unknown>;
        text?: string;
      }>;
      usage?: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
      };
      model?: string;
    };
  };
  error?: string;
}

// Claude API pricing (per million tokens)
const PRICING = {
  'claude-sonnet-4-5-20250929': { input: 3.0, output: 15.0 },
  'claude-opus-4-5-20251101': { input: 15.0, output: 75.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  default: { input: 3.0, output: 15.0 }, // Default to Sonnet pricing
};

function calculateCost(tokens: TokenUsage, model?: string): CostEstimate {
  const modelKey = model && model in PRICING ? model : 'default';
  const rates = PRICING[modelKey as keyof typeof PRICING];

  const inputCost = (tokens.input_tokens / 1_000_000) * rates.input;
  const outputCost = (tokens.output_tokens / 1_000_000) * rates.output;

  return {
    input_cost_usd: inputCost,
    output_cost_usd: outputCost,
    total_cost_usd: inputCost + outputCost,
  };
}

/**
 * Parse raw log entries into workflow events
 */
export function parseWorkflowEvents(rawEntries: RawLogEntry[]): WorkflowSummary {
  const events: WorkflowEvent[] = [];
  const systems = new Set<string>();
  const filesRead = new Set<string>();
  const filesWritten = new Set<string>();
  const bashCommands: string[] = [];
  const toolCalls = new Map<string, number>();
  const githubOps: string[] = [];
  const supabaseOps: string[] = [];

  let startTime = '';
  let endTime = '';
  let totalDuration = 0;
  let model: string | undefined;

  // Token tracking
  const totalTokens: TokenUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  };

  for (const entry of rawEntries) {
    if (!startTime) startTime = entry.timestamp;
    endTime = entry.timestamp;
    totalDuration += entry.duration_ms || 0;

    // Extract model and token usage from response
    const responseBody = entry.response?.body;
    if (responseBody?.model && !model) {
      model = responseBody.model;
    }
    if (responseBody?.usage) {
      totalTokens.input_tokens += responseBody.usage.input_tokens || 0;
      totalTokens.output_tokens += responseBody.usage.output_tokens || 0;
      totalTokens.cache_creation_input_tokens = (totalTokens.cache_creation_input_tokens || 0) +
        (responseBody.usage.cache_creation_input_tokens || 0);
      totalTokens.cache_read_input_tokens = (totalTokens.cache_read_input_tokens || 0) +
        (responseBody.usage.cache_read_input_tokens || 0);
    }

    // Extract tool calls from response
    const responseContent = responseBody?.content || [];
    for (const block of responseContent) {
      if (block.type === 'tool_use' && block.name) {
        const event = parseToolUse(block.name, block.input || {}, entry.timestamp);
        if (event) {
          events.push(event);
          toolCalls.set(event.name, (toolCalls.get(event.name) || 0) + 1);

          // Track systems and files
          if (event.system) systems.add(event.system);
          if (event.type === 'file_read' && event.target) filesRead.add(event.target);
          if (event.type === 'file_write' && event.target) filesWritten.add(event.target);
          if (event.type === 'bash' && event.target) bashCommands.push(event.target);

          // Track specific operations per system
          if (event.system === 'github') {
            githubOps.push(formatGithubOp(block.name, block.input || {}));
          }
          if (event.system === 'supabase') {
            supabaseOps.push(formatSupabaseOp(block.name, block.input || {}));
          }
        }
      }
    }

    // Also check messages for slash commands (user input)
    const messages = entry.request?.body?.messages || [];
    for (const msg of messages) {
      if (msg.role === 'user') {
        const content = msg.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text' && typeof block.text === 'string') {
              const slashMatch = block.text.match(/^\/(\w+)/);
              if (slashMatch) {
                events.push({
                  timestamp: entry.timestamp,
                  type: 'command',
                  name: `/${slashMatch[1]}`,
                  details: { fullText: block.text.slice(0, 100) },
                });
              }
            }
          }
        }
      }
    }
  }

  return {
    events,
    systems,
    filesRead,
    filesWritten,
    bashCommands,
    toolCalls,
    duration_ms: totalDuration,
    startTime,
    endTime,
    totalTokens,
    costEstimate: calculateCost(totalTokens, model),
    model,
    githubOps,
    supabaseOps,
  };
}

/**
 * Format a GitHub operation for display
 */
function formatGithubOp(toolName: string, input: Record<string, unknown>): string {
  if (toolName === 'Bash') {
    const cmd = input.command as string || '';
    // Parse gh commands
    if (cmd.startsWith('gh issue view')) {
      const match = cmd.match(/gh issue view (\d+)/);
      return match ? `Viewed issue #${match[1]}` : 'Viewed issue';
    }
    if (cmd.startsWith('gh pr create')) {
      return 'Created PR';
    }
    if (cmd.startsWith('gh pr view')) {
      const match = cmd.match(/gh pr view (\d+)/);
      return match ? `Viewed PR #${match[1]}` : 'Viewed PR';
    }
    if (cmd.startsWith('gh issue create')) {
      return 'Created issue';
    }
    return cmd.slice(0, 50);
  }
  // MCP GitHub tools
  if (toolName.includes('get_issue')) {
    return `Viewed issue #${input.issue_number || '?'}`;
  }
  if (toolName.includes('create_pull_request')) {
    return 'Created PR';
  }
  if (toolName.includes('add_issue_comment')) {
    return `Commented on issue #${input.issue_number || '?'}`;
  }
  return toolName.replace('mcp__github__', '');
}

/**
 * Format a Supabase operation for display
 */
function formatSupabaseOp(toolName: string, input: Record<string, unknown>): string {
  const method = toolName.replace('mcp__supabase__', '');
  if (method === 'execute_sql') {
    const query = (input.query as string || '').slice(0, 50);
    return `SQL: ${query}...`;
  }
  if (method === 'apply_migration') {
    return `Migration: ${input.name || 'unnamed'}`;
  }
  if (method === 'deploy_edge_function') {
    return `Deploy function: ${input.name || 'unnamed'}`;
  }
  return method.replace(/_/g, ' ');
}

/**
 * Parse a tool use into a workflow event
 */
function parseToolUse(
  toolName: string,
  input: Record<string, unknown>,
  timestamp: string
): WorkflowEvent | null {
  switch (toolName) {
    case 'Read':
      return {
        timestamp,
        type: 'file_read',
        name: 'Read',
        target: input.file_path as string,
        system: 'local',
      };

    case 'Write':
      return {
        timestamp,
        type: 'file_write',
        name: 'Write',
        target: input.file_path as string,
        system: 'local',
      };

    case 'Edit':
      return {
        timestamp,
        type: 'file_write',
        name: 'Edit',
        target: input.file_path as string,
        system: 'local',
      };

    case 'Bash':
      const command = input.command as string;
      return {
        timestamp,
        type: 'bash',
        name: 'Bash',
        target: command,
        system: detectSystemFromCommand(command),
        details: { command },
      };

    case 'Glob':
    case 'Grep':
      return {
        timestamp,
        type: 'tool_call',
        name: toolName,
        target: (input.pattern || input.path) as string,
        system: 'local',
      };

    case 'WebFetch':
      return {
        timestamp,
        type: 'system_interaction',
        name: 'WebFetch',
        target: input.url as string,
        system: 'web',
      };

    case 'WebSearch':
      return {
        timestamp,
        type: 'system_interaction',
        name: 'WebSearch',
        target: input.query as string,
        system: 'web',
      };

    case 'Task':
      return {
        timestamp,
        type: 'tool_call',
        name: `Task:${input.subagent_type || 'unknown'}`,
        details: { description: input.description },
      };

    // Slash commands and skills
    case 'SlashCommand':
      return {
        timestamp,
        type: 'command',
        name: (input.command as string) || '/command',
        system: 'local',
      };

    case 'Skill':
      return {
        timestamp,
        type: 'tool_call',
        name: `Skill:${input.skill || 'unknown'}`,
        system: 'local',
      };

    // Background bash
    case 'BashOutput':
      return {
        timestamp,
        type: 'bash',
        name: 'BashOutput',
        target: `bg:${input.bash_id || 'unknown'}`,
        system: 'local',
      };

    case 'KillShell':
      return {
        timestamp,
        type: 'bash',
        name: 'KillShell',
        target: input.shell_id as string,
        system: 'local',
      };

    // Notebook operations
    case 'NotebookEdit':
      return {
        timestamp,
        type: 'file_write',
        name: 'NotebookEdit',
        target: input.notebook_path as string,
        system: 'local',
      };

    // User interaction
    case 'AskUserQuestion':
      return {
        timestamp,
        type: 'message',
        name: 'AskUserQuestion',
        details: { questions: input.questions },
      };

    case 'TodoWrite':
      return {
        timestamp,
        type: 'tool_call',
        name: 'TodoWrite',
        details: { todos: input.todos },
      };

    // Plan mode
    case 'EnterPlanMode':
      return {
        timestamp,
        type: 'command',
        name: 'EnterPlanMode',
      };

    case 'ExitPlanMode':
      return {
        timestamp,
        type: 'command',
        name: 'ExitPlanMode',
      };

    default:
      // MCP tools
      if (toolName.startsWith('mcp__')) {
        const [, server, method] = toolName.split('__');
        return {
          timestamp,
          type: 'system_interaction',
          name: `${server}:${method}`,
          system: detectMCPSystem(server),
          details: input,
        };
      }

      return {
        timestamp,
        type: 'tool_call',
        name: toolName,
        details: input,
      };
  }
}

/**
 * Detect which external system a bash command interacts with
 */
function detectSystemFromCommand(command: string): WorkflowEvent['system'] {
  if (command.startsWith('gh ') || command.includes('github')) return 'github';
  if (command.includes('supabase')) return 'supabase';
  if (command.includes('datadog') || command.includes('dd-')) return 'datadog';
  return 'local';
}

/**
 * Detect system from MCP server name
 */
function detectMCPSystem(server: string): WorkflowEvent['system'] {
  if (server.includes('github')) return 'github';
  if (server.includes('supabase')) return 'supabase';
  if (server.includes('playwright') || server.includes('chrome')) return 'web';
  return undefined;
}
