# TaxBuddy - Nigeria Tax Support Portal

A comprehensive tax calculation and support portal for Nigerian individuals and businesses based on the new Tax Act 2025 (effective Jan 2026). Powered by TaxBuddy.

## Features

- **Personal Income Tax Calculator (PAYE)**: Calculate your personal income tax with all deductions including pension, NHF, and rent relief
- **Corporate Tax Calculator (CIT)**: Determine your business tax obligations
- **FAQ Section**: Clear up common tax myths and misconceptions
- **User Authentication**: Secure signup and login with Supabase

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Supabase
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A Supabase account (free tier works)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API
   - Copy your Project URL and anon/public key
   - Create a `.env` file in the root directory:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Tax Rules Implemented

### Personal Income Tax (PAYE)
- Tax-Free Threshold: ₦800,000 annually
- Progressive tax bands: 0% to 25%
- Deductions: Pension (8%), NHF (2.5%), Rent Relief (20% of annual rent, capped at ₦500,000)

### Corporate Tax (CIT)
- Small Business (Turnover < ₦50M): 0% CIT, 0% Development Levy
- Large Business (Turnover > ₦50M): 30% CIT + 4% Development Levy

## License

MIT
