#!/usr/bin/env node

/**
 * claude-workflow CLI
 *
 * Wraps Claude Code execution to capture workflow traces and generate
 * visual reports showing commands, tool calls, files, and systems used.
 *
 * Usage:
 *   npx claude-workflow [claude-args...]
 *   npx claude-workflow --generate <jsonl-file>
 */

import { spawn } from 'child_process';
import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { generateReport } from './html-generator.js';
import { parseWorkflowEvents } from './workflow-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory for traces
const OUTPUT_DIR = '.claude-workflow';

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

async function runWithTracing(claudeArgs: string[]): Promise<void> {
  ensureOutputDir();

  const timestamp = getTimestamp();
  const jsonlPath = path.join(OUTPUT_DIR, `session-${timestamp}.jsonl`);
  const htmlPath = path.join(OUTPUT_DIR, `session-${timestamp}.html`);

  console.log(`\x1b[36m[claude-workflow]\x1b[0m Starting traced session...`);
  console.log(`\x1b[36m[claude-workflow]\x1b[0m Trace output: ${jsonlPath}`);

  // Path to the interceptor script
  const interceptorPath = path.join(__dirname, 'interceptor.js');

  // Spawn Claude Code with our interceptor preloaded
  const claude = spawn('claude', claudeArgs, {
    stdio: 'inherit',
    env: {
      ...process.env,
      CLAUDE_WORKFLOW_OUTPUT: jsonlPath,
      NODE_OPTIONS: `--import ${interceptorPath} ${process.env.NODE_OPTIONS || ''}`.trim(),
    },
  });

  claude.on('close', async (code) => {
    console.log(`\n\x1b[36m[claude-workflow]\x1b[0m Session ended (exit code: ${code})`);

    // Generate HTML report if we have trace data
    if (fs.existsSync(jsonlPath)) {
      const stats = fs.statSync(jsonlPath);
      if (stats.size > 0) {
        console.log(`\x1b[36m[claude-workflow]\x1b[0m Generating report...`);
        await generateReportFromFile(jsonlPath, htmlPath);
        console.log(`\x1b[36m[claude-workflow]\x1b[0m Report saved: ${htmlPath}`);
        console.log(`\x1b[36m[claude-workflow]\x1b[0m Open with: open ${htmlPath}`);
      } else {
        console.log(`\x1b[33m[claude-workflow]\x1b[0m No trace data captured.`);
      }
    }

    process.exit(code ?? 0);
  });

  claude.on('error', (err) => {
    console.error(`\x1b[31m[claude-workflow]\x1b[0m Error spawning claude:`, err.message);
    console.error(`\x1b[31m[claude-workflow]\x1b[0m Make sure Claude Code CLI is installed.`);
    process.exit(1);
  });
}

async function generateReportFromFile(jsonlPath: string, htmlPath: string): Promise<void> {
  const content = fs.readFileSync(jsonlPath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  const rawEvents = lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (e) {
      console.warn(`\x1b[33m[claude-workflow]\x1b[0m Skipping invalid JSON at line ${index + 1}`);
      return null;
    }
  }).filter(Boolean);

  const workflowEvents = parseWorkflowEvents(rawEvents);
  const html = generateReport(workflowEvents, jsonlPath);

  fs.writeFileSync(htmlPath, html);
}

// CLI setup
program
  .name('claude-workflow')
  .description('Capture and visualize Claude Code workflow traces')
  .version('0.1.0')
  .option('--generate <jsonl>', 'Generate HTML report from existing JSONL file')
  .allowUnknownOption(true)
  .action(async (options, command) => {
    if (options.generate) {
      // Generate report from existing file
      const jsonlPath = options.generate;
      if (!fs.existsSync(jsonlPath)) {
        console.error(`\x1b[31m[claude-workflow]\x1b[0m File not found: ${jsonlPath}`);
        process.exit(1);
      }

      const htmlPath = jsonlPath.replace(/\.jsonl$/, '.html');
      console.log(`\x1b[36m[claude-workflow]\x1b[0m Generating report from ${jsonlPath}...`);
      await generateReportFromFile(jsonlPath, htmlPath);
      console.log(`\x1b[36m[claude-workflow]\x1b[0m Report saved: ${htmlPath}`);
    } else {
      // Run Claude with tracing - pass through all remaining args
      const claudeArgs = command.args;
      await runWithTracing(claudeArgs);
    }
  });

program.parse();
