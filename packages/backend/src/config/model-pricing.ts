export function getModelPrice(model: string): { input: number; output: number } {
  const normalized = model.toLowerCase();
  return MODEL_PRICING[normalized] ?? MODEL_PRICING["default"] ?? { input: 0, output: 0 };
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number | null {
  const price = getModelPrice(model);
  if (!price.input && !price.output) return null;
  return (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
}

export function registerModelPrice(model: string, price: { input: number; output: number }): void {
  MODEL_PRICING[model.toLowerCase()] = price;
}

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  default: { input: 0.50, output: 1.50 },
  "claude-opus-4": { input: 15.00, output: 75.00 },
  "claude-sonnet-4": { input: 3.00, output: 15.00 },
  "deepseek-v4-pro": { input: 2.50, output: 8.00 },
  "deepseek-v4-flash": { input: 0.27, output: 1.10 },
  "gpt-4o": { input: 5.00, output: 15.00 },
};
