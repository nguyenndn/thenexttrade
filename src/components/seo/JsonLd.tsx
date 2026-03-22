import React from 'react';

type JsonLdProps = {
    type: "Article" | "Course" | "BreadcrumbList" | "WebSite" | "Organization" | "FAQPage" | "HowTo" | "SoftwareApplication";
    data: any;
};

export const JsonLd: React.FC<JsonLdProps> = ({ type, data }) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": type,
        ...data
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
};
