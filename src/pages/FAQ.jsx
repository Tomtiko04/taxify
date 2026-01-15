import { useState } from 'react'

const faqs = [
  {
    id: 1,
    question: "Is VAT charged on food and medicines?",
    answer: "No! VAT is 0% on essential food items and medicines. This is a common misconception. Basic food items like rice, beans, yam, and essential medicines are exempt from VAT.",
    category: "VAT",
    myth: "VAT is charged on everything including food and medicines",
    truth: "VAT is 0% on essential food items and medicines"
  },
  {
    id: 2,
    question: "Does FIRS monitor my bank account?",
    answer: "FIRS does not have automatic access to monitor individual bank accounts without proper authorization. They can only access bank information through legal processes like court orders or when investigating tax evasion cases. Your privacy is protected by banking regulations.",
    category: "Bank Monitoring",
    myth: "FIRS automatically monitors all bank accounts",
    truth: "FIRS requires legal authorization to access bank information"
  },
  {
    id: 3,
    question: "Do I need to pay tax if I earn less than ₦800,000 annually?",
    answer: "No! The tax-free threshold is ₦800,000 annually. If your annual income is ₦800,000 or less, you pay 0% tax. This is part of the new Tax Act 2025 to protect low-income earners.",
    category: "Personal Tax",
    myth: "Everyone must pay tax regardless of income",
    truth: "Annual income ≤ ₦800,000 is tax-free"
  },
  {
    id: 4,
    question: "Can I claim rent relief on my tax?",
    answer: "Yes! The new Tax Act 2025 allows for rent relief. You can claim 20% of your annual rent as a deduction, capped at ₦500,000. This helps reduce your taxable income.",
    category: "Deductions",
    myth: "Rent payments cannot be deducted from tax",
    truth: "20% of annual rent (max ₦500,000) is deductible"
  },
  {
    id: 5,
    question: "Are small businesses exempt from all taxes?",
    answer: "Small businesses with annual turnover less than ₦50 million are exempt from Corporate Income Tax (CIT) and Development Levy. However, they may still be subject to other taxes like VAT (if applicable) and PAYE for employees.",
    category: "Business Tax",
    myth: "All businesses must pay corporate tax",
    truth: "Small businesses (<₦50M turnover) are exempt from CIT"
  },
  {
    id: 6,
    question: "Is pension contribution mandatory?",
    answer: "Pension contribution (8% of gross salary) is mandatory for employees in organizations with 3 or more employees. This is deducted before tax calculation, reducing your taxable income.",
    category: "Deductions",
    myth: "Pension is optional",
    truth: "Pension (8%) is mandatory for most employees"
  },
  {
    id: 7,
    question: "How is Corporate Income Tax calculated?",
    answer: "CIT is calculated on profit, not turnover. For large businesses (turnover ≥ ₦50M), the rate is 30% of profit. Additionally, there's a 4% Development Levy on turnover. Small businesses are exempt from both.",
    category: "Business Tax",
    myth: "CIT is calculated on turnover",
    truth: "CIT is calculated on profit, not turnover"
  },
  {
    id: 8,
    question: "What is the maximum tax rate for individuals?",
    answer: "The maximum personal income tax rate is 25% for annual income above ₦50 million. The tax system is progressive, meaning higher earners pay a higher percentage, but it's capped at 25%.",
    category: "Personal Tax",
    myth: "Tax rates can go as high as 50%",
    truth: "Maximum personal tax rate is 25%"
  }
]

export default function FAQ() {
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('All')

  const categories = ['All', ...new Set(faqs.map(faq => faq.category))]

  const filteredFaqs = filter === 'All' 
    ? faqs 
    : faqs.filter(faq => faq.category === filter)

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-primary-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-slate-600">
            Clearing up common myths and misconceptions about Nigerian taxes
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === category
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-green-50 border border-slate-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFaqs.map(faq => (
            <div
              key={faq.id}
              className="card cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                    <span className="mr-2">{faq.question}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      faq.category === 'VAT' ? 'bg-purple-100 text-purple-700' :
                      faq.category === 'Bank Monitoring' ? 'bg-red-100 text-red-700' :
                      faq.category === 'Personal Tax' ? 'bg-blue-100 text-blue-700' :
                      faq.category === 'Business Tax' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {faq.category}
                    </span>
                  </h3>
                  
                  {openId === faq.id && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-green-500">
                        <p className="text-slate-700">{faq.answer}</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Myth
                          </h4>
                          <p className="text-sm text-red-800">{faq.myth}</p>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Truth
                          </h4>
                          <p className="text-sm text-green-800">{faq.truth}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <button className="ml-4 text-slate-400 hover:text-green-600 transition-colors">
                  <svg
                    className={`w-6 h-6 transition-transform ${openId === faq.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 card bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="mb-6 text-primary-100">
              For official tax information, please consult the Federal Inland Revenue Service (FIRS) or a qualified tax advisor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://www.firs.gov.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary bg-white text-green-600 hover:bg-green-50"
              >
                Visit FIRS Website
              </a>
              <a
                href="https://www.firs.gov.ng/Contact-Us"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary bg-transparent border-white text-white hover:bg-white/10"
              >
                Contact FIRS
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
