import { Link } from 'react-router-dom';

export function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">
            Last Updated: January 10, 2026
          </p>

          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                1. Agreement to Terms
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms of Service ("Terms") govern your access to and use of PlatelyAI's website, mobile application, and related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If you do not agree to these Terms, you may not access or use the Service. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
              </p>
            </section>

            {/* Eligibility */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                2. Eligibility
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must be at least 13 years old to use PlatelyAI. By using the Service, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>You are at least 13 years of age</li>
                <li>You have the legal capacity to enter into these Terms</li>
                <li>You will provide accurate and complete information when creating an account</li>
                <li>You will not use the Service for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            {/* Account Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                3. Account Registration and Security
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use certain features of PlatelyAI, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                You may not share your account credentials with others or use another person's account without permission. We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            {/* Acceptable Use */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                4. Acceptable Use
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to use PlatelyAI only for lawful purposes. You may NOT:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Upload images that are illegal, offensive, or infringe on others' rights</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated tools (bots, scrapers) without our permission</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Transmit viruses, malware, or harmful code</li>
                <li>Impersonate another person or entity</li>
                <li>Collect or harvest personal information about other users</li>
                <li>Use the Service for commercial purposes without authorization</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Violation of these rules may result in immediate termination of your account and legal action.
              </p>
            </section>

            {/* AI-Generated Content Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                5. AI-Generated Content and Accuracy
              </h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-gray-800 font-semibold mb-2">⚠️ Important Disclaimer</p>
                <p className="text-gray-700 leading-relaxed">
                  PlatelyAI uses artificial intelligence to analyze food images and generate recipe suggestions. While we strive for accuracy, AI-generated content may contain errors, inaccuracies, or incomplete information.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                You acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Ingredient identification may not always be 100% accurate</li>
                <li>Nutritional information is approximate and for informational purposes only</li>
                <li>Recipe suggestions are automatically generated and not reviewed by humans</li>
                <li>You are responsible for verifying the accuracy of any information before use</li>
                <li>You should always check ingredients for allergens and food safety</li>
                <li>AI recommendations should not replace your own judgment or common sense</li>
              </ul>
            </section>

            {/* Health and Nutrition Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                6. Health and Nutrition Disclaimer
              </h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <p className="text-gray-800 font-semibold mb-2">🏥 Medical Disclaimer</p>
                <p className="text-gray-700 leading-relaxed">
                  PlatelyAI is NOT a substitute for professional medical advice, diagnosis, or treatment. The Service does not provide medical or nutritional advice.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                You understand and agree that:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>PlatelyAI is a meal planning tool, not a medical or health service</li>
                <li>Nutritional information is estimated and may not be accurate for your specific needs</li>
                <li>You should consult a qualified healthcare provider before making dietary changes</li>
                <li>We are not responsible for adverse health effects resulting from using our Service</li>
                <li>You are solely responsible for determining whether a food or recipe is safe for you</li>
                <li>We cannot guarantee the identification of allergens or dietary restrictions</li>
                <li>Always check food labels and ingredients independently</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                If you have food allergies, medical conditions, or dietary restrictions, consult a healthcare professional before following any recipe or dietary suggestion from PlatelyAI.
              </p>
            </section>

            {/* User Content */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                7. User-Generated Content
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of images and content you upload to PlatelyAI. However, by uploading content, you grant us a worldwide, non-exclusive, royalty-free license to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Store and process your images to provide the Service</li>
                <li>Use your content to improve our AI models and algorithms</li>
                <li>Display your content back to you as part of the Service</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                You represent and warrant that:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>You own or have the right to upload the content</li>
                <li>Your content does not infringe on third-party rights</li>
                <li>Your content does not violate any laws or regulations</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to remove any content that violates these Terms or is otherwise objectionable.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                8. Intellectual Property Rights
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service and its original content (excluding user-generated content), features, and functionality are owned by PlatelyAI and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You may not copy, modify, distribute, sell, or lease any part of our Service without our explicit written permission.
              </p>
            </section>

            {/* Service Availability */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                9. Service Availability and Modifications
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                PlatelyAI is provided "as is" and "as available." We do not guarantee that:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>The Service will be uninterrupted, secure, or error-free</li>
                <li>Results obtained from the Service will be accurate or reliable</li>
                <li>Any errors or defects will be corrected</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time without notice. We will not be liable for any modification, suspension, or discontinuation of the Service.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                10. Limitation of Liability
              </h2>
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-4">
                <p className="text-gray-800 font-semibold mb-2">Legal Notice</p>
                <p className="text-gray-700 leading-relaxed text-sm">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, PLATELYAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                This includes but is not limited to damages resulting from:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Use or inability to use the Service</li>
                <li>Unauthorized access to your account or data</li>
                <li>Errors, inaccuracies, or omissions in AI-generated content</li>
                <li>Adverse health effects from following recipes or dietary suggestions</li>
                <li>Food allergies, food poisoning, or other health issues</li>
                <li>Third-party content or conduct on the Service</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                In no event shall our total liability exceed the amount you paid to us in the 12 months prior to the event giving rise to the liability, or $100 USD, whichever is greater.
              </p>
            </section>

            {/* Indemnification */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                11. Indemnification
              </h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify, defend, and hold harmless PlatelyAI and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                12. Termination
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Prolonged inactivity</li>
                <li>At our sole discretion</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Upon termination, your right to use the Service will immediately cease. You may delete your account at any time through your account settings.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                13. Governing Law and Dispute Resolution
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the United States and the state in which PlatelyAI operates, without regard to its conflict of law provisions.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the American Arbitration Association's rules, except that either party may seek injunctive relief in court to protect intellectual property rights.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                14. Changes to Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of the Service after changes take effect constitutes acceptance of the modified Terms.
              </p>
            </section>

            {/* Miscellaneous */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                15. Miscellaneous
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Waiver:</strong> Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and PlatelyAI regarding the Service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Assignment:</strong> You may not assign or transfer these Terms without our written consent. We may assign these Terms without restriction.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                16. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:timmyl2410@gmail.com" className="text-[#2ECC71] hover:underline">timmyl2410@gmail.com</a></p>
                <p className="text-gray-700 mt-2"><strong>PlatelyAI</strong><br />United States</p>
              </div>
            </section>

            {/* Acceptance */}
            <section className="mb-8">
              <div className="bg-[#2ECC71] bg-opacity-10 border-l-4 border-[#2ECC71] p-4">
                <p className="text-gray-800 font-semibold mb-2">By using PlatelyAI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
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
