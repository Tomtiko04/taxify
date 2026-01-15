import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Calculate Your Nigerian Taxes with Confidence
              </h1>
              <p className="text-xl mb-8 text-green-100">
                Based on the new Tax Act 2025 (effective Jan 2026). Understand your tax obligations and calculate your PAYE or CIT accurately.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/personal-calculator" className="btn-primary bg-white text-green-600 hover:bg-green-50 text-center">
                  Calculate Personal Tax
                </Link>
                <Link to="/business-calculator" className="btn-secondary bg-transparent border-white text-white hover:bg-white/10 text-center">
                  Calculate Business Tax
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                    <span>Annual Income</span>
                    <span className="font-bold">₦2,400,000</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                    <span>Tax Payable</span>
                    <span className="font-bold">₦240,000</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                    <span>Net Income</span>
                    <span className="font-bold text-green-300">₦2,160,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">
            Why Use Taxify?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Accurate Calculations</h3>
              <p className="text-slate-600">
                Based on the latest Nigeria Tax Act 2025 with all deductions including pension, NHF, and rent relief.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Easy to Understand</h3>
              <p className="text-slate-600">
                Clear breakdown of your tax obligations with detailed explanations for each component.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-slate-600">
                Your financial data is secure. All calculations are done locally in your browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tax Rules Preview */}
      <section className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">
            Tax Rules Overview
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-2xl font-semibold mb-4 text-green-600">Personal Income Tax (PAYE)</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Tax-free threshold: ₦800,000 annually</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Progressive rates: 0% to 25%</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Pension deduction: 8%</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>NHF deduction: 2.5%</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Rent relief: 20% of annual rent (max ₦500,000)</span>
                </li>
              </ul>
            </div>
            
            <div className="card">
              <h3 className="text-2xl font-semibold mb-4 text-green-600">Corporate Income Tax (CIT)</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Small Business (Turnover &lt; ₦50M): 0% CIT, 0% Development Levy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Large Business (Turnover &gt; ₦50M): 30% CIT + 4% Development Levy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Calculated on profit, not turnover</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Calculate Your Taxes?</h2>
          <p className="text-xl mb-8 text-green-100">
            Get started with our free tax calculators. No signup required for basic calculations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/personal-calculator" className="btn-primary bg-white text-green-600 hover:bg-green-50">
              Personal Tax Calculator
            </Link>
            <Link to="/business-calculator" className="btn-secondary bg-transparent border-white text-white hover:bg-white/10">
              Business Tax Calculator
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
