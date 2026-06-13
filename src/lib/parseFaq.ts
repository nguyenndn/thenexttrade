/**
 * Utility to parse article HTML content and extract FAQ questions and answers
 * for JSON-LD FAQPage schema injection.
 */

export interface FAQItem {
 question: string;
 answer: string;
}

/**
 * Parses article HTML content to extract FAQ items.
 * Finds the "FAQ" H2 heading, isolates the content, and extracts H3 questions and succeeding answer paragraphs.
 */
export function parseFaq(html: string): FAQItem[] {
 const faqList: FAQItem[] = [];
 
 if (!html) return faqList;

 // Find where the FAQ section starts (H2 heading containing "FAQ")
 const faqRegex = /<h2[^>]*>(?:[^<]*\s+)?FAQ(?:[^<]*)<\/h2>/i;
 const match = html.match(faqRegex);
 
 if (!match) {
 return faqList;
 }
 
 const faqIndex = match.index;
 if (faqIndex === undefined) return faqList;

 // Get content from the start of the FAQ section onwards
 const faqContent = html.substring(faqIndex + match[0].length);
 
 // Regex to extract each H3 question and all succeeding content up to the next H3 or H2 (or end of content)
 const qnaRegex = /<h3[^>]*>(.*?)<\/h3>([\s\S]*?)(?=<h3|<h2|$)/gi;
 let qnaMatch: RegExpExecArray | null;
 
 while ((qnaMatch = qnaRegex.exec(faqContent)) !== null) {
 const question = stripHtml(qnaMatch[1]).trim();
 let answerHtml = qnaMatch[2].trim();
 
 // Clean up figures or other complex nodes from the answer HTML
 answerHtml = answerHtml.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, "");
 
 const cleanAnswer = stripHtml(answerHtml).trim();
 
 if (question && cleanAnswer) {
 faqList.push({
 question,
 answer: cleanAnswer
 });
 }
 }
 
 return faqList;
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
