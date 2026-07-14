import { CredentialTestInput, CredentialTestResult, ProviderExecutionInput, ProviderExecutionResult, AiGatewayProviderAdapter } from "./types";

export function buildGoogleUrl(baseUrl: string, modelId: string, secret: string): string {
  const base = baseUrl || "https://generativelanguage.googleapis.com";
  let url: string;
  if (base.includes("{model}")) {
    url = base.replace("{model}", encodeURIComponent(modelId));
  } else {
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    url = cleanBase === "https://generativelanguage.googleapis.com" || !cleanBase.includes("/v1")
      ? `${cleanBase}/v1beta/models/${encodeURIComponent(modelId)}:generateContent`
      : cleanBase;
  }

  if (url.includes("{secret}")) return url.replace("{secret}", encodeURIComponent(secret));
  if (/([?&]key=)[^&]*/i.test(url)) {
    return url.replace(/([?&]key=)[^&]*/i, `$1${encodeURIComponent(secret)}`);
  }
  return `${url}${url.includes("?") ? "&" : "?"}key=${encodeURIComponent(secret)}`;
}

export const GoogleAdapter: AiGatewayProviderAdapter = {
  providerCode: "google",

  async execute(input: ProviderExecutionInput): Promise<ProviderExecutionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), input.timeoutMs);

    let res: Response | undefined;
    let responseText = "";
    let url = "";

    try {
      const model = input.modelId || "gemini-1.5-flash";
      url = buildGoogleUrl(input.baseUrl, model, input.decryptedSecret);

      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: input.systemPrompt }]
          },
          contents: [
            { role: "user", parts: [{ text: JSON.stringify(input.snapshot) }] }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1500,
            responseMimeType: "application/json"
          }
        }),
        signal: controller.signal
      });

      responseText = await res.text();
    } catch (error: any) {
      if (error.name === "AbortError") {
        return {
          ok: false,
          error_code: "PROVIDER_TIMEOUT",
          message: "Request to Google timed out."
        };
      }
      return {
        ok: false,
        error_code: "PROVIDER_CONNECTION_ERROR",
        message: error.message || "Failed to connect to Google API."
      };
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      return {
        ok: false,
        error_code: res.status === 429 ? "PROVIDER_RATE_LIMIT" : (res.status === 401 ? "PROVIDER_AUTH_ERROR" : "MODEL_PROVIDER_ERROR"),
        message: `Google returned HTTP ${res.status}`,
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
        message: "Google returned malformed JSON (outer payload).",
        rawResponseText: responseText,
        httpStatus: res.status
      };
    }

    if (aiData.error) {
      return {
        ok: false,
        error_code: "MODEL_PROVIDER_ERROR",
        message: aiData.error.message || "Google returned an error payload.",
        rawResponseText: responseText,
        httpStatus: res.status
      };
    }

    let content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
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
        message: "Google returned invalid JSON inside the completion content.",
        rawResponseText: responseText,
        httpStatus: res.status
      };
    }

    return {
      ok: true,
      data: parsedJson,
      httpStatus: res.status,
      inputTokens: aiData.usageMetadata?.promptTokenCount,
      outputTokens: aiData.usageMetadata?.candidatesTokenCount,
      providerRequestId: "", // Gemini doesn't return a direct request ID in standard payload
      finishReason: aiData.candidates?.[0]?.finishReason
    };
  },

  async testCredential(input: CredentialTestInput): Promise<CredentialTestResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), input.timeoutMs || 10000);
    try {
      const model = input.modelId || "gemini-1.5-flash";
      const url = buildGoogleUrl(input.baseUrl, model, input.decryptedSecret);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "test" }] }],
          generationConfig: { maxOutputTokens: 1 }
        }),
        signal: controller.signal
      });
      if (res.ok) return { ok: true };
      return { ok: false, message: `HTTP ${res.status}` };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error && error.name === "AbortError"
          ? "Provider credential probe timed out"
          : "Provider credential probe could not connect"
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
