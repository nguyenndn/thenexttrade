import React from "react";

type JsonLdProps = {
    type:
        | "Article"
        | "Course"
        | "BreadcrumbList"
        | "WebSite"
        | "Organization"
        | "FAQPage"
        | "HowTo"
        | "SoftwareApplication";
    data: any;
};

export const JsonLd: React.FC<JsonLdProps> = ({ type, data }) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": type,
        ...data,
    };

    // JSON.stringify does not escape "<" / ">" / "&", so a user-controlled
    // string (e.g. an article title or a profile display name) containing
    // "</script>" would terminate the tag and execute attacker HTML. Escape
    // before injecting into the script element.
    const escapedJson = JSON.stringify(schema)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026");

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: escapedJson }}
        />
    );
};
