import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

// Icon components
const ShoppingCartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const CurrencyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const BuildingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const faqs = [
  {
    id: 1,
    question: "Is VAT charged on food and medicines?",
    answer: "No! VAT is 0% on essential food items and medicines. This is a common misconception. Basic food items like rice, beans, yam, and essential medicines are exempt from VAT.",
    category: "VAT",
    myth: "VAT is charged on everything including food and medicines",
    truth: "VAT is 0% on essential food items and medicines",
    icon: ShoppingCartIcon
  },
  {
    id: 2,
    question: "Does FIRS monitor my bank account?",
    answer: "FIRS does not have automatic access to monitor individual bank accounts without proper authorization. They can only access bank information through legal processes like court orders or when investigating tax evasion cases. Your privacy is protected by banking regulations.",
    category: "Privacy",
    myth: "FIRS automatically monitors all bank accounts",
    truth: "FIRS requires legal authorization to access bank information",
    icon: LockIcon
  },
  {
    id: 3,
    question: "Do I need to pay tax if I earn less than ₦800,000 annually?",
    answer: "No! The tax-free threshold is ₦800,000 annually. If your annual income is ₦800,000 or less, you pay 0% tax. This is part of the new Tax Act 2025 to protect low-income earners.",
    category: "Personal Tax",
    myth: "Everyone must pay tax regardless of income",
    truth: "Annual income ≤ ₦800,000 is tax-free",
    icon: CurrencyIcon
  },
  {
    id: 4,
    question: "Can I claim rent relief on my tax?",
    answer: "Yes! The new Tax Act 2025 allows for rent relief. You can claim 20% of your annual rent as a deduction, capped at ₦500,000. This helps reduce your taxable income.",
    category: "Deductions",
    myth: "Rent payments cannot be deducted from tax",
    truth: "20% of annual rent (max ₦500,000) is deductible",
    icon: HomeIcon
  },
  {
    id: 5,
    question: "Are small businesses exempt from all taxes?",
    answer: "Small businesses with annual turnover ≤ ₦100 million AND fixed assets ≤ ₦250 million are exempt from Corporate Income Tax (CIT) and Development Levy. They are also exempt from collecting/remitting VAT, though they can choose to register if they wish.",
    category: "Business Tax",
    myth: "All businesses must pay corporate tax and VAT",
    truth: "Small businesses meeting thresholds are exempt from CIT, Dev Levy, and VAT",
    icon: BuildingIcon
  },
  {
    id: 6,
    question: "Is pension contribution mandatory?",
    answer: "Pension contribution (8% of gross salary) is mandatory for employees in organizations with 3 or more employees. This is deducted before tax calculation, reducing your taxable income.",
    category: "Deductions",
    myth: "Pension is optional",
    truth: "Pension (8%) is mandatory for most employees",
    icon: UsersIcon
  },
  {
    id: 7,
    question: "How is Corporate Income Tax calculated?",
    answer: "CIT is calculated on Assessable Profit, not turnover. For large businesses (Turnover > ₦100M or Assets > ₦250M), the rate is 30% of Assessable Profit. Additionally, there's a 4% Development Levy, also on Assessable Profit. Small businesses are exempt from both.",
    category: "Business Tax",
    myth: "CIT and Dev Levy are calculated on turnover",
    truth: "CIT and Dev Levy are calculated on Assessable Profit",
    icon: ChartIcon
  },
  {
    id: 8,
    question: "What is the maximum tax rate for individuals?",
    answer: "The maximum personal income tax rate is 25% for annual income above ₦50 million. The tax system is progressive, meaning higher earners pay a higher percentage, but it's capped at 25%.",
    category: "Personal Tax",
    myth: "Tax rates can go as high as 50%",
    truth: "Maximum personal tax rate is 25%",
    icon: TrendingUpIcon
  }
]

const categoryColors = {
  'VAT': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  'Privacy': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'Personal Tax': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'Business Tax': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'Deductions': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

export default function FAQ() {
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['All', ...new Set(faqs.map(faq => faq.category))]

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = filter === 'All' || faq.category === filter
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 text-white py-24 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium backdrop-blur-sm mb-6"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Got Questions?
            </motion.span>
            
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Frequently Asked
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                Questions
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              Clearing up common myths and misconceptions about Nigerian taxes. 
              Get the facts you need to understand your obligations.
            </motion.p>

            {/* Search Bar */}
            <motion.div variants={fadeInUp} className="max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                />
                <svg 
                  className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Category Filter */}
          <motion.div 
            className="flex flex-wrap gap-3 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                  filter === category
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-green-300'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Results count */}
          <motion.p 
            className="text-center text-slate-500 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Showing {filteredFaqs.length} of {faqs.length} questions
          </motion.p>

          {/* FAQ Items */}
          <motion.div 
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                variants={fadeInUp}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                  openId === faq.id 
                    ? 'shadow-xl border-green-200 ring-1 ring-green-500/20' 
                    : 'shadow-sm border-slate-200 hover:shadow-lg hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <faq.icon />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 pr-4">
                        {faq.question}
                      </h3>
                      <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium ${categoryColors[faq.category]?.bg} ${categoryColors[faq.category]?.text}`}>
                        {faq.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    openId === faq.id 
                      ? 'bg-green-500 text-white rotate-180' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                <AnimatePresence>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        {/* Answer */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100 mb-5">
                          <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                        </div>
                        
                        {/* Myth vs Truth */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                            <div className="flex items-center mb-3">
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <h4 className="font-bold text-red-900">Common Myth</h4>
                            </div>
                            <p className="text-sm text-red-800">{faq.myth}</p>
                          </div>
                          
                          <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                            <div className="flex items-center mb-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <h4 className="font-bold text-green-900">The Truth</h4>
                            </div>
                            <p className="text-sm text-green-800">{faq.truth}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          {/* No results */}
          {filteredFaqs.length === 0 && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No questions found</h3>
              <p className="text-slate-500 mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => { setFilter('All'); setSearchQuery(''); }}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Quick Links</h2>
            <p className="text-slate-600">Jump straight to calculating your taxes</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link 
                to="/personal-calculator"
                className="group block bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Personal Tax Calculator</h3>
                    <p className="text-blue-100">Calculate your PAYE tax with all applicable deductions</p>
                  </div>
                  <svg className="w-8 h-8 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link 
                to="/business-calculator"
                className="group block bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Business Tax Calculator</h3>
                    <p className="text-green-100">Calculate CIT and Development Levy for your business</p>
                  </div>
                  <svg className="w-8 h-8 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div 
            className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Still Have Questions?</h2>
            <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              For official tax information and professional advice, please consult the 
              Federal Inland Revenue Service (FIRS) or a qualified tax advisor.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://www.firs.gov.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <span>Visit FIRS Website</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a
                href="https://www.firs.gov.ng/Contact-Us"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
              >
                Contact FIRS Support
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
