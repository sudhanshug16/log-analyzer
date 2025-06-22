export const tokenCache = new Map<string, number>();

import { encode } from "gpt-tokenizer";

/**
 * Count GPT tokens for a text string, caching results for short strings.
 */
export async function getTokenCount(text: string): Promise<number> {
  if (!text) return 0;
  const cacheKey =
    text.length <= 100
      ? text
      : `${text.substring(0, 50)}${text.length}${text.substring(
          text.length - 50
        )}`;
  if (!tokenCache.has(cacheKey)) {
    tokenCache.set(cacheKey, encode(text).length);
  }
  return tokenCache.get(cacheKey)!;
}

/**
 * Split large text into chunks that are roughly within the provided token limit.
 * It keeps line-breaks intact to avoid splitting within log lines.
 */
export async function chunkText(
  text: string,
  maxTokensPerChunk: number
): Promise<string[]> {
  const lines = text.split("\n");
  const lineTokenCounts: number[] = [];
  const lineTexts: string[] = [];

  for (const line of lines) {
    const lineWithNewline = line + "\n";
    lineTexts.push(lineWithNewline);
    lineTokenCounts.push(await getTokenCount(lineWithNewline));
  }

  const chunks: string[] = [];
  let currentChunk = "";
  let currentTokens = 0;

  for (let i = 0; i < lineTexts.length; i++) {
    const tks = lineTokenCounts[i] || 0;
    if (currentTokens + tks > maxTokensPerChunk) {
      chunks.push(currentChunk);
      currentChunk = "";
      currentTokens = 0;
    }
    currentChunk += lineTexts[i];
    currentTokens += tks;
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

/**
 * Human-readable bytes information against the 5 MB limit.
 */
export function bytesInfo(bytes: number, maxSizeBytes = 5 * 1024 * 1024) {
  return `${(bytes / 1024).toFixed(1)} KB / ${(maxSizeBytes / 1024).toFixed(
    0
  )} KB`;
}
