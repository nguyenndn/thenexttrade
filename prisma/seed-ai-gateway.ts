const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AI Gateway models and providers...");
  const defaults = [
    { providerEnum: 1, providerCode: "anthropic", displayName: "Anthropic (Claude)", defaultModelId: "claude-3-5-sonnet-latest", baseUrl: "https://api.anthropic.com/v1/messages" },
    { providerEnum: 2, providerCode: "openai", displayName: "OpenAI (GPT)", defaultModelId: "gpt-4o", baseUrl: "https://api.openai.com/v1/chat/completions" },
    { providerEnum: 3, providerCode: "google", displayName: "Google (Gemini)", defaultModelId: "gemini-1.5-pro", baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={secret}" },
    { providerEnum: 4, providerCode: "deepseek", displayName: "DeepSeek", defaultModelId: "deepseek-chat", baseUrl: "https://api.deepseek.com/v1/chat/completions" },
    { providerEnum: 5, providerCode: "xai", displayName: "xAI (Grok)", defaultModelId: "grok-beta", baseUrl: "https://api.x.ai/v1/chat/completions" },
  ];

  for (const d of defaults) {
    const existing = await prisma.aiProvider.findUnique({
      where: { providerCode: d.providerCode }
    });

    if (!existing) {
      await prisma.aiProvider.create({
        data: {
          providerEnum: d.providerEnum,
          providerCode: d.providerCode,
          displayName: d.displayName,
          defaultModelId: d.defaultModelId,
          baseUrl: d.baseUrl,
          enabled: true,
          healthStatus: "UNKNOWN",
        }
      });
      console.log(`Created provider: ${d.providerCode}`);
    } else if (!existing.baseUrl || existing.baseUrl === "generativelanguage.googleapis.com") {
      await prisma.aiProvider.update({
        where: { id: existing.id },
        data: { baseUrl: d.baseUrl }
      });
      console.log(`Updated provider base_url: ${d.providerCode}`);
    }
  }

  const defaultModels = [
    { providerCode: "anthropic", modelCode: "claude-3-5-sonnet-latest", displayName: "Claude 3.5 Sonnet", supportsJsonMode: true, contextLimit: 200000 },
    { providerCode: "anthropic", modelCode: "claude-3-haiku-20240307", displayName: "Claude 3 Haiku", supportsJsonMode: true, contextLimit: 200000 },
    { providerCode: "openai", modelCode: "gpt-4o", displayName: "GPT-4o", supportsJsonMode: true, contextLimit: 128000 },
    { providerCode: "openai", modelCode: "gpt-4o-mini", displayName: "GPT-4o Mini", supportsJsonMode: true, contextLimit: 128000 },
    { providerCode: "google", modelCode: "gemini-1.5-pro", displayName: "Gemini 1.5 Pro", supportsJsonMode: true, contextLimit: 2000000 },
    { providerCode: "google", modelCode: "gemini-1.5-flash", displayName: "Gemini 1.5 Flash", supportsJsonMode: true, contextLimit: 1000000 },
    { providerCode: "deepseek", modelCode: "deepseek-chat", displayName: "DeepSeek Chat (V3)", supportsJsonMode: true, contextLimit: 64000 },
    { providerCode: "deepseek", modelCode: "deepseek-reasoner", displayName: "DeepSeek Reasoner (R1)", supportsJsonMode: false, contextLimit: 64000 },
    { providerCode: "xai", modelCode: "grok-beta", displayName: "Grok Beta", supportsJsonMode: true, contextLimit: 131072 },
    { providerCode: "xai", modelCode: "grok-2-latest", displayName: "Grok 2", supportsJsonMode: true, contextLimit: 131072 }
  ];

  for (const m of defaultModels) {
    const provider = await prisma.aiProvider.findUnique({ where: { providerCode: m.providerCode } });
    if (provider) {
      const existing = await prisma.aiModel.findFirst({
        where: { providerId: provider.id, modelCode: m.modelCode }
      });
      if (!existing) {
        await prisma.aiModel.create({
          data: {
            providerId: provider.id,
            modelCode: m.modelCode,
            displayName: m.displayName,
            supportsJsonMode: m.supportsJsonMode,
            contextLimit: m.contextLimit
          }
        });
        console.log(`Created model: ${m.modelCode} for ${m.providerCode}`);
      }
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};