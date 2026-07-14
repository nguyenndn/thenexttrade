import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import * as executionResolver from "@/lib/ai-gateway/execution-resolver";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

vi.mock("@/lib/ai-gateway/execution-resolver", () => ({
  resolveExecutionPlan: vi.fn(),
}));

describe("GET /api/v1/ai/health", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns degraded if no policy or candidate is found", async () => {
    vi.mocked(executionResolver.resolveExecutionPlan).mockResolvedValue({
      policy: null,
      modelIds: [],
      steps: [],
    } as any);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("degraded");
    expect(body.provider).toBe("offline");
  });

  it("returns degraded with DB offline if DB throws", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("DB Connection failed"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.database).toBe("offline");
    expect(body.provider).toBe("unknown");
  });

  it("returns online if an execution candidate is found", async () => {
    vi.mocked(executionResolver.resolveExecutionPlan).mockResolvedValue({
      policy: { id: "p1" },
      modelIds: ["model"],
      steps: [
        {
          kind: "candidate",
          candidate: {
            provider: "mock",
            credential: { id: "1", decryptedSecret: "secret" },
            modelCode: "model",
          }
        },
        {
          kind: "skipped",
          diagnostic: {
            modelId: "skipped_model",
            errorCode: "TEST_SKIP",
            reason: "Reason skipped"
          }
        }
      ],
    } as any);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("online");
    expect(body.provider).toBe("online");
    expect(body.routing.policy_configured).toBe(true);
    expect(body.routing.routable_models).toBe(1);
    expect(body.routing.skipped_models).toHaveLength(1);
    expect(body.routing.skipped_models[0].code).toBe("TEST_SKIP");
    
    // Ensure no sensitive data is leaked
    const bodyString = JSON.stringify(body);
    expect(bodyString).not.toContain("secret");
  });
});
