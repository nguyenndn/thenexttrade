import { CredentialTestInput, CredentialTestResult } from "./types";

async function runCredentialProbe(
    url: string,
    headers: Record<string, string>,
    body: unknown,
    timeoutMs: number
): Promise<CredentialTestResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        if (response.ok) return { ok: true };
        if (response.status === 401 || response.status === 403) {
            return {
                ok: false,
                message: `Provider authentication failed (HTTP ${response.status})`,
            };
        }
        return {
            ok: false,
            message: `Provider credential probe failed (HTTP ${response.status})`,
        };
    } catch (error) {
        const message =
            error instanceof Error && error.name === "AbortError"
                ? "Provider credential probe timed out"
                : "Provider credential probe could not connect";
        return { ok: false, message };
    } finally {
        clearTimeout(timeoutId);
    }
}

export function testOpenAiCompatibleCredential(
    input: CredentialTestInput,
    defaultUrl: string
): Promise<CredentialTestResult> {
    return runCredentialProbe(
        input.baseUrl || defaultUrl,
        {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.decryptedSecret}`,
        },
        {
            model: input.modelId,
            messages: [{ role: "user", content: "Reply OK" }],
            max_tokens: 1,
            temperature: 0,
        },
        input.timeoutMs ?? 10000
    );
}

export function testAnthropicCredential(
    input: CredentialTestInput
): Promise<CredentialTestResult> {
    return runCredentialProbe(
        input.baseUrl || "https://api.anthropic.com/v1/messages",
        {
            "Content-Type": "application/json",
            "x-api-key": input.decryptedSecret,
            "anthropic-version": "2023-06-01",
        },
        {
            model: input.modelId,
            max_tokens: 1,
            messages: [{ role: "user", content: "Reply OK" }],
        },
        input.timeoutMs ?? 10000
    );
}
