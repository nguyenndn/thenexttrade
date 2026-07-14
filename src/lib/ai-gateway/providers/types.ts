export interface ProviderExecutionInput {
  requestId: string;
  baseUrl: string;
  modelId: string;
  decryptedSecret: string;
  systemPrompt: string;
  snapshot: any;
  timeoutMs: number;
}

export interface ProviderExecutionResult {
  ok: boolean;
  data?: any;
  error_code?: string;
  message?: string;
  rawResponseText?: string;
  httpStatus?: number;
  inputTokens?: number;
  outputTokens?: number;
  providerRequestId?: string;
  finishReason?: string;
}

export interface CredentialTestInput {
  baseUrl: string;
  decryptedSecret: string;
  timeoutMs?: number;
  modelId: string;
}

export interface CredentialTestResult {
  ok: boolean;
  message?: string;
}

export interface AiGatewayProviderAdapter {
  providerCode: string;
  execute(input: ProviderExecutionInput): Promise<ProviderExecutionResult>;
  testCredential(input: CredentialTestInput): Promise<CredentialTestResult>;
}
