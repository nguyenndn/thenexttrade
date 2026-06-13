import { chromium, type BrowserContext, type Page } from "playwright";
import * as fs from "node:fs/promises";
import * as path from "node:path";

type ScrapedMessage = {
  index: number;
  timestamp: string | null;
  text: string;
  tags: string[];
};

type ScrollDiagnostics = {
  scrollTop: number | null;
  scrollHeight: number | null;
  clientHeight: number | null;
  atTop: boolean;
  startMarkerFound: boolean;
};

type CliOptions = {
  url: string;
  scrolls: number;
  delayMs: number;
  maxMessages: number;
  stagnantLimit: number;
  wheelDelta: number;
  jumpToBottom: boolean;
  headed: boolean;
  profileDir: string;
  outDir: string;
  label: string;
};

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const getArg = (name: string, fallback?: string) => {
    const exact = args.find((arg) => arg.startsWith(`--${name}=`));
    if (exact) return exact.slice(name.length + 3);
    const index = args.indexOf(`--${name}`);
    if (index >= 0) return args[index + 1] ?? fallback;
    return fallback;
  };

  return {
    url: getArg("url", "https://discord.com/channels/@me")!,
    scrolls: Number(getArg("scrolls", "25")),
    delayMs: Number(getArg("delay", "900")),
    maxMessages: Number(getArg("max", "250")),
    stagnantLimit: Number(getArg("stagnant-limit", "12")),
    wheelDelta: Number(getArg("wheel-delta", "1400")),
    jumpToBottom: getArg("jump-bottom", "true") !== "false",
    headed: getArg("headless", "false") !== "true",
    profileDir: getArg("profile", "test-results/discord-research-profile")!,
    outDir: getArg("out", "competitor-research")!,
    label: getArg("label", "traderwaves-discord")!,
  };
}

function cleanMessageText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/@[a-zA-Z0-9_.-]+/g, "@member")
    .trim();
}

function classifyTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags = new Set<string>();

  if (/(feature|request|would like|could you|can you|please add|allow|support)/i.test(lower)) {
    tags.add("feature-request");
  }
  if (/(bug|issue|problem|flicker|jump|render|broken|not working|fix|error)/i.test(lower)) {
    tags.add("bug-or-ux");
  }
  if (/(integration|ninjatrader|ninja trader|mt4|mt5|broker|exchange|binance|bitget|bybit|okx|coin)/i.test(lower)) {
    tags.add("integration");
  }
  if (/(mobile|ios|iphone|android|responsive|web app)/i.test(lower)) {
    tags.add("mobile");
  }
  if (/(csv|export|download|import|history)/i.test(lower)) {
    tags.add("import-export");
  }
  if (/(free|paid|pricing|plan|subscription|trial)/i.test(lower)) {
    tags.add("pricing-plan");
  }
  if (/(calendar|journal|backtest|analytics|dashboard|report|chart)/i.test(lower)) {
    tags.add("product-surface");
  }

  return Array.from(tags);
}

function uniqueMessages(messages: ScrapedMessage[]): ScrapedMessage[] {
  const seen = new Set<string>();
  const output: ScrapedMessage[] = [];

  for (const message of messages) {
    const key = `${message.timestamp ?? ""}:${message.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ ...message, index: output.length + 1 });
  }

  return output;
}

async function waitForDiscordReady(page: Page) {
  await page.waitForFunction(
    () => {
      return Boolean(
        document.querySelector('[id^="chat-messages-"]') ||
          document.querySelector('[data-list-id="chat-messages"]') ||
          document.querySelector('[role="textbox"][data-slate-editor="true"]')
      );
    },
    { timeout: 0 }
  );
}

async function extractVisibleMessages(page: Page): Promise<ScrapedMessage[]> {
  const raw = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[id^="chat-messages-"]'));

    return nodes
      .map((node) => {
        const contentNodes = Array.from(
          node.querySelectorAll<HTMLElement>(
            '[id^="message-content-"], [class*="markup"]'
          )
        );
        const text = contentNodes
          .map((contentNode) => contentNode.innerText || contentNode.textContent || "")
          .join(" ")
          .trim();
        const time = node.querySelector<HTMLTimeElement>("time[datetime]");

        return {
          timestamp: time?.getAttribute("datetime") || null,
          text,
        };
      })
      .filter((item) => item.text.length > 0);
  });

  return raw.map((item, index) => {
    const text = cleanMessageText(item.text);
    return {
      index: index + 1,
      timestamp: item.timestamp,
      text,
      tags: classifyTags(text),
    };
  });
}

async function scrollMessageListUp(page: Page, wheelDelta: number) {
  await page.evaluate(() => {
    const messageNode = document.querySelector('[id^="chat-messages-"]');
    if (!messageNode) {
      window.scrollBy(0, -window.innerHeight * 0.8);
      return;
    }

    const candidates = Array.from(document.querySelectorAll<HTMLElement>("*"))
      .filter((el) => {
        const style = window.getComputedStyle(el);
        const canScroll = /(auto|scroll)/.test(style.overflowY);
        return canScroll && el.scrollHeight > el.clientHeight + 80 && el.contains(messageNode);
      })
      .sort((a, b) => b.clientHeight - a.clientHeight);

    const scroller = candidates[0];
    if (scroller) {
      scroller.scrollTop = Math.max(0, scroller.scrollTop - scroller.clientHeight * 0.85);
    } else {
      window.scrollBy(0, -window.innerHeight * 0.8);
    }
  });

  const viewport = page.viewportSize();
  if (viewport) {
    await page.mouse.move(Math.round(viewport.width * 0.55), Math.round(viewport.height * 0.45));
    await page.mouse.wheel(0, -Math.abs(wheelDelta));
  }

  await page.keyboard.press("PageUp").catch(() => {});
}

async function jumpMessageListToBottom(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.evaluate(() => {
      const messageNode = document.querySelector('[id^="chat-messages-"]');
      if (!messageNode) {
        window.scrollTo(0, document.documentElement.scrollHeight);
        return;
      }

      const candidates = Array.from(document.querySelectorAll<HTMLElement>("*"))
        .filter((el) => {
          const style = window.getComputedStyle(el);
          const canScroll = /(auto|scroll)/.test(style.overflowY);
          return canScroll && el.scrollHeight > el.clientHeight + 80 && el.contains(messageNode);
        })
        .sort((a, b) => b.clientHeight - a.clientHeight);

      const scroller = candidates[0];
      if (scroller) {
        scroller.scrollTop = scroller.scrollHeight;
      } else {
        window.scrollTo(0, document.documentElement.scrollHeight);
      }
    });
    await page.keyboard.press("End").catch(() => {});
    await page.waitForTimeout(900);
  }
}

async function getScrollDiagnostics(page: Page): Promise<ScrollDiagnostics> {
  return page.evaluate(() => {
    const messageNode = document.querySelector('[id^="chat-messages-"]');
    const pageText = document.body.innerText || "";
    const startMarkerFound =
      /beginning of|start of|welcome to/i.test(pageText) &&
      /feature-request|channel/i.test(pageText);

    if (!messageNode) {
      return {
        scrollTop: null,
        scrollHeight: null,
        clientHeight: null,
        atTop: false,
        startMarkerFound,
      };
    }

    const candidates = Array.from(document.querySelectorAll<HTMLElement>("*"))
      .filter((el) => {
        const style = window.getComputedStyle(el);
        const canScroll = /(auto|scroll)/.test(style.overflowY);
        return canScroll && el.scrollHeight > el.clientHeight + 80 && el.contains(messageNode);
      })
      .sort((a, b) => b.clientHeight - a.clientHeight);

    const scroller = candidates[0];
    if (!scroller) {
      return {
        scrollTop: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: window.innerHeight,
        atTop: window.scrollY <= 5,
        startMarkerFound,
      };
    }

    return {
      scrollTop: Math.round(scroller.scrollTop),
      scrollHeight: Math.round(scroller.scrollHeight),
      clientHeight: Math.round(scroller.clientHeight),
      atTop: scroller.scrollTop <= 5,
      startMarkerFound,
    };
  });
}

function getTimestampRange(messages: ScrapedMessage[]) {
  const sorted = messages
    .map((message) => message.timestamp)
    .filter((timestamp): timestamp is string => Boolean(timestamp))
    .sort();

  return {
    oldest: sorted[0] ?? null,
    newest: sorted[sorted.length - 1] ?? null,
  };
}

function buildMarkdown(label: string, url: string, messages: ScrapedMessage[]): string {
  const byTag = new Map<string, ScrapedMessage[]>();
  for (const message of messages) {
    for (const tag of message.tags.length ? message.tags : ["uncategorized"]) {
      const list = byTag.get(tag) ?? [];
      list.push(message);
      byTag.set(tag, list);
    }
  }

  const sections = Array.from(byTag.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, items]) => {
      const bullets = items
        .slice(0, 30)
        .map((item) => `- ${item.text}${item.timestamp ? ` (${item.timestamp.slice(0, 10)})` : ""}`)
        .join("\n");
      return `## ${tag}\n\n${bullets}`;
    })
    .join("\n\n");

  const opportunityBullets = messages
    .filter((message) => message.tags.length > 0)
    .slice(0, 40)
    .map((message) => {
      const tags = message.tags.join(", ");
      return `- [${tags}] ${message.text}`;
    })
    .join("\n");

  return `# ${label} Research Notes

Source: Discord web channel currently visible in Playwright

URL: ${url}

Collected at: ${new Date().toISOString()}

Privacy: usernames, avatars, emails, and member profiling are intentionally not stored. Messages are used only as anonymized product-research snippets.

## Product Opportunities

${opportunityBullets || "- No tagged product opportunities found in this run."}

${sections}
`;
}

async function writeOutputs(options: CliOptions, messages: ScrapedMessage[]) {
  await fs.mkdir(options.outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const baseName = `${options.label}-${stamp}`;
  const jsonPath = path.join(options.outDir, `${baseName}.json`);
  const mdPath = path.join(options.outDir, `${baseName}.md`);

  await fs.writeFile(jsonPath, JSON.stringify({ url: options.url, messages }, null, 2), "utf8");
  await fs.writeFile(mdPath, buildMarkdown(options.label, options.url, messages), "utf8");

  return { jsonPath, mdPath };
}

async function main() {
  const options = parseArgs();
  const context: BrowserContext = await chromium.launchPersistentContext(options.profileDir, {
    headless: !options.headed,
    viewport: { width: 1440, height: 950 },
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(options.url, { waitUntil: "domcontentloaded" });

  console.log("Discord Research Browser opened.");
  console.log("If needed, log in and navigate to the target channel. The script will continue once chat messages are visible.");

  await waitForDiscordReady(page);

  if (options.jumpToBottom) {
    console.log("Jumping to latest messages before scrolling upward...");
    await jumpMessageListToBottom(page);
  }

  let collected: ScrapedMessage[] = [];
  let lastCount = 0;
  let stagnantRuns = 0;

  for (let run = 0; run <= options.scrolls; run += 1) {
    collected = uniqueMessages([...collected, ...(await extractVisibleMessages(page))]);
    const range = getTimestampRange(collected);
    const diagnostics = await getScrollDiagnostics(page);
    console.log(
      `Run ${run + 1}/${options.scrolls + 1}: collected ${collected.length} unique messages | oldest=${range.oldest?.slice(0, 10) ?? "n/a"} | atTop=${diagnostics.atTop} | startMarker=${diagnostics.startMarkerFound} | scrollTop=${diagnostics.scrollTop ?? "n/a"}`
    );

    if (collected.length >= options.maxMessages) {
      collected = collected.slice(0, options.maxMessages);
      break;
    }

    if (collected.length === lastCount) {
      stagnantRuns += 1;
    } else {
      stagnantRuns = 0;
    }
    lastCount = collected.length;

    if (diagnostics.atTop && stagnantRuns >= 3) {
      console.log("Top of the message list appears to be reached.");
      break;
    }

    if (stagnantRuns >= options.stagnantLimit) break;

    await scrollMessageListUp(page, options.wheelDelta);
    await page.waitForTimeout(options.delayMs);
  }

  const outputs = await writeOutputs(options, collected);
  console.log(`Done. Markdown: ${outputs.mdPath}`);
  console.log(`Done. JSON: ${outputs.jsonPath}`);

  await context.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
