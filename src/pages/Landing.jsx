import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const floatAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
};

  const stats = [
    { number: "10,000+", label: "Calculations Made" },
    { number: "₦2.5B+", label: "Taxes Calculated" },
    { number: "98%", label: "Accuracy Rate" },
    { number: "24/7", label: "Available" },
  ];

  const features = [
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      title: "Precise Calculations",
      description:
        "Built on the Nigeria Tax Act 2025. Every deduction, every relief, calculated to the last kobo.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Lightning Fast",
      description:
        "Get your tax breakdown in seconds. No waiting, no complex forms to fill out.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
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
      ),
      title: "Bank-Level Security",
      description:
        "Your financial data never leaves your browser. We take your privacy seriously.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      title: "Educational Resources",
      description:
        "Learn about Nigerian tax laws with our comprehensive guides and FAQ section.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: "For Everyone",
      description:
        "Whether you're an employee or a business owner, we've got you covered.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Detailed Reports",
      description:
        "Get comprehensive breakdowns of your tax obligations with visual charts.",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Enter Your Income",
      description:
        "Input your annual salary, business turnover, or other income sources.",
    },
    {
      step: "02",
      title: "Add Deductions",
      description:
        "Include pension contributions, NHF, rent payments, and other reliefs.",
    },
    {
      step: "03",
      title: "Get Results",
      description:
        "Receive an instant breakdown of your tax liability with detailed explanations.",
    },
  ];

  const testimonials = [
    {
      name: "Adebayo Ogundimu",
      role: "Software Engineer, Lagos",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      quote:
        "TaxBuddy made understanding my PAYE so much easier. I finally know exactly where my deductions go!",
    },
    {
      name: "Chidinma Eze",
      role: "Business Owner, Abuja",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      quote:
        "As a small business owner, calculating CIT was always confusing. TaxBuddy simplified everything for me.",
    },
    {
      name: "Emeka Nwosu",
      role: "HR Manager, Port Harcourt",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      quote:
        "I use TaxBuddy to explain tax deductions to our employees. It's become an essential HR tool.",
    },
  ];


export default function Landing({ session, userProfile }) {
  const isIndividual = userProfile?.user_type === "individual";
  const isCompany = userProfile?.user_type === "company";
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 text-white overflow-hidden py-2">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute rounded-full top-20 left-10 w-72 h-72 bg-green-500/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute rounded-full bottom-20 right-10 w-96 h-96 bg-emerald-500/20 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-3xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="relative px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="mb-4">
                <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-400 border rounded-full bg-green-500/20 border-green-500/30 backdrop-blur-sm">
                  <span className="w-2 h-2 mr-2 bg-green-400 rounded-full animate-pulse"></span>
                  Updated for Tax Act 2025
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="mb-6 text-5xl font-bold leading-tight lg:text-6xl"
              >
                Nigerian Tax
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                  Made Simple
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="mb-8 text-xl leading-relaxed text-slate-300"
              >
                Don't sweat the math, let your Buddy do it.
                Accurate, transparent, and built for the new Nigeria Tax Act
                2025.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col gap-4 sm:flex-row"
              >
                {(!session || isIndividual) && (
                  <Link
                    to="/personal-calculator"
                    className="relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-300 shadow-lg group bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-1"
                  >
                    <span>
                      {session
                        ? "My PAYE Calculator"
                        : "Calculate Personal Tax"}
                    </span>
                    <svg
                      className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                )}
                {(!session || isCompany) && (
                  <Link
                    to="/business-calculator"
                    className="inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-300 border group bg-white/10 backdrop-blur-sm border-white/20 rounded-xl hover:bg-white/20"
                  >
                    <span>
                      {session ? "My CIT Calculator" : "Calculate Business Tax"}
                    </span>
                    <svg
                      className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                )}
              </motion.div>

              {!session && (
                <motion.div variants={fadeInUp} className="mt-6">
                  <p className="text-slate-400">
                    Want to save your calculations?{" "}
                    <Link
                      to="/signup"
                      className="text-green-400 underline hover:text-green-300 underline-offset-4"
                    >
                      Create a free account
                    </Link>
                  </p>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInRight}
              className="hidden lg:block"
            >
              <div className="relative sticky top-24">
                <div className="relative p-8 border shadow-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border-white/20">
                  {/* <div className="absolute flex items-center justify-center w-24 h-24 bg-green-500 shadow-lg -top-4 -right-4 rounded-2xl shadow-green-500/50">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div> */}

                  <h3 className="mb-6 text-lg font-semibold text-slate-300">
                    Quick Calculation Preview
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border bg-white/5 rounded-xl border-white/10">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg bg-green-500/20">
                          <svg
                            className="w-5 h-5 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-slate-300">Annual Income</span>
                      </div>
                      <span className="font-bold text-white">₦3,600,000</span>
                    </div>

                    <div className="flex items-center justify-between p-4 border bg-white/5 rounded-xl border-white/10">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg bg-blue-500/20">
                          <svg
                            className="w-5 h-5 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-slate-300">Total Deductions</span>
                      </div>
                      <span className="font-bold text-blue-400">₦378,000</span>
                    </div>

                    <div className="flex items-center justify-between p-4 border bg-white/5 rounded-xl border-white/10">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg bg-amber-500/20">
                          <svg
                            className="w-5 h-5 text-amber-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-slate-300">Tax Payable</span>
                      </div>
                      <span className="font-bold text-amber-400">₦280,500</span>
                    </div>

                    <div className="flex items-center justify-between p-4 border bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border-green-500/30">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg bg-green-500/30">
                          <svg
                            className="w-5 h-5 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="text-slate-300">Net Take-Home</span>
                      </div>
                      <span className="text-xl font-bold text-green-400">
                        ₦2,941,500
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute -translate-x-1/2 bottom-8 left-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex justify-center w-6 h-10 pt-2 border-2 rounded-full border-white/30">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="text-center"
              >
                <div className="mb-2 text-4xl font-bold text-green-600 md:text-5xl">
                  {stat.number}
                </div>
                <div className="font-medium text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="text-sm font-semibold tracking-wider text-green-600 uppercase">
              Why Choose TaxBuddy
            </span>
            <h2 className="mt-4 text-4xl font-bold md:text-5xl text-slate-900">
              Everything You Need for
              <span className="text-green-600"> Tax Clarity</span>
            </h2>
            <p className="max-w-2xl mx-auto mt-4 text-xl text-slate-600">
              Powerful features designed to make Nigerian tax calculations
              simple and stress-free.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="p-8 transition-all duration-300 bg-white border shadow-sm group rounded-2xl hover:shadow-xl border-slate-100 hover:border-green-200"
              >
                <div className="flex items-center justify-center mb-6 text-white transition-transform duration-300 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Video Section */}
      <section className="relative py-24 overflow-hidden text-white bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-0 right-0 rounded-full w-96 h-96 bg-green-500/10 blur-3xl"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            className="mb-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="text-sm font-semibold tracking-wider text-green-400 uppercase">
              Learn More
            </span>
            <h2 className="mt-4 text-4xl font-bold md:text-5xl">
              Understanding Nigerian Taxation
            </h2>
            <p className="max-w-2xl mx-auto mt-4 text-xl text-slate-300">
              Watch this informative video to better understand how taxation
              works in Nigeria.
            </p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <div className="relative overflow-hidden border shadow-2xl rounded-2xl shadow-black/50 border-white/10">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/7z3mXKxBx-U"
                  title="Understanding Nigerian Tax System"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <p className="mt-4 text-sm text-center text-slate-400">
              Source: Nigerian Tax Overview - Educational Content
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="text-sm font-semibold tracking-wider text-green-600 uppercase">
              Simple Process
            </span>
            <h2 className="mt-4 text-4xl font-bold md:text-5xl text-slate-900">
              How TaxBuddy Works
            </h2>
            <p className="max-w-2xl mx-auto mt-4 text-xl text-slate-600">
              Get your tax calculation in three simple steps.
            </p>
          </motion.div>

          <motion.div
            className="relative grid gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-green-200 via-green-400 to-green-200" />

            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative text-center"
              >
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6 text-2xl font-bold text-white rounded-full shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/30">
                  {step.step}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute left-full w-full h-0.5" />
                  )}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-slate-600">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tax Overview Section with Image */}
      <section className="py-24 bg-slate-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInLeft}
            >
              <span className="text-sm font-semibold tracking-wider text-green-600 uppercase">
                Tax Overview
              </span>
              <h2 className="mt-4 mb-6 text-4xl font-bold text-slate-900">
                Personal Income Tax (PAYE)
              </h2>
              <p className="mb-8 text-lg text-slate-600">
                The Pay As You Earn system ensures that employees contribute to
                national development through progressive taxation, with generous
                reliefs for lower-income earners.
              </p>

              <div className="space-y-4">
                {[
                  { label: "Tax-free threshold", value: "₦800,000 annually" },
                  { label: "Progressive rates", value: "0% to 25%" },
                  { label: "Pension contribution", value: "8% employee" },
                  { label: "NHF contribution", value: "2.5%" },
                  { label: "Rent relief", value: "Up to ₦500,000" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white border rounded-xl border-slate-200"
                  >
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-semibold text-green-600">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInRight}
              className="relative"
            >
              <div className="relative overflow-hidden shadow-2xl rounded-2xl">
                <img
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80"
                  alt="Tax calculation and financial planning"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="p-6 shadow-lg bg-white/95 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">
                          Average Tax Savings with Reliefs
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          Up to ₦150,000
                        </p>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Corporate Tax Section with Image */}
      <section className="py-24 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInLeft}
              className="relative order-2 lg:order-1"
            >
              <div className="relative overflow-hidden shadow-2xl rounded-2xl">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
                  alt="Corporate business buildings"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="p-6 shadow-lg bg-white/95 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">
                          Small Business Benefit
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          0% CIT Rate
                        </p>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInRight}
              className="order-1 lg:order-2"
            >
              <span className="text-sm font-semibold tracking-wider text-green-600 uppercase">
                For Businesses
              </span>
              <h2 className="mt-4 mb-6 text-4xl font-bold text-slate-900">
                Corporate Income Tax (CIT)
              </h2>
              <p className="mb-8 text-lg text-slate-600">
                The new Tax Act 2025 provides significant relief for small
                businesses, while ensuring larger corporations contribute their
                fair share to national development.
              </p>

              <div className="space-y-4">
                {[
                  {
                    label: "Small Business (≤₦100M)",
                    value: "0% CIT",
                    highlight: true,
                  },
                  { label: "Large Business CIT Rate", value: "30%" },
                  {
                    label: "Development Levy",
                    value: "4% of Assessable Profit",
                  },
                  { label: "Small Business VAT", value: "Exempt" },
                  { label: "Asset Threshold", value: "≤₦250M for exemption" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      item.highlight
                        ? "bg-green-50 border-green-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span className="text-slate-700">{item.label}</span>
                    <span
                      className={`font-semibold ${
                        item.highlight ? "text-green-600" : "text-slate-900"
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-slate-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="text-sm font-semibold tracking-wider text-green-600 uppercase">
              Testimonials
            </span>
            <h2 className="mt-4 text-4xl font-bold md:text-5xl text-slate-900">
              What Our Users Say
            </h2>
          </motion.div>

          <motion.div
            className="grid gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="p-8 bg-white border shadow-sm rounded-2xl border-slate-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-6 italic text-slate-600">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="object-cover w-12 h-12 mr-4 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden text-white bg-gradient-to-br from-green-600 via-green-700 to-emerald-800">
        <div className="absolute inset-0">
          <motion.div
            className="absolute rounded-full -top-20 -left-20 w-80 h-80 bg-white/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute rounded-full -bottom-20 -right-20 w-96 h-96 bg-white/10 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        <div className="relative max-w-4xl px-4 mx-auto text-center sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-6 text-4xl font-bold md:text-5xl"
            >
              Ready to Calculate Your Taxes?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="max-w-2xl mx-auto mb-10 text-xl text-green-100"
            >
              {session
                ? `Welcome back, ${
                    userProfile?.full_name ||
                    userProfile?.company_name ||
                    "User"
                  }! Continue with your tax calculations below.`
                : "Join thousands of Nigerians who trust TaxBuddy for accurate tax calculations. Start for free today."}
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col justify-center gap-4 sm:flex-row"
            >
              {(!session || isIndividual) && (
                <Link
                  to="/personal-calculator"
                  className="inline-flex items-center justify-center px-8 py-4 font-semibold text-green-600 transition-all duration-300 bg-white shadow-lg group rounded-xl hover:shadow-xl hover:-translate-y-1"
                >
                  <span>
                    {session
                      ? "Personal PAYE Calculator"
                      : "Calculate Personal Tax"}
                  </span>
                  <svg
                    className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              )}
              {(!session || isCompany) && (
                <Link
                  to="/business-calculator"
                  className="inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-300 border-2 border-white group bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20"
                >
                  <span>
                    {session
                      ? "Corporate CIT Calculator"
                      : "Calculate Business Tax"}
                  </span>
                  <svg
                    className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              )}
            </motion.div>

            {!session && (
              <motion.p variants={fadeInUp} className="mt-8 text-green-200">
                No credit card required. Start calculating in seconds.
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">TaxBuddy</span>
              </div>
              <p className="max-w-sm text-slate-400">
                Nigeria's trusted tax calculator. Built on the Tax Act 2025 to
                help individuals and businesses understand their tax
                obligations.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/personal-calculator"
                    className="transition-colors hover:text-green-400"
                  >
                    Personal Tax
                  </Link>
                </li>
                <li>
                  <Link
                    to="/business-calculator"
                    className="transition-colors hover:text-green-400"
                  >
                    Business Tax
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="transition-colors hover:text-green-400"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Account</h4>
              <ul className="space-y-2">
                {!session ? (
                  <>
                    <li>
                      <Link
                        to="/login"
                        className="transition-colors hover:text-green-400"
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/signup"
                        className="transition-colors hover:text-green-400"
                      >
                        Sign Up
                      </Link>
                    </li>
                  </>
                ) : (
                  <li>
                    <span className="text-green-400">Logged In</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="pt-8 mt-12 text-center border-t border-slate-800">
            <p>
              &copy; {new Date().getFullYear()} TaxBuddy. All rights reserved.
              Built for Nigeria.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
