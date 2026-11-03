import { JsonLd } from "@/components/seo/JsonLd";
import { ALL_FAQS } from "@/config/home-faq-data";

export function FAQStructuredData() {
    return (
        <JsonLd
            type="FAQPage"
            data={{
                mainEntity: ALL_FAQS.map((faq) => ({
                    "@type": "Question",
                    name: faq.question,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: faq.answer,
                    },
                })),
            }}
        />
    );
}
