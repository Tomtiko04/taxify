import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing and using TaxBuddy ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this Service.

The Service is intended for users who are at least 18 years of age. By using this Service, you represent and warrant that you meet all eligibility requirements.`,
  },
  {
    title: "2. Description of Service",
    content: `TaxBuddy provides tax calculation tools for Nigerian taxes, including Personal Income Tax (PAYE) and Corporate Income Tax (CIT), based on the Nigeria Tax Act 2025 and other applicable tax laws.

The Service is provided for informational and educational purposes only. While we strive for accuracy, the calculations provided should not be considered as professional tax advice.`,
  },
  {
    title: "3. User Accounts",
    content: `To access certain features of the Service, you may be required to create an account. You agree to:

• Provide accurate, current, and complete information during registration
• Maintain and promptly update your account information
• Keep your password secure and confidential
• Accept responsibility for all activities under your account
• Notify us immediately of any unauthorized use of your account

We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.`,
  },
  {
    title: "4. Acceptable Use",
    content: `You agree not to use the Service to:

• Violate any applicable laws or regulations
• Infringe upon the rights of others
• Transmit harmful code, viruses, or malware
• Attempt to gain unauthorized access to our systems
• Use the Service for any fraudulent or deceptive purposes
• Scrape, copy, or redistribute our content without permission
• Interfere with the proper functioning of the Service`,
  },
  {
    title: "5. Intellectual Property",
    content: `All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, are the exclusive property of TaxBuddy and are protected by Nigerian and international copyright, trademark, and other intellectual property laws.

You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission.`,
  },
  {
    title: "6. Disclaimer of Warranties",
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:

• Warranties of merchantability
• Fitness for a particular purpose
• Non-infringement
• Accuracy or completeness of information

Tax calculations are estimates based on the information you provide. We do not guarantee the accuracy of any calculation, and you should always consult with a qualified tax professional for official tax advice.`,
  },
  {
    title: "7. Limitation of Liability",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, TAXBUDDY SHALL NOT BE LIABLE FOR:

• Any indirect, incidental, special, consequential, or punitive damages
• Loss of profits, data, or goodwill
• Any damages arising from your use or inability to use the Service
• Any errors or inaccuracies in tax calculations

Our total liability shall not exceed the amount you paid for the Service in the twelve (12) months preceding the claim.`,
  },
  {
    title: "8. Indemnification",
    content: `You agree to indemnify, defend, and hold harmless TaxBuddy, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:

• Your use of the Service
• Your violation of these Terms
• Your violation of any rights of a third party
• Any content you submit to the Service`,
  },
  {
    title: "9. Third-Party Services",
    content: `The Service may contain links to third-party websites or services that are not owned or controlled by TaxBuddy. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party services.

You acknowledge and agree that TaxBuddy shall not be responsible for any damage or loss caused by your use of any third-party services.`,
  },
  {
    title: "10. Modifications to Service",
    content: `We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.`,
  },
  {
    title: "11. Changes to Terms",
    content: `We may revise these Terms at any time by posting the updated version on our website. Your continued use of the Service after such changes constitutes acceptance of the new Terms. We encourage you to review these Terms periodically.`,
  },
  {
    title: "12. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.

Any disputes arising from these Terms or your use of the Service shall be resolved in the courts of Nigeria.`,
  },
  {
    title: "13. Contact Information",
    content: `If you have any questions about these Terms of Service, please contact us at:

Email: legal@taxbuddy.ng
Address: Lagos, Nigeria

Last updated: January 2026`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen pt-19 bg-slate-50">
      {/* Header */}
      <section className="py-[7em] text-white bg-gradient-to-br from-green-600 via-emerald-700 to-green-800">
        <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Link to="/" className="inline-flex items-center mb-6 space-x-2">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold">TaxBuddy</span>
            </Link>
            <h1 className="mb-4 text-4xl font-bold">Terms of Service</h1>
            <p className="text-slate-300">
              Please read these terms carefully before using our service
            </p>
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

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center font-medium text-green-600 hover:text-green-700"
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
