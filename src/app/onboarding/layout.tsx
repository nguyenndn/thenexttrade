import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Onboarding | Complete Your Profile",
    description: "Complete your trader profile to personalize your GSN CRM experience.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
