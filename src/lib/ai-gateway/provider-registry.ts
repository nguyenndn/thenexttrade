import { AiGatewayProviderAdapter } from "./providers/types";
import { AnthropicAdapter } from "./providers/anthropic";
import { DeepSeekAdapter } from "./providers/deepseek";
import { GoogleAdapter } from "./providers/google";
import { OpenAIAdapter } from "./providers/openai";
import { XAIAdapter } from "./providers/xai";

const adapters: Record<string, AiGatewayProviderAdapter> = {
  anthropic: AnthropicAdapter,
  deepseek: DeepSeekAdapter,
  google: GoogleAdapter,
  openai: OpenAIAdapter,
  xai: XAIAdapter,
};

export function getAdapter(providerCode: string): AiGatewayProviderAdapter | undefined {
  return adapters[providerCode];
}
