import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - GenesisAI",
  description: "Terms and conditions for using GenesisAI",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().getFullYear()}</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using GenesisAI (&quot;the Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              GenesisAI provides AI-powered image generation tools. The Service includes free and
              paid subscription tiers with varying credit allowances and features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate registration information.</li>
              <li>You are responsible for maintaining account security.</li>
              <li>You must be at least 13 years old to use the Service.</li>
              <li>One person or entity may not maintain multiple free accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p className="mb-2">You agree NOT to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Generate illegal, harmful, or explicit content involving minors.</li>
              <li>Generate content that infringes on intellectual property rights.</li>
              <li>Generate defamatory, harassing, or threatening content.</li>
              <li>Attempt to reverse engineer, hack, or disrupt the Service.</li>
              <li>Resell or redistribute generated images without appropriate licensing.</li>
              <li>Use automated scripts to abuse the free tier or bypass rate limits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Subscriptions and Payments</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Paid subscriptions are billed monthly or annually via Creem.</li>
              <li>Credits do not roll over to the next billing period.</li>
              <li>You may cancel your subscription at any time; access continues until the period ends.</li>
              <li>Refunds are handled on a case-by-case basis. Contact support for refund requests.</li>
              <li>Prices may change with 30 days notice. Existing subscriptions are not affected until renewal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p className="mb-2">
              You retain ownership of images you generate, subject to the following:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You are responsible for ensuring your prompts do not infringe third-party rights.</li>
              <li>Images published to the community gallery are licensed for display within GenesisAI.</li>
              <li>GenesisAI retains the right to use generated content for service improvement and quality assurance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Service Availability</h2>
            <p>
              The Service is provided &quot;as is&quot; without guarantees of availability. We may modify,
              suspend, or discontinue the Service at any time. We are not liable for any downtime,
              data loss, or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, GenesisAI shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Termination</h2>
            <p>
              We may terminate or suspend your account for violations of these Terms. You may delete
              your account at any time. Upon termination, your right to use the Service ceases.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p>
              For questions about these Terms, contact: legal@genesisai.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
