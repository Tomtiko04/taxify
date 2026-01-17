import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const sections = [
  {
    title: "1. Introduction",
    content: `Taxify ("we," "our," or "us") is committed to protecting your privacy and personal data in compliance with the Nigeria Data Protection Regulation (NDPR) 2019 and other applicable data protection laws.

This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our tax calculation services. By using our Service, you consent to the practices described in this policy.`,
  },
  {
    title: "2. Information We Collect",
    content: `We collect the following types of information:

Personal Information:
• Name and contact details (email address)
• Financial information (salary, income, business turnover)
• Business information (company name, business type)
• Account credentials (password - stored securely)

Automatically Collected Information:
• Device and browser information
• IP address and location data
• Usage patterns and preferences
• Cookies and similar technologies

We only collect information that is necessary to provide our services effectively.`,
  },
  {
    title: "3. How We Use Your Information",
    content: `We use your personal information to:

• Provide tax calculation services
• Create and manage your account
• Save and display your calculation history
• Improve and personalize our services
• Send important service updates and notifications
• Respond to your inquiries and support requests
• Comply with legal obligations
• Prevent fraud and ensure security

We do not use your data for purposes beyond those stated in this policy without your explicit consent.`,
  },
  {
    title: "4. Legal Basis for Processing",
    content: `Under the NDPR, we process your personal data based on:

• Consent: You have given clear consent for us to process your personal data
• Contract: Processing is necessary to fulfill our service agreement with you
• Legal Obligation: Processing is required to comply with Nigerian law
• Legitimate Interest: Processing is necessary for our legitimate business interests, provided they do not override your rights`,
  },
  {
    title: "5. Data Security",
    content: `We implement appropriate technical and organizational measures to protect your personal data, including:

• Encryption of data in transit and at rest
• Secure authentication mechanisms
• Regular security assessments and updates
• Access controls and authentication requirements
• Employee training on data protection
• Incident response procedures

Despite our efforts, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security but will notify you of any breach as required by law.`,
  },
  {
    title: "6. Data Retention",
    content: `We retain your personal data only for as long as necessary to:

• Provide our services to you
• Comply with legal obligations
• Resolve disputes and enforce our agreements

When your data is no longer needed, we will securely delete or anonymize it. You may request deletion of your data at any time, subject to legal retention requirements.`,
  },
  {
    title: "7. Your Rights Under NDPR",
    content: `As a data subject, you have the following rights:

• Right to Access: Request a copy of your personal data
• Right to Rectification: Correct inaccurate or incomplete data
• Right to Erasure: Request deletion of your personal data
• Right to Restriction: Limit how we process your data
• Right to Data Portability: Receive your data in a portable format
• Right to Object: Object to processing based on legitimate interests
• Right to Withdraw Consent: Withdraw consent at any time

To exercise these rights, contact us at privacy@taxify.ng. We will respond within 30 days.`,
  },
  {
    title: "8. Cookies and Tracking",
    content: `We use cookies and similar technologies to:

• Remember your preferences and settings
• Analyze how you use our Service
• Improve user experience
• Provide security features

Types of cookies we use:
• Essential cookies: Required for basic functionality
• Analytics cookies: Help us understand usage patterns
• Preference cookies: Remember your settings

You can manage cookie preferences through your browser settings. Disabling certain cookies may affect Service functionality.`,
  },
  {
    title: "9. Third-Party Services",
    content: `We may share your data with trusted third parties:

• Supabase: For secure data storage and authentication
• Google: For optional OAuth authentication
• Analytics providers: For service improvement

These providers are contractually bound to protect your data and use it only for specified purposes. We do not sell your personal data to third parties.`,
  },
  {
    title: "10. International Data Transfers",
    content: `Your data may be processed in countries outside Nigeria. When we transfer data internationally, we ensure:

• Adequate data protection measures are in place
• Transfers comply with NDPR requirements
• Appropriate safeguards protect your information

By using our Service, you consent to such transfers with appropriate protections.`,
  },
  {
    title: "11. Children's Privacy",
    content: `Our Service is not intended for individuals under 18 years of age. We do not knowingly collect personal data from children. If you believe we have collected information from a child, please contact us immediately, and we will delete such information.`,
  },
  {
    title: "12. Changes to This Policy",
    content: `We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of significant changes through:

• Email notification
• Prominent notice on our website
• In-app notification

Continued use of the Service after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "13. Contact Us",
    content: `For questions, concerns, or to exercise your data rights, contact our Data Protection Officer:

Email: privacy@taxify.ng
Address: Lagos, Nigeria

You may also lodge a complaint with the National Information Technology Development Agency (NITDA) if you believe your data protection rights have been violated.

Last updated: January 2026`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 pt-19">
      {/* Header */}
      <section className="py-[7em] text-white bg-gradient-to-br from-green-600 via-emerald-700 to-green-800">
        <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Link to="/" className="inline-flex items-center mb-6 space-x-2">
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl">
                <span className="text-xl font-bold text-white">₦</span>
              </div>
              <span className="text-xl font-bold">Taxify</span>
            </Link>
            <h1 className="mb-4 text-4xl font-bold">Privacy Policy</h1>
            <p className="text-green-100">
              How we collect, use, and protect your personal information
            </p>
            <div className="inline-flex items-center px-4 py-2 mt-4 text-sm rounded-full bg-white/10 backdrop-blur-sm">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              NDPR Compliant
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200"
          >
            <div className="p-8 space-y-8">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <h2 className="mb-4 text-xl font-bold text-slate-900">
                    {section.title}
                  </h2>
                  <div className="leading-relaxed whitespace-pre-line text-slate-600">
                    {section.content}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Related Links */}
          <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row">
            <Link
              to="/terms"
              className="inline-flex items-center justify-center px-6 py-3 transition-all bg-white border border-slate-200 rounded-xl text-slate-700 hover:border-green-500 hover:bg-green-50"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Terms of Service
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 text-white transition-all bg-green-600 rounded-xl hover:bg-green-700"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
