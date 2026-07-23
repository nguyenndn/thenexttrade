import { AiGatewayProviderAdapter } from "./providers/types";
import { AnthropicAdapter } from "./providers/anthropic";
import { DeepSeekAdapter } from "./providers/deepseek";
import { GoogleAdapter } from "./providers/google";
import { OpenAIAdapter } from "./providers/openai";
import { XAIAdapter } from "./providers/xai";
import { OpenRouterAdapter } from "./providers/openrouter";

const adapters: Record<string, AiGatewayProviderAdapter> = {
    anthropic: AnthropicAdapter,
    deepseek: DeepSeekAdapter,
    google: GoogleAdapter,
    openai: OpenAIAdapter,
    openrouter: OpenRouterAdapter,
    xai: XAIAdapter,
};

export function getAdapter(
    providerCode: string
): AiGatewayProviderAdapter | undefined {
    return adapters[providerCode];
}
