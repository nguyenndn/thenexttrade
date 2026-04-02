import { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Privacy Policy | TheNextTrade',
    description: 'Privacy Policy and Data Protection information for TheNextTrade.',
};

export default function PrivacyPolicyPage() {
    return (
        <>
            <div className="max-w-3xl mx-auto text-center space-y-6 mb-20 mt-12">
                <div className="inline-flex items-center justify-center p-3 rounded-xl bg-cyan-500/10 text-cyan-500 mb-2 ring-4 ring-cyan-500/5 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
                    <Shield size={40} strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700">Privacy Policy</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-8 md:p-14 shadow-xl prose dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-li:text-gray-600 dark:prose-li:text-gray-400 prose-strong:text-gray-900 dark:prose-strong:text-white max-w-none transition-colors duration-300">


            <h2>1. Information We Collect</h2>
            <p>
                We collect information that you voluntarily provide to us when you enroll in our platform or interact with our services:
            </p>
            <h3>Personal Information:</h3>
            <ul>
                <li><strong>Identification Data:</strong> Your first and/or last name.</li>
                <li><strong>Contact Information:</strong> Email address for communication and updates, and optionally a phone number for SMS notifications.</li>
                <li><strong>Community Connections:</strong> Telegram username or Discord ID to connect you with our trading community.</li>
                <li><strong>Demographics:</strong> Country of residence to understand our global audience and comply with local regulations.</li>
            </ul>

            <h3>Automatically Collected Information:</h3>
            <ul>
                <li>IP address and general location data.</li>
                <li>Browser type, version, and device information.</li>
                <li>Pages visited, features used, and time spent on our site.</li>
                <li>Referring website or source.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
                We use the information we collect for the following purposes:
            </p>
            <ul>
                <li><strong>Account Management:</strong> To process and manage your registration and subscription to TheNextTrade.</li>
                <li><strong>Communications:</strong> To send you platform updates, notifications, trading insights, API alerts, and educational content.</li>
                <li><strong>Community Building:</strong> To verify your access to our exclusive community channels.</li>
                <li><strong>Service Improvement:</strong> To analyze usage patterns, optimize our algorithms, and improve user experience across our ecosystem.</li>
                <li><strong>Security & Legal Compliance:</strong> To prevent fraudulent activity, secure your account, and comply with applicable financial and data protection laws.</li>
            </ul>

            <h2>3. Third-Party Services</h2>
            <p>
                To provide you with the best experience, we utilize secure third-party services that may process your data:
            </p>
            <ul>
                <li><strong>Cloudflare:</strong> For website security, DDoS protection, and performance optimization.</li>
                <li><strong>Authentication Providers:</strong> Supabase and OAuth providers (like Google or Discord) for secure login.</li>
                <li><strong>Communication Platforms:</strong> Telegram for community integration.</li>
                <li><strong>Payment Processors:</strong> Stripe or similar verified gateways for handling subscriptions securely. (Note: We do not store your full credit card details on our servers).</li>
            </ul>

            <h2>4. Cookies and Tracking Technologies</h2>
            <p>
                Our website uses cookies and similar tracking technologies to enhance your browsing experience. These include:
            </p>
            <ul>
                <li><strong>Essential Cookies:</strong> Required for the website to function properly (e.g., maintaining your logged-in state).</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our trading tools.</li>
                <li><strong>Preference Cookies:</strong> Remember your settings, such as your dark/light mode preference or saved dashboard layouts.</li>
            </ul>
            <p>You can control cookies through your browser settings, though disabling certain essential cookies may limit platform functionality.</p>

            <h2>5. Data Retention</h2>
            <p>
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy:
            </p>
            <ul>
                <li>Account and subscription data is retained until you request removal or your membership ends.</li>
                <li>Communication preferences are retained until you actively unsubscribe.</li>
                <li>Anonymized analytics data is safely retained for product improvement cycles.</li>
            </ul>

            <h2>6. Your Rights</h2>
            <p>
                Depending on your geographic location, you may have the right to request access to, correction of, or deletion of your personal data. You may also have the right to restrict processing or request data portability. To exercise these rights, please contact our support team.
            </p>

            <h2>7. Data Security</h2>
            <p>
                We implement robust technical and organizational measures to protect your personal information, including SSL/TLS encryption, secure Cloudflare-protected servers, and strict access controls. While we strive for maximum security, no system is entirely impenetrable.
            </p>

            <h2>8. Contact Us</h2>
            <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <p>
                <strong>Email:</strong> support@thenexttrade.com<br />
            </p>
                </div>
            </div>
        </>
    );
}
