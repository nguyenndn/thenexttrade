import { Metadata } from 'next';
import { Scale } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Terms of Service | GSN CRM',
    description: 'Terms of Service and Risk Disclaimer for GSN CRM.',
};

export default function TermsOfServicePage() {
    return (
        <>
            <div className="flex flex-col items-center justify-center mb-8">
                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl mb-4">
                    <Scale size={40} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-center m-0 mb-2">Terms of Service</h1>
                <p className="text-gray-500 dark:text-gray-400 text-center m-0">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 my-8 rounded-r-xl">
                <h3 className="text-red-700 dark:text-red-400 mt-0 font-bold uppercase tracking-wide">High Risk Warning</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mb-0">
                    Trading CFDs, Gold (XAU/USD), and other financial products offers high potential returns but also involves significant risks. High leverage can work against you as well as for you. You must be aware of the risks of investing in Forex and be willing to accept them. Forex trading involves substantial risk of loss and is not suitable for all investors. Please do not trade with borrowed money or money you cannot afford to lose.
                </p>
            </div>

            <h2>1. IMPORTANT DISCLAIMER</h2>
            <p>
                The content shared here, including trading setup, analysis, and discussions, is intended solely for educational and informational purposes.
            </p>
            <ul>
                <li>We are not financial advisors, and the information provided should not be treated as financial or investment advice.</li>
                <li>We do not target or promote to any specific country. Viewers must verify that any broker they use is licensed in their country of residence. We are not responsible for any losses.</li>
            </ul>

            <h2>2. No Guarantees of Profits</h2>
            <p>
                We aim to share insights and knowledge to help you make informed trading decisions. However, trading carries significant risks, and there are no guarantees of profits. Therefore, please note the following:
            </p>
            <ul>
                <li><strong>We do not take any responsibility</strong> for the outcomes of your trades or investment decisions based on the content shared here. Past performance is not an indicator of future results. Always conduct your own research and due diligence before making any financial decisions.</li>
                <li><strong>Risk Management:</strong> We strongly recommend practicing proper risk management techniques, such as setting stop-loss orders and managing your position sizes.</li>
            </ul>

            <h2>3. Personal Opinions & Analysis</h2>
            <p>
                The content shared is based on personal opinions, experiences, and analysis. It may not be suitable for everyone, and you should carefully consider your own financial situation and risk tolerance before acting on any information provided.
            </p>

            <h2>4. User Responsibility</h2>
            <p>
                By being a part of this community and accessing the content shared in this channel or website, you agree that you are solely responsible for your trading decisions and any resulting outcomes.
            </p>

            <h2>5. Use of Site</h2>
            <p>
                By using this Site, you acknowledge and accept these terms and conditions. If you do not agree with any part of this disclaimer, we kindly ask you to discontinue use of our services.
            </p>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm text-gray-500 dark:text-gray-400 italic text-center">
                Thank you for being a part of our community 🤝 Let's continue learning and trading responsibly together! 💪
            </div>
        </>
    );
}
