/**
 * Blank layout for auth/success transition page.
 * Overrides the parent AuthLayout so the full-screen
 * loading overlay renders without the login form chrome.
 */
export default function SuccessLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <>{children}</>;
}
