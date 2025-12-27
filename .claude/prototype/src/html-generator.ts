/**
 * HTML Report Generator
 *
 * Generates a self-contained HTML report from workflow events.
 * Includes mermaid diagrams, timeline view, and system breakdown.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { WorkflowEvent, WorkflowSummary } from './workflow-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate an HTML report from workflow events
 */
export function generateReport(summary: WorkflowSummary, sourcePath: string): string {
  const sessionName = path.basename(sourcePath, '.jsonl');
  const mermaidDiagram = generateMermaidDiagram(summary.events);
  const systemsHtml = generateSystemsSection(summary);
  const timelineHtml = generateTimelineSection(summary.events);
  const statsHtml = generateStatsSection(summary);

  // Serialize summary for JSON export (convert Sets and Maps)
  const exportData = {
    sessionName,
    startTime: summary.startTime,
    endTime: summary.endTime,
    duration_ms: summary.duration_ms,
    totalTokens: summary.totalTokens,
    costEstimate: summary.costEstimate,
    model: summary.model,
    events: summary.events,
    systems: Array.from(summary.systems),
    filesRead: Array.from(summary.filesRead),
    filesWritten: Array.from(summary.filesWritten),
    bashCommands: summary.bashCommands,
    toolCalls: Object.fromEntries(summary.toolCalls),
    githubOps: summary.githubOps,
    supabaseOps: summary.supabaseOps,
  };

  return `<!DOCTYPE html>
<html lang="en" class="">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workflow Report: ${sessionName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
    }
  </script>
  <style>
    .mermaid { padding: 20px; border-radius: 8px; }
    details summary { cursor: pointer; }
    details summary:hover { background: rgba(0,0,0,0.05); }
    .dark details summary:hover { background: rgba(255,255,255,0.05); }
    .event-command { border-left: 4px solid #e91e63; }
    .event-file_read { border-left: 4px solid #2196f3; }
    .event-file_write { border-left: 4px solid #4caf50; }
    .event-bash { border-left: 4px solid #ff9800; }
    .event-system_interaction { border-left: 4px solid #9c27b0; }
    .event-tool_call { border-left: 4px solid #607d8b; }
    .event-message { border-left: 4px solid #00bcd4; }
    .timeline-event.hidden { display: none; }
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; }
      section { break-inside: avoid; }
    }
  </style>
</head>
<body class="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Workflow Report</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">${sessionName}</p>
          <div class="flex gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Start: ${summary.startTime || 'N/A'}</span>
            <span>End: ${summary.endTime || 'N/A'}</span>
            <span>Duration: ${formatDuration(summary.duration_ms)}</span>
          </div>
        </div>
        <div class="flex gap-2 no-print">
          <button onclick="toggleDarkMode()" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600" title="Toggle dark mode">
            <span class="dark:hidden">🌙</span>
            <span class="hidden dark:inline">☀️</span>
          </button>
          <button onclick="exportJSON()" class="px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 text-sm" title="Export as JSON">
            JSON
          </button>
          <button onclick="exportMarkdown()" class="px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 text-sm" title="Export as Markdown">
            MD
          </button>
          <button onclick="window.print()" class="px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 text-sm" title="Print/PDF">
            PDF
          </button>
        </div>
      </div>
    </header>

    <!-- Stats Overview -->
    ${statsHtml}

    <!-- Workflow Diagram -->
    <section class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Workflow Flow</h2>
      <div class="mermaid overflow-x-auto bg-white dark:bg-gray-700 rounded-lg">
${mermaidDiagram}
      </div>
    </section>

    <!-- Systems -->
    ${systemsHtml}

    <!-- Timeline -->
    ${timelineHtml}
  </div>

  <script>
    // Workflow data for exports
    const workflowData = ${JSON.stringify(exportData)};

    // Store original mermaid code before it gets processed
    const mermaidCode = document.querySelector('.mermaid')?.textContent || '';

    // Dark mode
    function toggleDarkMode() {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
      // Mermaid doesn't need re-render - the container background handles dark mode
    }

    // Initialize dark mode from localStorage
    if (localStorage.getItem('darkMode') === 'true') {
      document.documentElement.classList.add('dark');
    }

    // Initialize mermaid (always use default theme, container background handles dark mode)
    mermaid.initialize({ startOnLoad: true, theme: 'default' });

    // Export functions
    function exportJSON() {
      const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = workflowData.sessionName + '.json';
      a.click();
      URL.revokeObjectURL(url);
    }

    function exportMarkdown() {
      const md = generateMarkdown(workflowData);
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = workflowData.sessionName + '.md';
      a.click();
      URL.revokeObjectURL(url);
    }

    function generateMarkdown(data) {
      let md = '# Workflow Report: ' + data.sessionName + '\\n\\n';
      md += '**Duration:** ' + data.duration_ms + 'ms\\n';
      md += '**Model:** ' + (data.model || 'unknown') + '\\n';
      md += '**Tokens:** ' + data.totalTokens.input_tokens + ' in / ' + data.totalTokens.output_tokens + ' out\\n';
      md += '**Est. Cost:** $' + data.costEstimate.total_cost_usd.toFixed(2) + '\\n\\n';
      md += '## Stats\\n';
      md += '- Events: ' + data.events.length + '\\n';
      md += '- Files Read: ' + data.filesRead.length + '\\n';
      md += '- Files Written: ' + data.filesWritten.length + '\\n';
      md += '- Bash Commands: ' + data.bashCommands.length + '\\n\\n';
      md += '## Systems Touched\\n';
      data.systems.forEach(s => { md += '- ' + s + '\\n'; });
      md += '\\n## Timeline\\n';
      data.events.slice(0, 20).forEach(e => {
        md += '- **' + e.name + '**' + (e.target ? ': ' + e.target : '') + '\\n';
      });
      return md;
    }

    // Timeline filtering
    function filterTimeline() {
      const search = document.getElementById('timeline-search')?.value.toLowerCase() || '';
      const types = Array.from(document.querySelectorAll('.type-filter:checked')).map(cb => cb.value);

      document.querySelectorAll('.timeline-event').forEach(el => {
        const text = el.textContent.toLowerCase();
        const type = el.dataset.type;
        const matchesSearch = !search || text.includes(search);
        const matchesType = types.length === 0 || types.includes(type);
        el.classList.toggle('hidden', !(matchesSearch && matchesType));
      });

      // Update count
      const visible = document.querySelectorAll('.timeline-event:not(.hidden)').length;
      const total = document.querySelectorAll('.timeline-event').length;
      const countEl = document.getElementById('event-count');
      if (countEl) countEl.textContent = visible + ' of ' + total + ' events';
    }
  </script>
</body>
</html>`;
}

/**
 * Generate mermaid flowchart from events
 */
function generateMermaidDiagram(events: WorkflowEvent[]): string {
  if (events.length === 0) {
    return 'flowchart TD\n    A[No events captured]';
  }

  const lines: string[] = ['flowchart TD'];
  const nodeIds = new Map<string, string>();
  let nodeCounter = 0;

  // Create nodes for significant events
  const significantEvents = events.filter(e =>
    e.type === 'command' ||
    e.type === 'file_write' ||
    e.type === 'bash' ||
    e.type === 'system_interaction'
  );

  // Limit to first 20 events for readability
  const eventsToShow = significantEvents.slice(0, 20);

  for (const event of eventsToShow) {
    const id = `N${nodeCounter++}`;
    const label = getNodeLabel(event);
    const shape = getNodeShape(event);

    lines.push(`    ${id}${shape[0]}"${escapeLabel(label)}"${shape[1]}`);
    nodeIds.set(event.timestamp + event.name, id);
  }

  // Connect sequential nodes
  const ids = Array.from(nodeIds.values());
  for (let i = 0; i < ids.length - 1; i++) {
    lines.push(`    ${ids[i]} --> ${ids[i + 1]}`);
  }

  // Add styling
  lines.push('');
  for (const [key, id] of nodeIds.entries()) {
    const event = eventsToShow.find(e => e.timestamp + e.name === key);
    if (event) {
      const style = getNodeStyle(event);
      if (style) {
        lines.push(`    style ${id} ${style}`);
      }
    }
  }

  return lines.join('\n');
}

function getNodeLabel(event: WorkflowEvent): string {
  switch (event.type) {
    case 'command':
      return event.name;
    case 'file_read':
      return `Read: ${shortenPath(event.target || '')}`;
    case 'file_write':
      return `${event.name}: ${shortenPath(event.target || '')}`;
    case 'bash':
      return `bash: ${shortenCommand(event.target || '')}`;
    case 'system_interaction':
      return event.name;
    default:
      return event.name;
  }
}

function getNodeShape(event: WorkflowEvent): [string, string] {
  switch (event.type) {
    case 'command':
      return ['([', '])'];  // Stadium shape
    case 'file_read':
    case 'file_write':
      return ['[(', ')]'];  // Cylinder
    case 'bash':
      return ['[/', '/]'];  // Parallelogram (safer than flag)
    case 'system_interaction':
      return ['[[', ']]'];  // Subroutine (safer than hexagon)
    default:
      return ['[', ']'];    // Rectangle
  }
}

function getNodeStyle(event: WorkflowEvent): string {
  switch (event.type) {
    case 'command':
      return 'fill:#fce4ec,stroke:#e91e63';
    case 'file_write':
      return 'fill:#e8f5e9,stroke:#4caf50';
    case 'bash':
      return 'fill:#fff3e0,stroke:#ff9800';
    case 'system_interaction':
      return 'fill:#f3e5f5,stroke:#9c27b0';
    default:
      return '';
  }
}

/**
 * Generate systems breakdown section with specific operations
 */
function generateSystemsSection(summary: WorkflowSummary): string {
  const systemsList = Array.from(summary.systems);
  if (systemsList.length === 0 && summary.filesRead.size === 0) {
    return '';
  }

  const items: string[] = [];

  if (summary.systems.has('github')) {
    const ops = summary.githubOps.length > 0
      ? summary.githubOps.slice(0, 3).map(op => escapeHtml(op)).join(', ')
      : 'Interactions detected';
    const more = summary.githubOps.length > 3 ? ` +${summary.githubOps.length - 3} more` : '';
    items.push(`<div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h3 class="font-semibold text-gray-700 dark:text-gray-200">GitHub</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">${ops}${more}</p>
    </div>`);
  }

  if (summary.systems.has('supabase')) {
    const ops = summary.supabaseOps.length > 0
      ? summary.supabaseOps.slice(0, 3).map(op => escapeHtml(op)).join(', ')
      : 'Database operations';
    const more = summary.supabaseOps.length > 3 ? ` +${summary.supabaseOps.length - 3} more` : '';
    items.push(`<div class="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
      <h3 class="font-semibold text-purple-700 dark:text-purple-300">Supabase</h3>
      <p class="text-sm text-purple-500 dark:text-purple-400">${ops}${more}</p>
    </div>`);
  }

  items.push(`<div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
    <h3 class="font-semibold text-blue-700 dark:text-blue-300">Local Files</h3>
    <p class="text-sm text-blue-500 dark:text-blue-400">${summary.filesRead.size} reads, ${summary.filesWritten.size} writes</p>
  </div>`);

  if (summary.bashCommands.length > 0) {
    // Group bash commands by type
    const gitCmds = summary.bashCommands.filter(c => c.startsWith('git ') || c.startsWith('gh ')).length;
    const npmCmds = summary.bashCommands.filter(c => c.startsWith('npm ') || c.startsWith('npx ')).length;
    const otherCmds = summary.bashCommands.length - gitCmds - npmCmds;

    const breakdown: string[] = [];
    if (gitCmds > 0) breakdown.push(`${gitCmds} git`);
    if (npmCmds > 0) breakdown.push(`${npmCmds} npm`);
    if (otherCmds > 0) breakdown.push(`${otherCmds} other`);

    items.push(`<div class="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
      <h3 class="font-semibold text-orange-700 dark:text-orange-300">Bash</h3>
      <p class="text-sm text-orange-500 dark:text-orange-400">${breakdown.join(', ')}</p>
    </div>`);
  }

  return `<section class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Systems Touched</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      ${items.join('\n      ')}
    </div>
  </section>`;
}

/**
 * Generate timeline section with search and filters
 */
function generateTimelineSection(events: WorkflowEvent[]): string {
  if (events.length === 0) {
    return `<section class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Timeline</h2>
      <p class="text-gray-500 dark:text-gray-400">No events captured</p>
    </section>`;
  }

  const eventItems = events.slice(0, 100).map(event => {
    const time = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '';
    const icon = getEventIcon(event.type);
    const targetHtml = event.target ? formatTargetWithLinks(event.target, event.system) : '';

    return `<div class="timeline-event event-${event.type} pl-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700" data-type="${event.type}">
      <div class="flex items-center gap-2">
        <span class="text-lg">${icon}</span>
        <span class="font-medium text-gray-800 dark:text-gray-200">${escapeHtml(event.name)}</span>
        <span class="text-xs text-gray-400 ml-auto">${time}</span>
      </div>
      ${targetHtml ? `<p class="text-sm text-gray-500 dark:text-gray-400 ml-7 truncate">${targetHtml}</p>` : ''}
    </div>`;
  }).join('\n');

  // Get unique event types for filter checkboxes
  const eventTypes = [...new Set(events.map(e => e.type))];
  const filterCheckboxes = eventTypes.map(type =>
    `<label class="flex items-center gap-1 text-sm">
      <input type="checkbox" class="type-filter" value="${type}" checked onchange="filterTimeline()">
      <span class="text-gray-600 dark:text-gray-400">${type.replace('_', ' ')}</span>
    </label>`
  ).join('\n        ');

  return `<section class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Timeline</h2>

    <!-- Search and Filters -->
    <div class="mb-4 space-y-3 no-print">
      <input
        type="text"
        id="timeline-search"
        placeholder="Search events..."
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400"
        oninput="filterTimeline()"
      >
      <div class="flex flex-wrap gap-3">
        ${filterCheckboxes}
      </div>
    </div>

    <details open>
      <summary class="text-sm text-gray-500 dark:text-gray-400 mb-2">
        <span id="event-count">${Math.min(events.length, 100)} of ${events.length}</span> events
      </summary>
      <div class="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
        ${eventItems}
      </div>
    </details>
  </section>`;
}

/**
 * Format target with clickable links for GitHub/Supabase
 */
function formatTargetWithLinks(target: string, system?: string): string {
  const escaped = escapeHtml(target);

  // GitHub issue/PR links
  const ghIssueMatch = target.match(/(?:issue|pr)\s*#?(\d+)/i) || target.match(/gh\s+(?:issue|pr)\s+(?:view\s+)?(\d+)/i);
  if (ghIssueMatch) {
    const num = ghIssueMatch[1];
    return escaped.replace(
      new RegExp(`(#?${num})`),
      `<a href="https://github.com/issues/${num}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>`
    );
  }

  // File paths - make copyable
  if (target.startsWith('/') || target.includes('/src/') || target.includes('.ts') || target.includes('.tsx')) {
    return `<span class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onclick="navigator.clipboard.writeText('${escapeHtml(target.replace(/'/g, "\\'"))}'); this.classList.add('text-green-600'); setTimeout(() => this.classList.remove('text-green-600'), 1000)" title="Click to copy">${escaped}</span>`;
  }

  return escaped;
}

/**
 * Generate stats section with token usage and cost
 */
function generateStatsSection(summary: WorkflowSummary): string {
  const toolCallEntries = Array.from(summary.toolCalls.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topTools = toolCallEntries.map(([name, count]) =>
    `<span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">${name}: ${count}</span>`
  ).join(' ');

  const hasTokens = summary.totalTokens.input_tokens > 0 || summary.totalTokens.output_tokens > 0;
  const formatTokens = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
  const formatCost = (n: number) => n < 0.01 ? '<$0.01' : `$${n.toFixed(2)}`;

  return `<section class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div>
        <p class="text-3xl font-bold text-gray-800 dark:text-gray-100">${summary.events.length}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
      </div>
      <div>
        <p class="text-3xl font-bold text-blue-600">${summary.filesRead.size}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Files Read</p>
      </div>
      <div>
        <p class="text-3xl font-bold text-green-600">${summary.filesWritten.size}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Files Written</p>
      </div>
      <div>
        <p class="text-3xl font-bold text-orange-600">${summary.bashCommands.length}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Bash Commands</p>
      </div>
    </div>
    ${hasTokens ? `
    <div class="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div>
        <p class="text-2xl font-bold text-purple-600">${formatTokens(summary.totalTokens.input_tokens)}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Input Tokens</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-purple-600">${formatTokens(summary.totalTokens.output_tokens)}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Output Tokens</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-emerald-600">${formatCost(summary.costEstimate.total_cost_usd)}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Est. Cost</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-gray-600 dark:text-gray-300">${summary.model ? summary.model.split('-').slice(1, 3).join('-') : 'unknown'}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Model</p>
      </div>
    </div>` : ''}
    ${topTools ? `<div class="mt-4 pt-4 border-t dark:border-gray-700">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Top Tools:</p>
      <div class="flex flex-wrap gap-2">${topTools}</div>
    </div>` : ''}
  </section>`;
}

// Utility functions
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function shortenPath(filepath: string): string {
  const parts = filepath.split('/');
  if (parts.length <= 3) return filepath;
  return `.../${parts.slice(-2).join('/')}`;
}

function shortenCommand(cmd: string): string {
  if (cmd.length <= 30) return cmd;
  return cmd.slice(0, 27) + '...';
}

function escapeLabel(text: string): string {
  return text
    .replace(/"/g, '#quot;')   // Escape double quotes
    .replace(/'/g, '#apos;')   // Escape single quotes
    .replace(/\$/g, '')        // Remove dollar signs (mermaid issue)
    .replace(/[<>]/g, '')      // Remove angle brackets
    .replace(/[{}]/g, '')      // Remove curly braces
    .replace(/[\[\]]/g, '')    // Remove square brackets
    .replace(/\|/g, '')        // Remove pipes
    .replace(/\n/g, ' ')       // Replace newlines
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getEventIcon(type: WorkflowEvent['type']): string {
  switch (type) {
    case 'command': return '🚀';
    case 'file_read': return '📖';
    case 'file_write': return '✏️';
    case 'bash': return '💻';
    case 'system_interaction': return '🔗';
    case 'message': return '💬';
    default: return '⚙️';
  }
}
