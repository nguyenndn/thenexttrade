import { ProviderExecutionInput, ProviderExecutionResult, AiGatewayProviderAdapter } from "./types";
import { testOpenAiCompatibleCredential } from "./credential-test";

export const XAIAdapter: AiGatewayProviderAdapter = {
  providerCode: "xai",

  testCredential(input) {
    return testOpenAiCompatibleCredential(input, "https://api.x.ai/v1/chat/completions");
  },

  async execute(input: ProviderExecutionInput): Promise<ProviderExecutionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), input.timeoutMs);

    let res: Response | undefined;
    let responseText = "";

    try {
      res = await fetch(input.baseUrl || "https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${input.decryptedSecret}`,
        },
        body: JSON.stringify({
          model: input.modelId || "grok-2-latest",
          messages: [
            { role: "system", content: input.systemPrompt },
            { role: "user", content: JSON.stringify(input.snapshot) }
          ],
          response_format: { type: "json_object" },
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
          message: "Request to xAI timed out."
        };
      }
      return {
        ok: false,
        error_code: "PROVIDER_CONNECTION_ERROR",
        message: error.message || "Failed to connect to xAI."
      };
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      return {
        ok: false,
        error_code: res.status === 429 ? "PROVIDER_RATE_LIMIT" : (res.status === 401 ? "PROVIDER_AUTH_ERROR" : "MODEL_PROVIDER_ERROR"),
        message: `xAI returned HTTP ${res.status}`,
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
        message: "xAI returned malformed JSON (outer payload).",
        rawResponseText: responseText,
        httpStatus: res.status
      };
    }

    if (aiData.error) {
      return {
        ok: false,
        error_code: "MODEL_PROVIDER_ERROR",
        message: aiData.error.message || "xAI returned an error payload.",
        rawResponseText: responseText,
        httpStatus: res.status
      };
    }

    let content = aiData.choices?.[0]?.message?.content || "{}";
    
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
        message: "xAI returned invalid JSON inside the completion content.",
        rawResponseText: responseText,
        httpStatus: res.status
      };
    }

    return {
      ok: true,
      data: parsedJson,
      httpStatus: res.status,
      inputTokens: aiData.usage?.prompt_tokens,
      outputTokens: aiData.usage?.completion_tokens,
      providerRequestId: aiData.id,
      finishReason: aiData.choices?.[0]?.finish_reason
    };
  }
};
