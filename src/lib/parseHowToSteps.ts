/**
 * Parse article HTML content into HowToStep objects for JSON-LD schema.
 * Extracts H2 headings as step names and content between headings as step text.
 */

export interface HowToStep {
  "@type": "HowToStep";
  name: string;
  text: string;
  position: number;
}

export interface HowToData {
  steps: HowToStep[];
  description: string;
}

/**
 * Parse HTML content to extract HowTo steps from H2 headings.
 * Each <h2> becomes a step name, and text content between H2s becomes the step text.
 */
export function parseHowToSteps(html: string): HowToData {
  // Extract first paragraph as description (text before first H2)
  const firstH2Index = html.search(/<h2[\s>]/i);
  let description = "";

  if (firstH2Index > 0) {
    const beforeH2 = html.slice(0, firstH2Index);
    description = stripHtml(beforeH2).trim();
  }

  // Split by H2 headings and extract steps
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const sections: { name: string; startIndex: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = h2Regex.exec(html)) !== null) {
    sections.push({
      name: stripHtml(match[1]).trim(),
      startIndex: match.index + match[0].length,
    });
  }

  const steps: HowToStep[] = sections.map((section, i) => {
    const endIndex = i < sections.length - 1
      ? html.indexOf("<h2", section.startIndex)
      : html.length;

    const sectionHtml = html.slice(section.startIndex, endIndex);
    const text = stripHtml(sectionHtml).trim();

    return {
      "@type": "HowToStep" as const,
      name: section.name,
      text: text.slice(0, 500), // Keep step text concise for schema
      position: i + 1,
    };
  });

  return { steps, description: description.slice(0, 300) };
}

/** Convert minutes to ISO 8601 duration (e.g. 90 → "PT1H30M") */
export function minutesToIsoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `PT${h}H${m}M`;
  if (h > 0) return `PT${h}H`;
  return `PT${m}M`;
}

/** Strip HTML tags and decode basic entities */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
