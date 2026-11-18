import {
    buildUnifiedEmailHtml,
    EMAIL_GOLD_COLORS,
    GOLD_CTA_BUTTON_STYLE,
    GOLD_SECONDARY_BUTTON_STYLE,
} from "@/lib/services/email.service";
import {
    interpolateRecipientVars,
    resolveSafeEmailUrl,
} from "./marketing-campaign-shared";

export * from "./marketing-campaign-shared";

function escapeHtml(raw: string): string {
    return raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Converts plain text with safe inline formatting (`**bold**` and `[label](https://...)`)
 * into clean email-safe `<p>` HTML blocks after escaping raw HTML tags.
 */
export function renderFormattedBodyHtml(
    rawBody: string,
    recipientName: string | null | undefined,
    appUrl: string
): string {
    const interpolated = interpolateRecipientVars(rawBody, recipientName);
    const paragraphs = interpolated
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

    return paragraphs
        .map((para) => {
            let escaped = escapeHtml(para);

            escaped = escaped.replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                (_match, label: string, rawHref: string) => {
                    const unescapedHref = rawHref.replace(/&amp;/g, "&");
                    const safeHref = resolveSafeEmailUrl(unescapedHref, appUrl);
                    if (!safeHref) return label;
                    return `<a href="${escapeHtml(safeHref)}" style="color:${EMAIL_GOLD_COLORS.brandGoldDark};font-weight:700;text-decoration:underline;">${label}</a>`;
                }
            );

            escaped = escaped.replace(
                /\*\*([^*]+)\*\*/g,
                '<strong style="color:#111827;font-weight:700;">$1</strong>'
            );

            escaped = escaped.replace(/\n/g, "<br />");

            return `<p style="font-size:15px;color:#374151;line-height:1.68;margin:0 0 16px 0;">${escaped}</p>`;
        })
        .join("\n");
}

export interface BuildMarketingEmailParams {
    subject: string;
    preheader?: string;
    badgeText?: string;
    heading: string;
    bodyContent: string;
    highlightTitle?: string;
    highlightItems?: string[];
    ctaLabel?: string;
    ctaUrl?: string;
    secondaryCtaLabel?: string;
    secondaryCtaUrl?: string;
    footerNote?: string;
    recipientName?: string | null;
    appUrl?: string;
    unsubscribeUrl?: string;
}

export function buildMarketingCampaignEmail(
    params: BuildMarketingEmailParams
): { subject: string; html: string; text: string } {
    const appUrl = (
        params.appUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://thenexttrade.app"
    ).replace(/\/+$/, "");

    const resolvedSubject = interpolateRecipientVars(
        params.subject.trim(),
        params.recipientName
    );
    const resolvedHeading = escapeHtml(
        interpolateRecipientVars(params.heading.trim(), params.recipientName)
    );
    const resolvedPreheader = params.preheader?.trim()
        ? escapeHtml(
              interpolateRecipientVars(
                  params.preheader.trim(),
                  params.recipientName
              )
          )
        : undefined;

    const badgeHtml = params.badgeText?.trim()
        ? `<div style="margin-bottom:12px;">
             <span style="display:inline-block;background-color:${EMAIL_GOLD_COLORS.brandGoldBadgeBg};border:1px solid ${EMAIL_GOLD_COLORS.brandGoldBadgeBorder};color:${EMAIL_GOLD_COLORS.brandGoldDark};font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;padding:4px 12px;border-radius:999px;">
               ${escapeHtml(params.badgeText.trim())}
             </span>
           </div>`
        : "";

    const formattedParagraphsHtml = renderFormattedBodyHtml(
        params.bodyContent,
        params.recipientName,
        appUrl
    );

    const items = params.highlightItems || [];
    const highlightHtml =
        items.length > 0
            ? `<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-left:3px solid ${EMAIL_GOLD_COLORS.brandGold};border-radius:12px;padding:18px 20px;margin:20px 0;">
                 ${
                     params.highlightTitle?.trim()
                         ? `<div style="font-weight:800;font-size:14px;color:#111827;margin-bottom:10px;">${escapeHtml(interpolateRecipientVars(params.highlightTitle.trim(), params.recipientName))}</div>`
                         : ""
                 }
                 <ul style="margin:0;padding-left:20px;">
                   ${items
                       .map(
                           (item) =>
                               `<li style="margin:6px 0;color:#374151;font-size:14px;line-height:1.6;">${escapeHtml(interpolateRecipientVars(item, params.recipientName))}</li>`
                       )
                       .join("")}
                 </ul>
               </div>`
            : "";

    const primaryHref = resolveSafeEmailUrl(params.ctaUrl, appUrl);
    const primaryLabel = params.ctaLabel?.trim();
    const secondaryHref = resolveSafeEmailUrl(params.secondaryCtaUrl, appUrl);
    const secondaryLabel = params.secondaryCtaLabel?.trim();

    const hasPrimary = Boolean(primaryLabel && primaryHref);
    const hasSecondary = Boolean(secondaryLabel && secondaryHref);

    const ctaBlockHtml =
        hasPrimary || hasSecondary
            ? `<div style="text-align:center;margin:24px 0 14px 0;font-size:0;">
                 ${
                     hasPrimary
                         ? `<a href="${escapeHtml(primaryHref!)}" style="${GOLD_CTA_BUTTON_STYLE} margin: 5px;">${escapeHtml(primaryLabel!)}</a>`
                         : ""
                 }
                 ${
                     hasSecondary
                         ? `<a href="${escapeHtml(secondaryHref!)}" style="${GOLD_SECONDARY_BUTTON_STYLE} margin: 5px;">${escapeHtml(secondaryLabel!)}</a>`
                         : ""
                 }
               </div>`
            : "";

    const footerNoteHtml = params.footerNote?.trim()
        ? `<p style="font-size:13px;color:#6B7280;line-height:1.6;margin:18px 0 0 0;padding-top:14px;border-top:1px dashed #E5E7EB;">
             <em>${escapeHtml(interpolateRecipientVars(params.footerNote.trim(), params.recipientName))}</em>
           </p>`
        : "";

    const bodyHtml = `
  <div style="padding:4px 0;">
    <div style="text-align:center;margin-bottom:22px;">
      ${badgeHtml}
      <h2 style="margin:0;font-size:23px;font-weight:800;color:#111827;line-height:1.3;letter-spacing:-0.3px;">${resolvedHeading}</h2>
    </div>
    ${formattedParagraphsHtml}
    ${highlightHtml}
    ${ctaBlockHtml}
    ${footerNoteHtml}
  </div>`.trim();

    const html = buildUnifiedEmailHtml({
        subject: resolvedSubject,
        preheader: resolvedPreheader,
        bodyHtml,
        appUrl,
        unsubscribeUrl: params.unsubscribeUrl,
    });

    const plainBody = interpolateRecipientVars(
        params.bodyContent,
        params.recipientName
    );
    const plainBullets =
        items.length > 0
            ? `\n\n${params.highlightTitle ? `${params.highlightTitle}\n` : ""}${items.map((i) => `- ${interpolateRecipientVars(i, params.recipientName)}`).join("\n")}`
            : "";
    const plainCta = hasPrimary ? `\n\n${primaryLabel}: ${primaryHref}` : "";
    const unsubTextHref =
        params.unsubscribeUrl || `${appUrl}/dashboard/settings`;
    const text = `${interpolateRecipientVars(params.heading, params.recipientName)}\n\n${plainBody}${plainBullets}${plainCta}\n\nManage Preferences / Unsubscribe: ${unsubTextHref}`;

    return {
        subject: resolvedSubject,
        html,
        text,
    };
}
