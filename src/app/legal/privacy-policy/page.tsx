import { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Privacy Policy | GSN CRM',
    description: 'Privacy Policy and Data Protection information for GSN CRM.',
};

export default function PrivacyPolicyPage() {
    return (
        <>
            <div className="flex flex-col items-center justify-center mb-8">
                <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl mb-4">
                    <Shield size={40} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-center m-0 mb-2">Privacy Policy</h1>
                <p className="text-gray-500 dark:text-gray-400 text-center m-0">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            </div>

            <h2>1. Introduction</h2>
            <p>
                Welcome to GSN CRM ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
            </p>

            <h2>2. Information We Collect</h2>
            <p>
                We collect personal information that you voluntarily provide to us when registering at the Services expressing an interest in obtaining information about us or our products and services, when participating in activities on the Services or otherwise contacting us.
            </p>
            <ul>
                <li><strong>Personal Information Provided by You:</strong> We collect names; email addresses; passwords; and other similar information.</li>
                <li><strong>Payment Data:</strong> We may collect data necessary to process your payment if you make purchases, such as your payment instrument number, and the security code associated with your payment instrument.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>
                We use personal information collected via our Services for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
            </p>
            <ul>
                <li>To facilitate account creation and logon process.</li>
                <li>To send administrative information to you.</li>
                <li>To fulfill and manage your orders.</li>
                <li>To enforce our terms, conditions and policies.</li>
            </ul>

            <h2>4. Sharing Your Information</h2>
            <p>
                We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
            </p>

            <h2>5. Security of Your Information</h2>
            <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h2>6. Contact Us</h2>
            <p>
                If you have questions or comments about this policy, you may email us at support@gsncrm.com.
            </p>
        </>
    );
}
