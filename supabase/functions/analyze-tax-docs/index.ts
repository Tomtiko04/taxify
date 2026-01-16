import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { pdfs } = body
    console.log(`Received ${pdfs?.length || 0} PDFs. total size: ${JSON.stringify(body).length} bytes`)

    if (!pdfs || !Array.isArray(pdfs) || pdfs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No PDF documents provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google AI API Key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
YOU ARE A NIGERIAN TAX COMPLIANCE SPECIALIST (2026 STANDARDS).
YOUR GOAL: Extract specific financial data from the provided Nigerian financial documents to determine tax liability under the Nigeria Tax Act (NTA) 2025.

You may be provided with multiple documents: Audited Financial Statements, Fixed Asset Registers, Trial Balances, or WHT Credit Notes. Synthesize data from all of them.

### EXTRACTION RULES:
1. CURRENCY: All values must be returned as numbers in Nigerian Naira (NGN). 
2. SEARCH AREAS: Look in the "Statement of Profit or Loss", "Statement of Financial Position" (Balance Sheet), and "Notes to the Financial Statements" (specifically the PPE and Taxation notes).
3. HIERARCHY: If a value is present in both a summary table and a detailed Note, prioritize the value in the "Notes".
4. NULLS: If a field is not found across all documents, return null. Do NOT guess or hallucinate.

### FIELD MAPPING LOGIC:
- company_name: Found on the cover page or Directors' Report.
- annual_turnover: Total Revenue/Sales for the most recent year.
- net_profit_before_tax: Profit before income tax expense is deducted.
- total_fixed_assets: The "Net Book Value" of Property, Plant, and Equipment (PPE).
- depreciation: The specific depreciation charge for the current year (found in the PPE Note).
- fines_penalties: Any line item in Administrative Expenses labeled "fines", "penalties", or "non-deductible charges".
- capital_allowances: Look in the "Taxation" note for tax-specific depreciation allowances.

### OUTPUT FORMAT (STRICT JSON ONLY):
{
  "company_name": string,
  "annual_turnover": number,
  "net_profit_before_tax": number,
  "total_fixed_assets": number,
  "depreciation": number,
  "fines_penalties": number,
  "capital_allowances": number,
  "confidence_score": number (0-1),
  "extraction_summary": string
}
`

    const contentParts = [
      prompt,
      ...pdfs.map(pdf => ({
        inlineData: {
          data: pdf.data,
          mimeType: "application/pdf"
        }
      }))
    ]

    const result = await model.generateContent(contentParts)

    const response = await result.response
    let text = response.text()
    console.log('Raw AI Response:', text)
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?/, '').replace(/```\n?/, '').trim()
    
    const extraction = JSON.parse(text)

    return new Response(
      JSON.stringify(extraction),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
