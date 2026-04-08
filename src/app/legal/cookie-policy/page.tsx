import { Metadata } from 'next';
import { Cookie } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Cookie Policy | TheNextTrade',
    description: 'Information about how TheNextTradeuses cookies.',
};

export default function CookiePolicyPage() {
    return (
        <>
            <div className="max-w-3xl mx-auto text-center space-y-6 mb-20 mt-12">
                <div className="inline-flex items-center justify-center p-3 rounded-xl bg-orange-500/10 text-orange-500 mb-2 ring-4 ring-orange-500/5 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
                    <Cookie size={40} strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-700 dark:text-white leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700">Cookie Policy</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-8 md:p-14 shadow-xl prose dark:prose-invert prose-headings:text-gray-700 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-500 prose-li:text-gray-600 dark:prose-li:text-gray-500 prose-strong:text-gray-700 dark:prose-strong:text-white max-w-none transition-colors duration-300">


            <h2>1. What Are Cookies?</h2>
            <p>
                Cookies are small data files placed on your computer or mobile device when you visit a website. They are widely used by online service providers to facilitate and help to make the interaction between users and websites faster and easier, as well as to provide reporting information.
            </p>
            <p>
                Cookies set by the website owner (in this case, TheNextTrade) are called "first-party cookies." Cookies set by parties other than the website owner are called "third-party cookies." We use both to provide you with a seamless and secure trading journal experience.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>
                When you access and use TheNextTrade platform, we may place persistent and session cookie files in your web browser. We use cookies for the following purposes:
            </p>
            <ul>
                <li><strong>Essential / Strictly Necessary Cookies:</strong> These cookies are critical to the operation of our platform. They enable secure login, session management, and access to premium features (like your Trading Journal and Dashboards). Without these, our services cannot function properly.</li>
                <li><strong>Performance and Analytics Cookies:</strong> We use these to understand how users interact with our site—for instance, which Academy pages are visited most often or how much time is spent analyzing trades. This helps us optimize performance and improve the user experience.</li>
                <li><strong>Preference Cookies:</strong> These cookies allow us to remember your choices, such as your preferred theme (Dark or Light mode), layout settings, and language preferences, saving you the trouble of continually re-entering this information.</li>
                <li><strong>Security Cookies:</strong> Used to authenticate users, prevent fraudulent use of login credentials, and protect user data from unauthorized parties.</li>
            </ul>

            <h2>3. Third-Party Cookies and Tracking</h2>
            <p>
                In addition to our own cookies, we may also utilize various third-party cookies from trusted partners to report usage statistics and improve site security. Specifically:
            </p>
            <ul>
                <li><strong>Cloudflare:</strong> We use Cloudflare for DDoS protection and web performance. Cloudflare places a necessary cookie to identify trusted web traffic and ensure security.</li>
                <li><strong>Supabase:</strong> Our backend provider, Supabase, utilizes secure cookies to manage authentication sessions and ensure your trading data remains private and securely linked to your account.</li>
                <li><strong>Analytics Providers:</strong> We may use tools to collect anonymized telemetry data that helps us understand traffic and app performance.</li>
            </ul>

            <h2>4. Your Choices Regarding Cookies</h2>
            <p>
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in your web browser controls.
            </p>
            <ul>
                <li>If you choose to reject cookies, you may still use our website to view public content, but <strong>your access to your account, dashboards, and personalized trading features will be severely degraded or completely non-functional</strong> (as login sessions require cookies).</li>
                <li>To learn how to manage cookies, please visit the help menus of your specific browser (Chrome, Firefox, Safari, Edge, etc.).</li>
            </ul>

            <h2>5. Updates to This Policy</h2>
            <p>
                We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this page regularly to stay informed about our use of cookies and related technologies.
            </p>

            <h2>6. Contact Us</h2>
            <p>
                If you have any questions about our use of cookies or other technologies, please email us at:
            </p>
            <p>
                <strong>Email:</strong> support@thenexttrade.com
            </p>
                </div>
            </div>
        </>
    );
}
