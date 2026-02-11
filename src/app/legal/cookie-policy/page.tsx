import { Metadata } from 'next';
import { Cookie } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Cookie Policy | GSN CRM',
    description: 'Information about how GSN CRM uses cookies.',
};

export default function CookiePolicyPage() {
    return (
        <>
            <div className="flex flex-col items-center justify-center mb-8">
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl mb-4">
                    <Cookie size={40} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-center m-0 mb-2">Cookie Policy</h1>
                <p className="text-gray-500 dark:text-gray-400 text-center m-0">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            </div>

            <h2>1. What Are Cookies</h2>
            <p>
                Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>
                When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes: to enable certain functions of the Service, to provide analytics, to store your preferences, to enable advertisements delivery, including behavioral advertising.
            </p>
            <ul>
                <li><strong>Essential cookies:</strong> We may use essential cookies to authenticate users and prevent fraudulent use of user accounts.</li>
                <li><strong>Analytics cookies:</strong> We may use analytics cookies to track information how the Service is used so that we can make improvements. We may also use analytics cookies to test new advertisements, pages, features or new functionality of the Service to see how our users react to them.</li>
            </ul>

            <h2>3. Third-party Cookies</h2>
            <p>
                In addition to our own cookies, we may also use various third-parties cookies to report usage statistics of the Service, deliver advertisements on and through the Service, and so on.
            </p>

            <h2>4. Your Choices Regarding Cookies</h2>
            <p>
                If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.
            </p>
        </>
    );
}
