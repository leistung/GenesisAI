import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - GenesisAI",
  description: "How GenesisAI collects, uses, and protects your data",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().getFullYear()}</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="mb-2">We collect the following information when you use GenesisAI:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account information:</strong> Name, email address, and password (hashed).</li>
              <li><strong>OAuth data:</strong> If you sign in with Google, we receive your Google profile information.</li>
              <li><strong>Generated content:</strong> Prompts, settings, and images you create.</li>
              <li><strong>Usage data:</strong> IP address, browser type, and interaction logs for security and analytics.</li>
              <li><strong>Payment data:</strong> Processed by Creem (our payment provider). We do not store card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and maintain the AI image generation service.</li>
              <li>To manage your account, subscription, and credits.</li>
              <li>To process payments and prevent fraud.</li>
              <li>To send service notifications and security alerts.</li>
              <li>To improve our services and develop new features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Storage and Security</h2>
            <p className="mb-2">
              Your data is stored securely using industry-standard practices:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Passwords are hashed using bcrypt before storage.</li>
              <li>Sessions use encrypted JWT tokens.</li>
              <li>Database access is restricted and authenticated.</li>
              <li>API keys are stored in environment variables, not in the database.</li>
              <li>Generated images may be stored on cloud object storage (S3/R2).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Sharing</h2>
            <p className="mb-2">We share data with the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>DashScope (Alibaba Cloud):</strong> For AI image generation.</li>
              <li><strong>Creem:</strong> For payment processing (Merchant of Record).</li>
              <li><strong>Google:</strong> For OAuth authentication (if you choose Google login).</li>
              <li><strong>Cloud storage provider:</strong> For storing generated images.</li>
            </ul>
            <p className="mt-2">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data.</li>
              <li>Correct inaccurate data.</li>
              <li>Delete your account and associated data.</li>
              <li>Export your generated images.</li>
              <li>Opt out of marketing communications.</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at privacy@genesisai.com</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Generated images
              are retained until you delete them. Payment records are kept for 7 years for tax and
              legal compliance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do not use
              tracking cookies for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>
              For privacy questions or requests, contact: privacy@genesisai.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
