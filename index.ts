#!/usr/bin/env node
import OpenAI from "openai";
import { encode } from "gpt-tokenizer";

const DEFAULT_CHUNK_SIZE = 250_000;
const DEFAULT_MODEL = "google/gemini-2.5-flash-preview";

// Cache for tokenizer results
const tokenCache = new Map<string, number>();

type Args = {
  model: string;
  help: boolean;
  chunkSize: number;
};

// Helper function to get token count with caching
async function getTokenCount(text: string): Promise<number> {
  if (!text) return 0;

  const cacheKey =
    text.length <= 100
      ? text
      : text.substring(0, 50) + text.length + text.substring(text.length - 50);

  if (!tokenCache.has(cacheKey)) {
    tokenCache.set(cacheKey, encode(text).length);
  }

  return tokenCache.get(cacheKey)!;
}

function showHelp() {
  const packageName = process.env.npm_package_name || "log-analyzer";
  console.log(`
Usage:
  cat <logfile> | bun index.ts [options]
  cat <logfile> | ${packageName} [options]  (if installed globally)

Options:
  --model <model>       Specify the model to use for analysis (default: ${DEFAULT_MODEL})
  --chunk-size <size>   Set the maximum token count per chunk (default: ${DEFAULT_CHUNK_SIZE})
  -h, --help            Show this help message
  
Example:
  cat server.log | bun index.ts --model anthropic/claude-3-haiku-20240307 --chunk-size 40000
`);
  process.exit(0);
}

function parseArgs(): Args {
  const args = process.argv.slice(2);

  // Default configuration
  const config: Args = {
    model: DEFAULT_MODEL,
    help: false,
    chunkSize: DEFAULT_CHUNK_SIZE,
  };

  // Process command-line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Skip if the current argument is undefined (shouldn't happen in practice)
    if (!arg) continue;

    const nextArg = args[i + 1];

    switch (arg) {
      case "--model":
        if (nextArg) {
          config.model = nextArg;
          i++;
        }
        break;

      case "--chunk-size":
        if (nextArg) {
          const size = parseInt(nextArg, 10);
          if (!isNaN(size) && size > 0) {
            config.chunkSize = size;
          } else {
            console.error(
              `Invalid chunk size: ${nextArg}. Using default: ${DEFAULT_CHUNK_SIZE}`
            );
          }
          i++;
        }
        break;

      case "-h":
      case "--help":
        config.help = true;
        break;

      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
        }
        break;
    }
  }

  return config;
}

async function chunkText(
  text: string,
  maxTokensPerChunk: number
): Promise<string[]> {
  console.log(
    `Splitting text into chunks with max ${maxTokensPerChunk} tokens each`
  );
  const lines = text.split("\n");
  console.log(`Text contains ${lines.length} lines`);

  // Pre-compute token counts for each line (with newline)
  console.log("Pre-computing token counts for all lines...");
  const lineTokenCounts: number[] = [];
  const lineTexts: string[] = [];

  for (const line of lines) {
    const lineWithNewline = line + "\n";
    lineTexts.push(lineWithNewline);
    lineTokenCounts.push(await getTokenCount(lineWithNewline));
  }

  // Create chunks based on pre-computed token counts
  const chunks: string[] = [];
  let currentChunk = "";
  let currentChunkTokens = 0;
  let chunkCount = 0;
  let linesInCurrentChunk = 0;

  for (let i = 0; i < lineTexts.length; i++) {
    const lineTokens = lineTokenCounts[i] || 0; // Default to 0 if undefined

    if (currentChunkTokens + lineTokens > maxTokensPerChunk) {
      console.log(
        `Chunk ${
          chunkCount + 1
        } complete: ${currentChunkTokens} tokens, ${linesInCurrentChunk} lines`
      );
      chunks.push(currentChunk);
      currentChunk = "";
      currentChunkTokens = 0;
      linesInCurrentChunk = 0;
      chunkCount++;
    }

    currentChunk += lineTexts[i];
    currentChunkTokens += lineTokens;
    linesInCurrentChunk++;
  }

  if (currentChunk) {
    console.log(
      `Final chunk ${
        chunkCount + 1
      } complete: ${currentChunkTokens} tokens, ${linesInCurrentChunk} lines`
    );
    chunks.push(currentChunk);
  }

  console.log(`Created ${chunks.length} chunks total`);
  return chunks;
}

async function analyzeLogs(chunks: string[], model: string) {
  console.log("Initializing OpenAI client with OpenRouter base URL");
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  // Pre-compute chunk token counts
  console.log("Pre-computing token counts for all chunks...");
  const chunkTokenCounts: number[] = [];
  for (const chunk of chunks) {
    if (chunk) {
      chunkTokenCounts.push(await getTokenCount(chunk));
    } else {
      chunkTokenCounts.push(0);
    }
  }

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "developer",
      content: `
    You are a helpful assistant whose job is to analyze logs and give the user a summary of errors or notable things about the logs.

    You will be given log files in chunks because it may be too long and your job is to iterate on the chunks and provide the user with the summary.

    Keep the output super short and concise. Do not give a report - just a summary of most important things (a couple of paragraphs with pointers).
  `,
    },
  ];
  let analysis = "";

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;

    try {
      console.log(`\nProcessing chunk ${i + 1}/${chunks.length}...`);

      const chunkInputTokens = chunkTokenCounts[i] || 0; // Default to 0 if undefined
      const totalChunkInputTokens = chunkInputTokens;

      console.warn(
        `Chunk ${i + 1}/${chunks.length}: ${chunkInputTokens} content tokens`
      );

      console.log(`Sending API request to model: ${model}...`);
      const response = await openai.chat.completions.create({
        model,
        messages: [
          ...messages,
          { role: "user", content: chunk } as OpenAI.ChatCompletionMessageParam,
        ],
      });
      console.log(`Received API response for chunk ${i + 1}`);

      const content = response.choices[0]?.message.content || "";
      if (content) {
        console.log(
          `Analysis result for chunk ${i + 1}: ${content.length} characters`
        );
        messages.push({
          role: "user",
          content: `Chunk ${i + 1} of ${
            chunks.length
          }: [truncated for brevity]`,
        });
        messages.push({ role: "assistant", content });
        analysis = content;
      } else {
        console.warn(`No content returned for chunk ${i + 1}`);
      }

      // Get usage information from response
      const usage = response.usage;
      if (usage) {
        const outputTokens =
          usage.completion_tokens || (await getTokenCount(content));
        const inputTokens = usage.prompt_tokens || totalChunkInputTokens;

        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;

        console.warn(
          `Chunk ${
            i + 1
          } usage: ${inputTokens} input tokens, ${outputTokens} output tokens`
        );
      } else {
        console.warn(`No usage information available for chunk ${i + 1}`);
      }
    } catch (error) {
      console.error(
        `Error analyzing chunk ${i + 1}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.warn("\nTotal usage summary:");
  console.warn(
    `Total tokens: ${
      totalInputTokens + totalOutputTokens
    } (${totalInputTokens} input, ${totalOutputTokens} output)`
  );

  return analysis;
}

async function main() {
  try {
    console.log("Starting log analysis...");
    const args = parseArgs();
    console.log(
      `Configuration: model=${args.model}, chunkSize=${args.chunkSize}`
    );

    if (args.help) {
      showHelp();
    }

    console.log("Reading input from stdin...");
    const input = await Bun.stdin.text();

    if (!input.trim()) {
      console.error("Error: No input provided");
      console.error("\nUse -h or --help to see usage instructions");
      process.exit(1);
    }

    console.log(`Read ${input.length} characters of input`);
    console.log("Chunking input text...");
    const chunks = await chunkText(input, args.chunkSize);
    console.log(`Created ${chunks.length} chunks for processing`);

    console.warn(
      `Processing ${chunks.length} chunks with model: ${args.model} (chunk size: ${args.chunkSize} tokens)`
    );

    console.log("Beginning analysis of chunks...");
    const results = await analyzeLogs(chunks, args.model);

    if (results.length === 0) {
      console.warn("Warning: No analysis results were generated");
    } else {
      console.log(`Analysis complete. Generated ${results.length} result(s)`);
      console.log("\n--- ANALYSIS RESULTS ---\n");
      console.log(results);
    }
  } catch (error) {
    console.error(
      "Fatal error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

await main();
