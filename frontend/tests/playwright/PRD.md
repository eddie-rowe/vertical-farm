# Mission 

Automating **E2E testing**, generating **experience analytics**, and applying **AI-driven evaluations** of your frontend. Here's a breakdown of how to approach this and stitch the pieces together into a modular, scalable setup.

---

## 🧩 The Vision: 3-Part System

### **1. Playwright for E2E Testing**

Automate:

* Navigation (start course, go through steps)
* Terminal interaction
* Step validations (did it complete?)
* UI feedback (e.g., progress bar, modals)

You’ll want to:

* Use **Playwright Test Runner** (JS/TS recommended)
* Add custom logging (timings, outputs, screenshots)

---

### **2. Content Ingestion & Experience Logging**

This layer records:

* Time spent per step
* Terminal outputs
* Errors encountered
* Screenshots/videos
* Step metadata (titles, descriptions, etc.)

You can build this as:

* A custom **logger utility** within Playwright (write to JSON or Markdown)
* Optionally, use `tracing` from Playwright for visual timelines:

  ```ts
  await context.tracing.start({ screenshots: true, snapshots: true });
  // ... run steps
  await context.tracing.stop({ path: 'trace.zip' });
  ```

You can write a wrapper like:

```ts
await logStep("Step 1", async () => {
  await page.click('text=Step 1');
  await page.keyboard.type('ls');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  const output = await getTerminalOutput(page);
  await saveLog("step-1", { output });
});
```

---

### **3. Evaluation Layer with AI Agent**

Use an **AI model (e.g. GPT-4 or GPT-4-turbo)** to review:

* Logs and outputs
* Time per step
* Screenshots or screen recordings
* Step instructions and results

You can design a **prompt template** like:

> "You are an educational QA evaluator. Analyze the following training session log from an Instruqt course. Assess step clarity, user experience, friction points, course structure, and whether the expected learning outcomes were achieved. Suggest improvements."

You can feed in:

* JSON log (from Playwright)
* Terminal outputs
* Screenshots
* (Optional) session transcript or metadata

You could write a script that:

* Reads the log
* Sends it to the OpenAI API with the prompt
* Saves/prints AI evaluation

---

## 🛠️ Tools & Stack Suggestions

| Goal               | Tool / Tech                                    |
| ------------------ | ---------------------------------------------- |
| Browser Automation | Playwright (JavaScript/TypeScript)             |
| Structured Logging | JSON, Markdown, or SQLite                      |
| Screen Capture     | Playwright Tracing or Puppeteer Video Recorder |
| AI Evaluation      | OpenAI API (GPT-4-turbo), Claude, or local LLM |
| Integration        | Node.js script with CLI flags                  |
| Optional Frontend  | React dashboard to view results and logs       |

---

## 🗂 Folder Structure Idea

```
instruqt-evaluator/
├── tests/
│   └── e2e-course.test.ts
├── logs/
│   └── session-2025-05-13.json
├── screenshots/
│   └── step-1.png
├── prompts/
│   └── evaluator-prompt.txt
├── ai-evaluator/
│   └── evaluate.js
└── playwright.config.ts
```

---

## 🧠 Future Expansions

* Multiple course support
* Auto-detection of course structure via DOM
* Fine-tuned evaluation model for feedback scoring
* Web dashboard to manage tests and see evaluations

---

Would you like help scaffolding this system — say, by starting with a working template that does logging + step timing + AI evaluation script scaffold?
