const AVG_CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
}

export function estimateHtmlTokens(html: string): number {
  return Math.ceil(html.length / AVG_CHARS_PER_TOKEN);
}

export function calculateSavings(
  originalTokens: number,
  reducedTokens: number,
): number {
  if (originalTokens === 0) return 0;
  return Math.round(((originalTokens - reducedTokens) / originalTokens) * 100);
}
