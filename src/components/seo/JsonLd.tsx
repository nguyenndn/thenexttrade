import React from 'react';
import { Article, WithContext, Course, BreadcrumbList, WebSite, Organization, FAQPage } from 'schema-dts';

type JsonLdProps = {
    type: "Article" | "Course" | "BreadcrumbList" | "WebSite" | "Organization" | "FAQPage";
    data: any; // We can improve typing later if needed, or use specific mapped types
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
