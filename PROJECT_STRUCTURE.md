# Project Structure

```
Taxify/
├── public/                 # Static assets (if needed)
├── src/
│   ├── components/        # Reusable components
│   │   └── Navbar.jsx     # Navigation bar component
│   ├── lib/               # External library configurations
│   │   └── supabase.js    # Supabase client setup
│   ├── pages/             # Page components
│   │   ├── Landing.jsx           # Landing page
│   │   ├── Signup.jsx            # User signup page
│   │   ├── Login.jsx             # User login page
│   │   ├── PersonalCalculator.jsx # PAYE calculator
│   │   ├── BusinessCalculator.jsx # CIT calculator
│   │   └── FAQ.jsx               # FAQ page with myths/truths
│   ├── utils/             # Utility functions
│   │   └── taxCalculations.js    # Tax calculation logic
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles and Tailwind
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── README.md              # Project documentation
```

## Key Features Implemented

### 1. Personal Income Tax Calculator (PAYE)
- ✅ Tax-free threshold: ₦800,000
- ✅ Progressive tax bands (0% to 25%)
- ✅ Pension deduction (8%)
- ✅ NHF deduction (2.5%)
- ✅ Rent relief (20% of annual rent, capped at ₦500,000)
- ✅ Detailed breakdown display

### 2. Corporate Tax Calculator (CIT)
- ✅ Small business detection (< ₦50M turnover)
- ✅ Tax exemption for small businesses
- ✅ CIT calculation (30% on profit)
- ✅ Development Levy (4% on turnover)
- ✅ Clear business category display

### 3. Authentication
- ✅ Signup page with email/password
- ✅ Login page
- ✅ Session management with Supabase
- ✅ Protected routes (ready for extension)

### 4. FAQ Section
- ✅ Interactive accordion design
- ✅ Category filtering
- ✅ Myth vs Truth comparison
- ✅ VAT and bank monitoring clarifications

### 5. Design & UX
- ✅ Modern, trustworthy design (Blue, White, Slate Gray)
- ✅ Fully responsive (mobile-friendly)
- ✅ Accessible forms and navigation
- ✅ Smooth animations and transitions

## Color Scheme
- Primary: Blue (#3b82f6 - primary-600)
- Background: Slate Gray (#f8fafc - slate-50)
- Text: Slate Gray (#0f172a - slate-900)
- Accents: White, Green (for positive states), Red (for errors)
