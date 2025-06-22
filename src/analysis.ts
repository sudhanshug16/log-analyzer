import { chunkText } from "./util.ts";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export interface AnalyzeOptions {
  apiKey: string;
  host: string;
  model: string;
  chunkSize: number;
  logs: string;
  extraInstruction?: string;
  onProgress?: (current: number, total: number) => void;
  onHistory?: (increment: string) => void;
}

export interface AnalyzeResult {
  summary: string;
  history: string;
}

// Helper to abbreviate long chunk content for history
function abbreviate(text: string, maxLines = 5, maxChars = 300): string {
  const lines = text.split("\n").slice(0, maxLines);
  let combined = lines.join("\n");
  if (combined.length > maxChars) {
    combined = combined.substring(0, maxChars) + "…";
  }
  if (lines.length < text.split("\n").length || combined.length < text.length) {
    // indicate truncation
    combined += "\n… (truncated)";
  }
  return combined;
}

export async function analyzeLogs(
  opts: AnalyzeOptions
): Promise<AnalyzeResult> {
  const chunks = await chunkText(opts.logs, opts.chunkSize);

  const messages: any[] = [
    {
      role: "developer",
      content:
        "You are a helpful assistant whose job is to analyze logs and give the user a concise summary of errors or notable things. Keep the output extremely short (few sentences).",
    },
  ];

  const chunkSummaries: string[] = [];
  let history = `SYSTEM: ${messages[0].content}\n`;

  const openaiProvider = createOpenAI({
    apiKey: opts.apiKey,
    baseURL: opts.host,
    compatibility: "strict",
  });

  for (let i = 0; i < chunks.length; i++) {
    const { text } = await generateText({
      model: openaiProvider(opts.model),
      system: messages[0].content,
      prompt: chunks[i],
    });

    const content = text || "";

    messages.push({ role: "user", content: `chunk ${i + 1}` });
    messages.push({ role: "assistant", content });
    chunkSummaries.push(content);

    const increment = `\nUSER (chunk ${i + 1}):\n${abbreviate(
      chunks[i] || ""
    )}\nASSISTANT:\n${content || "(no response)"}\n`;
    history += increment;
    opts.onHistory?.(increment);

    opts.onProgress?.(i + 1, chunks.length);
  }

  if (opts.extraInstruction) {
    const extraInc = `\nUSER: ${opts.extraInstruction}\n`;
    history += extraInc;
    opts.onHistory?.(extraInc);
  }

  const summary = chunkSummaries.join("\n\n");
  return { summary, history: history.trim() };
}
