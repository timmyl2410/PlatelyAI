import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/PlatelyAI Logo.png" alt="PlatelyAI" className="h-8" />
            <span className="text-xl" style={{ fontWeight: 600, color: '#2C2C2C' }}>
              PlatelyAI
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-md p-8 md:p-12">
          <h1 className="text-4xl mb-4" style={{ fontWeight: 700, color: '#2C2C2C' }}>
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">
            Last Updated: January 10, 2026
          </p>

          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                PlatelyAI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application and services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By using PlatelyAI, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Information We Collect
              </h2>
              
              <h3 className="text-xl mb-3 mt-6" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Personal Information
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Name:</strong> To personalize your experience</li>
                <li><strong>Email address:</strong> For account authentication and communication</li>
                <li><strong>Password:</strong> Securely hashed and stored via Firebase Authentication</li>
                <li><strong>OAuth provider data:</strong> When using Google sign-in, we receive your basic profile information (name, email, profile picture) from the provider</li>
              </ul>

              <h3 className="text-xl mb-3 mt-6" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Images and Food Data
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you use our service, we collect:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Food images:</strong> Photos you upload of your ingredients or meals</li>
                <li><strong>Ingredient data:</strong> Information extracted from your images via AI analysis</li>
                <li><strong>Generated recipes:</strong> Meal suggestions created based on your ingredients</li>
                <li><strong>User preferences:</strong> Dietary goals, restrictions, and meal history</li>
              </ul>

              <h3 className="text-xl mb-3 mt-6" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Usage Data
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We automatically collect certain information when you use PlatelyAI:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Browser type and version</li>
                <li>Device information (type, operating system)</li>
                <li>IP address and location data</li>
                <li>Pages visited and features used</li>
                <li>Time and date of visits</li>
                <li>Error logs and diagnostic data</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                How We Use Your Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Provide and maintain our service</li>
                <li>Authenticate your identity and secure your account</li>
                <li>Process your uploaded images and generate personalized meal recommendations</li>
                <li>Improve our AI models and recipe suggestions</li>
                <li>Respond to your requests, questions, and feedback</li>
                <li>Send important service updates and security alerts</li>
                <li>Monitor usage patterns to improve user experience</li>
                <li>Detect and prevent fraud, abuse, or technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We do NOT sell your personal information to third parties.
              </p>
            </section>

            {/* Data Storage and Security */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Data Storage and Security
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your data is stored securely using industry-standard practices:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Authentication:</strong> Managed by Firebase Authentication with encrypted passwords</li>
                <li><strong>Database:</strong> Stored in Google Cloud Firestore with access controls</li>
                <li><strong>Images:</strong> Stored in Firebase Cloud Storage with secure URLs</li>
                <li><strong>Encryption:</strong> Data transmitted over HTTPS/TLS encryption</li>
                <li><strong>Access control:</strong> Limited to authorized personnel only</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                While we implement reasonable security measures, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            {/* Third-Party Services */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Third-Party Services
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                PlatelyAI uses the following third-party services that may collect information:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Google Firebase:</strong> For authentication, database, and file storage (<a href="https://firebase.google.com/support/privacy" className="text-[#2ECC71] hover:underline" target="_blank" rel="noopener noreferrer">Firebase Privacy Policy</a>)</li>
                <li><strong>Google OAuth:</strong> For Google sign-in functionality (<a href="https://policies.google.com/privacy" className="text-[#2ECC71] hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>)</li>
                <li><strong>OpenAI:</strong> For AI-powered image analysis and recipe generation (<a href="https://openai.com/policies/privacy-policy" className="text-[#2ECC71] hover:underline" target="_blank" rel="noopener noreferrer">OpenAI Privacy Policy</a>)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                These third-party services have their own privacy policies. We encourage you to review them.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Data Retention
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your personal information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
                <li>Improve our service</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                You may request deletion of your account and associated data at any time. Upon deletion, your personal information will be removed within 30 days, except where retention is required by law.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Your Rights
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Request a machine-readable copy of your data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Withdraw consent:</strong> Where we rely on your consent, you may withdraw it at any time</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                To exercise these rights, contact us at <a href="mailto:timmyl2410@gmail.com" className="text-[#2ECC71] hover:underline">timmyl2410@gmail.com</a>.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Maintain your session and keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns and improve our service</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                You can control cookies through your browser settings. Disabling cookies may limit some functionality of PlatelyAI.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Children's Privacy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                PlatelyAI is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact Us */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:timmyl2410@gmail.com" className="text-[#2ECC71] hover:underline">timmyl2410@gmail.com</a></p>
                <p className="text-gray-700 mt-2"><strong>PlatelyAI</strong><br />United States</p>
              </div>
            </section>
          </div>

          {/* Back to Home */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[#2ECC71] hover:text-[#1E8449] transition-colors"
              style={{ fontWeight: 500 }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
