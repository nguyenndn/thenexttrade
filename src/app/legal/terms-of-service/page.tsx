import { Metadata } from 'next';
import { Scale } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Terms of Service | TheNextTrade',
    description: 'Terms of Service and Risk Disclaimer for TheNextTrade.',
};

export default function TermsOfServicePage() {
    return (
        <>
            <div className="max-w-3xl mx-auto text-center space-y-6 mb-20 mt-12">
                <div className="inline-flex items-center justify-center p-3 rounded-xl bg-indigo-500/10 text-indigo-500 mb-2 ring-4 ring-indigo-500/5 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
                    <Scale size={40} strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-700 dark:text-white leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700">Terms of Service</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-8 md:p-14 shadow-xl prose dark:prose-invert prose-headings:text-gray-700 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-500 prose-li:text-gray-600 dark:prose-li:text-gray-500 prose-strong:text-gray-700 dark:prose-strong:text-white max-w-none transition-colors duration-300">


            <div className="bg-red-50 dark:bg-red-500/5 border border-red-500/20 p-6 sm:p-8 my-8 rounded-xl shadow-sm">
                <h3 className="text-red-700 dark:text-red-400 mt-0 font-bold uppercase tracking-wider text-sm flex items-center gap-2">High Risk Warning</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-0 leading-relaxed">
                    Trading CFDs, Gold (XAU/USD), Forex, and other financial products offers high potential returns but also involves significant risks. High leverage can work against you as well as for you. You must be aware of the risks of investing in financial markets and be willing to accept them. Trading involves substantial risk of loss and is not suitable for all investors. Please do not trade with borrowed money or money you cannot afford to lose.
                </p>
            </div>

            <h2>1. Acceptance of Terms</h2>
            <p>
                By accessing or using the TheNextTrade website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these Terms, you must not use our platform or services. Your continued use of the website following the posting of any changes constitutes acceptance of those changes.
            </p>

            <h2>2. Description of Services</h2>
            <p>
                TheNextTrade provides software tools, educational content, and services related to financial trading, including but not limited to:
            </p>
            <ul>
                <li><strong>Trading Journaling:</strong> Tools to log, analyze, and review your trading history.</li>
                <li><strong>Analytical Tools:</strong> Dashboards, KPIs, and reports to evaluate trading strategies.</li>
                <li><strong>Educational Content:</strong> Market insights, Academy courses, and trading methodologies.</li>
                <li><strong>Community Access:</strong> Membership to our trading community for discussions and networking.</li>
            </ul>

            <h2>3. Trading Disclaimer</h2>
            <h3>Past Performance ? Future Results</h3>
            <p>
                Past performance of any trading system, methodology, or strategy is not indicative of future results. Historical data should not be relied upon as a predictor of future performance.
            </p>

            <h3>Not Financial Advice</h3>
            <p>
                Our services, including the Academy, tools, and market analysis, are not financial, investment, or trading advice. We are not licensed financial advisors. The content shared is intended solely for educational and informational purposes. Always consult with a qualified financial professional before making investment decisions.
            </p>

            <h3>Your Responsibility</h3>
            <p>
                You are solely responsible for your own trading decisions and their outcomes. TheNextTrade does not manage accounts or execute trades on your behalf. All trading decisions are made at your own discretion and risk.
            </p>

            <h2>4. User Eligibility and Registration</h2>
            <p>To use our services, you must:</p>
            <ul>
                <li>Be at least 18 years of age or the age of majority in your jurisdiction.</li>
                <li>Ensure that using our software and trading is legal in your country of residence.</li>
                <li>Provide accurate, current, and complete information during registration.</li>
                <li>Maintain the confidentiality of your account credentials and immediately notify us of any unauthorized use.</li>
            </ul>

            <h2>5. User Conduct</h2>
            <p>When using our platform, you agree NOT to:</p>
            <ul>
                <li>Redistribute, resell, or publicly share our premium tools or educational content without authorization.</li>
                <li>Use our platform for any illegal activities or to facilitate fraudulent trading schemes.</li>
                <li>Copy, reproduce, or modify our code, UI designs, or proprietary algorithms.</li>
                <li>Post spam, malicious content, or abuse other community members.</li>
            </ul>
            <p>Violation of these conduct rules may result in immediate termination of your account without a refund.</p>

            <h2>6. Intellectual Property</h2>
            <p>
                All content, features, and functionality on TheNextTrade (including text, graphics, logos, software, code, and UI design) are owned by TheNextTrade and are protected by copyright, trademark, and other intellectual property laws. You are granted a limited, personal, non-transferable license to use the platform for its intended purpose.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TheNextTrade shall NOT be liable for any trading losses, lost profits, financial damages, or data loss resulting from your use of our software or services. We are not responsible for any indirect, incidental, special, or consequential damages.
            </p>

            <h2>8. Third-Party Links and Brokers</h2>
            <p>
                Our platform may contain links or connections to third-party brokers, exchanges, or services (e.g., MT4/MT5 integrations). We are not affiliated with these entities unless explicitly stated, and your use of any third-party service is at your own risk and subject to their respective terms.
            </p>

            <h2>9. Contact Information</h2>
            <p>
                If you have any questions or concerns about these Terms of Service, please contact our support team at:
            </p>
            <p>
                <strong>Email:</strong> support@thenexttrade.com
            </p>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-[#151925] rounded-xl text-sm text-gray-600 dark:text-gray-300 italic text-center border border-gray-200 dark:border-white/5">
                Thank you for choosing TheNextTrade. Trade smart, manage your risk, and master the markets. ??
            </div>
                </div>
            </div>
        </>
    );
}
