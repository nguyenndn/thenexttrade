import { ProviderExecutionInput, ProviderExecutionResult, AiGatewayProviderAdapter } from "./types";
import { testAnthropicCredential } from "./credential-test";

export const AnthropicAdapter: AiGatewayProviderAdapter = {
  providerCode: "anthropic",

  testCredential(input) {
    return testAnthropicCredential(input);
  },

  async execute(input: ProviderExecutionInput): Promise<ProviderExecutionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), input.timeoutMs);

    let res: Response | undefined;
    let responseText = "";

    try {
      res = await fetch(input.baseUrl || "https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": input.decryptedSecret,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: input.modelId || "claude-3-5-sonnet-20240620",
          system: input.systemPrompt,
          messages: [
            { role: "user", content: JSON.stringify(input.snapshot) }
          ],
          temperature: 0.2,
          max_tokens: 1500
        }),
        signal: controller.signal
      });

      responseText = await res.text();
    } catch (error: any) {
      if (error.name === "AbortError") {
        return {
          ok: false,
          error_code: "PROVIDER_TIMEOUT",
          message: "Request to Anthropic timed out."
        };
      }
      return {
        ok: false,
        error_code: "PROVIDER_CONNECTION_ERROR",
        message: error.message || "Failed to connect to Anthropic."
      };
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      return {
        ok: false,
        error_code: res.status === 429 ? "PROVIDER_RATE_LIMIT" : (res.status === 401 ? "PROVIDER_AUTH_ERROR" : "MODEL_PROVIDER_ERROR"),
        message: `Anthropic returned HTTP ${res.status}`,
        rawResponseText: responseText,
        httpStatus: res.status
      };
    }

    let aiData;
    try {
      aiData = JSON.parse(responseText);
    } catch {
      return {
        ok: false,
        error_code: "MODEL_RESPONSE_INVALID",
        message: "Anthropic returned malformed JSON (outer payload).",
        rawResponseText: responseText,
        httpStatus: res.status
      };
    }

    if (aiData.type === "error") {
      return {
        ok: false,
        error_code: "MODEL_PROVIDER_ERROR",
        message: aiData.error?.message || "Anthropic returned an error payload.",
        rawResponseText: responseText,
        httpStatus: res.status
      };
    }

    let content = aiData.content?.[0]?.text || "{}";
    
    // Clean up markdown block if present
    if (content.startsWith("\`\`\`")) {
       const firstNewline = content.indexOf("\n");
       if (firstNewline !== -1) content = content.substring(firstNewline + 1);
       if (content.endsWith("\`\`\`")) content = content.substring(0, content.length - 3);
       content = content.trim();
    }
    if (content.startsWith("json")) {
       content = content.substring(4).trim();
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      return {
        ok: false,
        error_code: "MODEL_RESPONSE_INVALID",
        message: "Anthropic returned invalid JSON inside the completion content.",
        rawResponseText: responseText,
        httpStatus: res.status
      };
    }

    return {
      ok: true,
      data: parsedJson,
      httpStatus: res.status,
      inputTokens: aiData.usage?.input_tokens,
      outputTokens: aiData.usage?.output_tokens,
      providerRequestId: aiData.id,
      finishReason: aiData.stop_reason
    };
  }
};
