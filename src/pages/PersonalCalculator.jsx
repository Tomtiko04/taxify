import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { calculatePAYE, formatCurrency, formatNumberWithCommas, parseFormattedNumber } from "../utils/taxCalculations";
import { supabase } from "../lib/supabase";
import { savePersonalCalculationData, saveReturnUrl } from "../utils/storage";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

export default function PersonalCalculator({ session }) {
  const [monthlyGross, setMonthlyGross] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [housingAllowance, setHousingAllowance] = useState("");
  const [transportAllowance, setTransportAllowance] = useState("");
  const [isDetailed, setIsDetailed] = useState(false);
  const [additionalIncomes, setAdditionalIncomes] = useState([{ name: "", amount: "" }]);
  const [annualRent, setAnnualRent] = useState("");
  const [hasPension, setHasPension] = useState(true);
  const [hasNHF, setHasNHF] = useState(true);
  const [analysisName, setAnalysisName] = useState("");
  const [results, setResults] = useState(null);
  const [isSavingCalculation, setIsSavingCalculation] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  // Remove the useEffect auth listener as it's now handled by App.jsx
  
  const handleCalculate = (e) => {
    e.preventDefault();

    const basicValue = parseFormattedNumber(basicSalary);
    const housingValue = parseFormattedNumber(housingAllowance);
    const transportValue = parseFormattedNumber(transportAllowance);
    
    // If detailed, gross is sum of BHT, otherwise it's monthlyGross
    const monthlyValue = isDetailed 
      ? (basicValue + housingValue + transportValue)
      : parseFormattedNumber(monthlyGross);

    const pensionBase = isDetailed 
      ? (basicValue + housingValue + transportValue) 
      : monthlyValue;

    const additionalTotal = additionalIncomes.reduce(
      (sum, item) => sum + parseFormattedNumber(item.amount),
      0
    );
    const rentValue = parseFormattedNumber(annualRent);

    if (monthlyValue <= 0 && additionalTotal <= 0) {
      toast.error("Please enter your salary details");
      return;
    }

    const calculation = calculatePAYE(
      monthlyValue,
      rentValue,
      hasPension,
      hasNHF,
      additionalTotal,
      pensionBase
    );
    setResults(calculation);
    toast.success("Tax calculated successfully!");

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const addAdditionalIncome = () => {
    setAdditionalIncomes([...additionalIncomes, { name: "", amount: "" }]);
  };

  const removeAdditionalIncome = (index) => {
    if (additionalIncomes.length > 1) {
      setAdditionalIncomes(additionalIncomes.filter((_, i) => i !== index));
    }
  };

  const updateAdditionalIncome = (index, field, value) => {
    const updated = [...additionalIncomes];
    if (field === 'amount') {
      updated[index][field] = formatNumberWithCommas(value);
    } else {
      updated[index][field] = value;
    }
    setAdditionalIncomes(updated);
  };

  const handleSave = async () => {
    if (!results) {
      toast.error("Please calculate your tax first");
      return;
    }

    if (!session?.user) {
      const calcData = {
        monthlyGross,
        basicSalary,
        housingAllowance,
        transportAllowance,
        isDetailed,
        additionalIncomes,
        annualRent,
        hasPension,
        hasNHF,
        analysisName,
        results,
      };
      if (savePersonalCalculationData(calcData)) {
        saveReturnUrl("/personal-calculator");
        toast.loading("Redirecting to login...", { id: "login-redirect" });
        navigate("/login?return=/personal-calculator");
      } else {
        toast.error("Failed to save. Please try again.");
      }
      return;
    }

    setIsSavingCalculation(true);
    try {
      const { error } = await supabase.from("saved_calculations").insert({
        user_id: session.user.id,
        calculation_type: "personal",
        data: results,
        inputs: {
          name:
            analysisName ||
            `Personal Tax - ${new Date().toLocaleDateString("en-NG")}`,
          monthlyGross,
          basicSalary,
          housingAllowance,
          transportAllowance,
          isDetailed,
          additionalIncomes,
          annualRent,
          hasPension,
          hasNHF,
        },
      });

      if (error) throw error;
      toast.success("Calculation saved!");
      navigate("/dashboard/history");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Error saving. Please try again.");
    } finally {
      setIsSavingCalculation(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    const primaryColor = [22, 163, 74];
    const darkColor = [15, 23, 42];
    const lightGray = [241, 245, 249];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("₦", 20, 25);
    doc.setFontSize(18);
    doc.text("Taxify", 35, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Nigeria Tax Support Portal", 35, 32);

    yPos = 50;
    doc.setTextColor(...darkColor);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Personal Income Tax Analysis", pageWidth / 2, yPos, {
      align: "center",
    });

    yPos += 10;
    const userName = session?.user?.email?.split("@")[0] || "Guest User";
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Prepared for: ${userName}`, pageWidth / 2, yPos, {
      align: "center",
    });

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated: ${new Date().toLocaleString("en-NG")}`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    );

    yPos += 15;
    if (analysisName) {
      doc.setFontSize(11);
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.text(`Analysis: ${analysisName}`, 20, yPos);
      yPos += 8;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text("Income Sources", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    const monthlySalary = parseFloat(monthlyGross) || 0;
    const annualSalary = monthlySalary * 12;
    doc.text(`Monthly Gross Salary:`, 25, yPos);
    doc.text(formatCurrency(monthlySalary), pageWidth - 25, yPos, {
      align: "right",
    });
    yPos += 6;
    doc.text(`Annual Salary (×12):`, 25, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(annualSalary), pageWidth - 25, yPos, {
      align: "right",
    });
    yPos += 8;

    const additionalTotal = additionalIncomes.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    if (additionalTotal > 0) {
      doc.setFont("helvetica", "normal");
      doc.text("Additional Income Sources:", 25, yPos);
      yPos += 6;
      additionalIncomes.forEach((income) => {
        const amount = parseFloat(income.amount) || 0;
        if (amount > 0) {
          doc.text(`  • ${income.name || "Unnamed"}:`, 30, yPos);
          doc.text(formatCurrency(amount), pageWidth - 25, yPos, {
            align: "right",
          });
          yPos += 6;
        }
      });
    }

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Total Annual Gross:", 25, yPos);
    doc.text(formatCurrency(results.annualGross || 0), pageWidth - 25, yPos, {
      align: "right",
    });
    yPos += 12;

    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text("Deductions", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    if (results.pension > 0) {
      doc.text(`Pension (8%):`, 25, yPos);
      doc.text(formatCurrency(results.pension), pageWidth - 25, yPos, {
        align: "right",
      });
      yPos += 6;
    }
    if (results.nhf > 0) {
      doc.text(`NHF (2.5%):`, 25, yPos);
      doc.text(formatCurrency(results.nhf), pageWidth - 25, yPos, {
        align: "right",
      });
      yPos += 6;
    }
    if (results.rentRelief > 0) {
      doc.text(`Rent Relief:`, 25, yPos);
      doc.text(formatCurrency(results.rentRelief), pageWidth - 25, yPos, {
        align: "right",
      });
      yPos += 6;
    }

    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Total Deductions:", 25, yPos);
    doc.text(
      formatCurrency(results.totalDeductions || 0),
      pageWidth - 25,
      yPos,
      { align: "right" }
    );
    yPos += 12;

    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text("Tax Calculation", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`Taxable Income:`, 25, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(results.taxableIncome || 0), pageWidth - 25, yPos, {
      align: "right",
    });
    yPos += 10;

    if (results.breakdown?.length > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      results.breakdown.forEach((band) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${band.band} (${band.rate}%):`, 30, yPos);
        doc.text(formatCurrency(band.tax), pageWidth - 25, yPos, {
          align: "right",
        });
        yPos += 5;
      });
      yPos += 5;
    }

    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(...lightGray);
    doc.roundedRect(20, yPos, pageWidth - 40, 32, 3, 3, "F");
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text("Summary", 25, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Annual Tax:`, 25, yPos);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(formatCurrency(results.netTax || 0), pageWidth - 25, yPos, {
      align: "right",
    });
    yPos += 6;
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`Monthly Tax:`, 25, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(results.monthlyTax || 0), pageWidth - 25, yPos, {
      align: "right",
    });

    yPos += 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Generated by Taxify - Based on Nigeria Tax Act 2025",
      pageWidth / 2,
      yPos,
      { align: "center" }
    );

    doc.save(`tax-report-${Date.now()}.pdf`);
    toast.success("PDF downloaded!");
  };

  const resetForm = () => {
    setResults(null);
    setMonthlyGross("");
    setBasicSalary("");
    setHousingAllowance("");
    setTransportAllowance("");
    setIsDetailed(false);
    setAdditionalIncomes([{ name: "", amount: "" }]);
    setAnnualRent("");
    setHasPension(true);
    setHasNHF(true);
    setAnalysisName("");
  };

  const taxBands = [
    {
      range: "₦0 - ₦800,000",
      rate: 0,
      description: "Tax-free threshold for low income earners",
      color: "from-green-400 to-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    {
      range: "₦800,001 - ₦3,000,000",
      rate: 15,
      description: "First taxable band for lower-middle income",
      color: "from-blue-400 to-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    {
      range: "₦3,000,001 - ₦12,000,000",
      rate: 18,
      description: "Middle income tax bracket",
      color: "from-indigo-400 to-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
      borderColor: "border-indigo-200",
    },
    {
      range: "₦12,000,001 - ₦25,000,000",
      rate: 21,
      description: "Upper-middle income bracket",
      color: "from-purple-400 to-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      borderColor: "border-purple-200",
    },
    {
      range: "₦25,000,001 - ₦50,000,000",
      rate: 23,
      description: "High income tax bracket",
      color: "from-orange-400 to-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      borderColor: "border-orange-200",
    },
    {
      range: "Above ₦50,000,000",
      rate: 25,
      description: "Top earners tax bracket",
      color: "from-red-400 to-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div className="min-h-screen pb-16 pt-19 bg-slate-50">
      {/* Hero Section */}
      <div className="text-white bg-gradient-to-br from-green-600 via-emerald-600 to-green-700">
        <div className="max-w-6xl px-4 py-[7em] mx-auto sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center px-4 py-2 mb-4 text-sm rounded-full bg-white/10 backdrop-blur-sm">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Updated for Nigeria Tax Act 2025
            </div>
            <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
              Personal Income Tax Calculator
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-green-100">
              Calculate your PAYE tax in seconds. Enter your salary and see
              exactly how much you'll pay.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl px-4 mx-auto -mt-8 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-xl shadow-lg p-1.5 inline-flex">
            <button
              onClick={() => setActiveTab("calculator")}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === "calculator"
                  ? "bg-green-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Calculator
            </button>
            <button
              onClick={() => setActiveTab("taxbands")}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === "taxbands"
                  ? "bg-green-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              2026 Tax Bands
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "calculator" ? (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-6 lg:grid-cols-5"
            >
              {/* Calculator Form */}
              <div className="lg:col-span-3">
                <div className="overflow-hidden bg-white border shadow-xl rounded-2xl border-slate-100">
                  <div className="p-6 sm:p-8">
                    <h2 className="flex items-center mb-6 text-xl font-bold text-slate-900">
                      <div className="flex items-center justify-center w-10 h-10 mr-3 bg-green-100 rounded-xl">
                        <svg
                          className="w-5 h-5 text-green-600"
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
                      </div>
                      Enter Your Income Details
                    </h2>

                    <form onSubmit={handleCalculate} className="space-y-6">
                      {/* Analysis Name */}
                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700">
                          Analysis Name{" "}
                          <span className="font-normal text-slate-400">
                            (optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={analysisName}
                          onChange={(e) => setAnalysisName(e.target.value)}
                          className="w-full px-4 py-3 transition-all border border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                          placeholder="e.g., January 2026 Salary"
                        />
                      </div>

                      {/* Calculation Mode Toggle */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">Detailed Salary Breakdown</h4>
                          <p className="text-xs text-slate-500">Break down your salary for more accurate pension calculation</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDetailed(!isDetailed)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDetailed ? 'bg-green-600' : 'bg-slate-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDetailed ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {isDetailed ? (
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <label className="block mb-2 text-xs font-medium text-slate-700">Basic Salary (Monthly)</label>
                            <div className="relative">
                              <span className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-400 text-xs">₦</span>
                              <input
                                type="text"
                                value={basicSalary}
                                onChange={(e) => setBasicSalary(formatNumberWithCommas(e.target.value))}
                                className="w-full py-2 pl-7 pr-3 text-sm transition-all border border-slate-200 rounded-lg focus:border-green-500 focus:outline-none"
                                placeholder="250,000"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block mb-2 text-xs font-medium text-slate-700">Housing (Monthly)</label>
                            <div className="relative">
                              <span className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-400 text-xs">₦</span>
                              <input
                                type="text"
                                value={housingAllowance}
                                onChange={(e) => setHousingAllowance(formatNumberWithCommas(e.target.value))}
                                className="w-full py-2 pl-7 pr-3 text-sm transition-all border border-slate-200 rounded-lg focus:border-green-500 focus:outline-none"
                                placeholder="150,000"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block mb-2 text-xs font-medium text-slate-700">Transport (Monthly)</label>
                            <div className="relative">
                              <span className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-400 text-xs">₦</span>
                              <input
                                type="text"
                                value={transportAllowance}
                                onChange={(e) => setTransportAllowance(formatNumberWithCommas(e.target.value))}
                                className="w-full py-2 pl-7 pr-3 text-sm transition-all border border-slate-200 rounded-lg focus:border-green-500 focus:outline-none"
                                placeholder="100,000"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Monthly Salary */
                        <div>
                          <label className="block mb-2 text-sm font-medium text-slate-700">
                            Monthly Gross Salary{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute font-medium -translate-y-1/2 left-4 top-1/2 text-slate-500">
                              ₦
                            </span>
                            <input
                              type="text"
                              value={monthlyGross}
                              onChange={(e) => setMonthlyGross(formatNumberWithCommas(e.target.value))}
                              className="w-full py-3 pl-10 pr-4 text-lg font-semibold transition-all border border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                              placeholder="500,000"
                              required={!isDetailed}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5">
                            Your salary before any deductions are made
                          </p>
                        </div>
                      )}

                      {/* Deductions Section */}
                      <div className="p-5 border bg-gradient-to-br from-slate-50 to-green-50/30 rounded-xl border-slate-100">
                        <h3 className="mb-1 font-semibold text-slate-900">
                          Tax-Saving Contributions
                        </h3>
                        <p className="mb-4 text-xs text-slate-500">
                          Select the contributions you make to reduce your
                          taxable income
                        </p>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label
                            className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              hasPension
                                ? "border-green-500 bg-green-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={hasPension}
                              onChange={(e) => setHasPension(e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-3 flex-shrink-0 ${
                                hasPension
                                  ? "bg-green-500 border-green-500"
                                  : "border-slate-300"
                              }`}
                            >
                              {hasPension && (
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="block font-semibold text-slate-900">
                                  Pension (8%)
                                </span>
                                <div className="group relative">
                                  <svg className="w-4 h-4 text-slate-400 hover:text-green-600 transition-colors cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none shadow-2xl border border-slate-700 backdrop-blur-sm">
                                    <div className="font-bold text-green-400 mb-1">Pension Tax Relief</div>
                                    Every Naira that goes into your Pension is 100% Tax-Free.
                                    <div className="mt-2 text-slate-400 italic font-normal">
                                      Tip: Is your pension based on Total Salary or just Basic, Housing & Transport? Check your pay slip to see!
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-slate-500">
                                Contributes to your retirement savings
                              </span>
                            </div>
                          </label>

                          <label
                            className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              hasNHF
                                ? "border-green-500 bg-green-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={hasNHF}
                              onChange={(e) => setHasNHF(e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-3 flex-shrink-0 ${
                                hasNHF
                                  ? "bg-green-500 border-green-500"
                                  : "border-slate-300"
                              }`}
                            >
                              {hasNHF && (
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <span className="block font-semibold text-slate-900">
                                NHF (2.5%)
                              </span>
                              <span className="text-xs text-slate-500">
                                National Housing Fund contribution
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Annual Rent */}
                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700">
                          Annual Rent Paid{" "}
                          <span className="font-normal text-slate-400">
                            (optional)
                          </span>
                        </label>
                        <div className="relative">
                          <span className="absolute font-medium -translate-y-1/2 left-4 top-1/2 text-slate-500">
                            ₦
                          </span>
                          <input
                            type="text"
                            value={annualRent}
                            onChange={(e) => setAnnualRent(formatNumberWithCommas(e.target.value))}
                            className="w-full py-3 pl-10 pr-4 transition-all border border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                            placeholder="1,200,000"
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">
                          You can claim 20% of your rent as tax relief (max
                          ₦500,000)
                        </p>
                      </div>

                      {/* Additional Income */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-slate-700">
                            Additional Income Sources{" "}
                            <span className="font-normal text-slate-400">
                              (optional)
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={addAdditionalIncome}
                            className="flex items-center text-sm font-medium text-green-600 hover:text-green-700"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Add
                          </button>
                        </div>
                        <div className="space-y-3">
                          {additionalIncomes.map((income, index) => (
                            <div key={index} className="flex gap-3">
                              <input
                                type="text"
                                value={income.name}
                                onChange={(e) =>
                                  updateAdditionalIncome(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:outline-none"
                                placeholder="e.g., Freelance, Rental"
                              />
                              <div className="relative flex-1">
                                <span className="absolute -translate-y-1/2 left-4 top-1/2 text-slate-500">
                                  ₦
                                </span>
                                <input
                                  type="text"
                                  value={income.amount}
                                  onChange={(e) =>
                                    updateAdditionalIncome(
                                      index,
                                      "amount",
                                      e.target.value
                                    )
                                  }
                                  className="w-full py-3 pl-10 pr-4 border border-slate-200 rounded-xl focus:border-green-500 focus:outline-none"
                                  placeholder="Annual amount"
                                />
                              </div>
                              {additionalIncomes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeAdditionalIncome(index)}
                                  className="p-3 text-red-500 transition-colors hover:text-red-600 hover:bg-red-50 rounded-xl"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Calculate Button */}
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex items-center justify-center w-full py-4 text-lg font-semibold text-white transition-all shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-green-500/25 hover:shadow-green-500/40"
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
                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        Calculate My Tax
                      </motion.button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-2" ref={resultsRef}>
                <div className="sticky overflow-hidden bg-white border shadow-xl rounded-2xl border-slate-100 top-24">
                  {results ? (
                    <div>
                      {/* Result Header */}
                      <div className="p-6 text-white bg-gradient-to-br from-emerald-600 to-green-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-green-100">
                            Monthly Take-Home
                          </span>
                          <button onClick={resetForm} className="text-green-100 hover:text-white text-xs underline">
                            Reset
                          </button>
                        </div>
                        <div className="mb-2 text-4xl font-extrabold">
                          {formatCurrency(results.netMonthly || 0)}
                        </div>
                        <div className="flex gap-4 text-sm text-green-50">
                          <span>Yearly: <strong className="text-white">{formatCurrency(results.netAnnual || 0)}</strong></span>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Tax Exempt Badge */}
                        {results.taxableIncome <= 800000 && (
                          <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                            <div className="flex items-center text-green-700">
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
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="font-semibold">Tax Exempt</span>
                            </div>
                            <p className="mt-1 text-sm text-green-600">
                              Your income is below ₦800,000/year
                            </p>
                          </div>
                        )}

                         {/* Analysis Breakdown */}
                        <div className="space-y-4 mb-6">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Take-Home Pay</span>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Net Income</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-slate-900">{formatCurrency(results.netMonthly)}</span>
                              <span className="text-sm text-slate-500 font-medium">/ month</span>
                            </div>
                            <div className="mt-1 text-sm text-slate-600 font-medium">
                              {formatCurrency(results.netAnnual)} per year
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                              <span className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Tax Savings</span>
                              <span className="block text-base font-bold text-blue-700">{formatCurrency(results.totalDeductions || 0)}</span>
                              <span className="text-[10px] text-blue-500 font-medium tracking-tight">Shielded income</span>
                            </div>
                            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                              <span className="block text-[10px] font-bold text-rose-600 uppercase mb-1">Monthly Tax</span>
                              <span className="block text-base font-bold text-rose-700">{formatCurrency(results.monthlyTax || 0)}</span>
                              <span className="text-[10px] text-rose-500 font-medium tracking-tight">Tax per month</span>
                            </div>
                            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                              <span className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Net Tax Rate</span>
                              <span className="block text-base font-bold text-emerald-700">{(results.effectiveRate || 0).toFixed(2)}%</span>
                              <span className="text-[10px] text-emerald-500 font-medium tracking-tight">Tax burden</span>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Stats */}
                        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900">Detailed Breakdown</h4>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg">
                              <span className="text-sm text-slate-600">Total Annual Gross</span>
                              <span className="text-sm font-bold text-slate-900">{formatCurrency(results.annualGross)}</span>
                            </div>
                            
                            {/* Statutory Deductions List */}
                            <div className="space-y-2 px-1">
                              {results.pension > 0 && (
                                <div className="flex justify-between items-center text-sm py-1.5">
                                  <span className="text-slate-500 flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2.5"></div>
                                    Pension (8%)
                                  </span>
                                  <span className="font-semibold text-slate-700">-{formatCurrency(results.pension)}</span>
                                </div>
                              )}
                              {results.nhf > 0 && (
                                <div className="flex justify-between items-center text-sm py-1.5">
                                  <span className="text-slate-500 flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2.5"></div>
                                    NHF (2.5%)
                                  </span>
                                  <span className="font-semibold text-slate-700">-{formatCurrency(results.nhf)}</span>
                                </div>
                              )}
                              {results.rentRelief > 0 && (
                                <div className="flex justify-between items-center text-sm py-1.5">
                                  <span className="text-slate-500 flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 mr-2.5"></div>
                                    Rent Relief
                                  </span>
                                  <span className="font-semibold text-slate-700">-{formatCurrency(results.rentRelief)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center py-2.5 px-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                              <span className="text-sm font-semibold text-slate-700">Taxable Income</span>
                              <span className="text-sm font-bold text-slate-900">{formatCurrency(results.taxableIncome)}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 px-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                              <span className="text-sm font-bold text-slate-700">Total Annual Tax</span>
                              <span className="text-base font-extrabold text-slate-900">{formatCurrency(results.netTax)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4">
                          <button
                            onClick={handleSave}
                            disabled={isSavingCalculation}
                            className="flex items-center justify-center py-3 text-sm font-medium text-white transition-colors bg-green-600 rounded-xl hover:bg-green-700"
                          >
                            {isSavingCalculation ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
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
                                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                  />
                                </svg>
                                Save Analysis
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleDownload}
                            className="flex items-center justify-center py-3 text-sm font-medium transition-colors bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                          >
                            <svg
                              className="w-4 h-4 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            PDF
                          </button>
                        </div>

                        {!session && (
                          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-500 mb-2">Login to save your analyses permanently</p>
                            <div className="grid grid-cols-2 gap-2">
                              <Link to="/login?return=/personal-calculator" className="py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Login</Link>
                              <Link to="/signup?return=/personal-calculator" className="py-2 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors">Sign Up</Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl">
                        <svg
                          className="w-8 h-8 text-slate-400"
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
                      </div>
                      <h3 className="mb-2 font-semibold text-slate-900">
                        Your Results
                      </h3>
                      <p className="text-sm text-slate-500">
                        Enter your salary and click "Calculate My Tax" to see
                        your tax breakdown
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="taxbands"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Tax Bands Section */}
              <div className="overflow-hidden bg-white border shadow-xl rounded-2xl border-slate-100">
                <div className="p-6 border-b sm:p-8 border-slate-100">
                  <h2 className="mb-2 text-2xl font-bold text-slate-900">
                    Nigeria Personal Income Tax Bands (2026)
                  </h2>
                  <p className="text-slate-600">
                    Under the Nigeria Tax Act 2025, personal income is taxed
                    progressively across different bands. This means only the
                    portion of your income within each band is taxed at that
                    rate.
                  </p>
                </div>

                <div className="p-6 sm:p-8">
                  {/* Visual Representation */}
                  <div className="mb-8">
                    <h3 className="mb-4 font-semibold text-slate-900">
                      Tax Rate Overview
                    </h3>
                    <div className="flex h-6 overflow-hidden rounded-full">
                      {taxBands.map((band, i) => (
                        <div
                          key={i}
                          className={`bg-gradient-to-r ${band.color} flex-1 first:rounded-l-full last:rounded-r-full`}
                          title={`${band.rate}%`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>0%</span>
                      <span>15%</span>
                      <span>18%</span>
                      <span>21%</span>
                      <span>23%</span>
                      <span>25%</span>
                    </div>
                  </div>

                  {/* Detailed Bands */}
                  <div className="space-y-4">
                    {taxBands.map((band, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-5 rounded-xl border ${band.borderColor} ${band.bgColor}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div
                                className={`w-10 h-10 rounded-xl bg-gradient-to-r ${band.color} flex items-center justify-center mr-3`}
                              >
                                <span className="text-sm font-bold text-white">
                                  {band.rate}%
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">
                                  {band.range}
                                </h4>
                                <p className={`text-sm ${band.textColor}`}>
                                  {band.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className={`text-right ${band.textColor}`}>
                            <div className="text-2xl font-bold">
                              {band.rate}%
                            </div>
                            <div className="text-xs">Tax Rate</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* How It Works */}
                  <div className="p-6 mt-8 bg-slate-50 rounded-xl">
                    <h3 className="flex items-center mb-4 font-semibold text-slate-900">
                      <svg
                        className="w-5 h-5 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      How Progressive Taxation Works
                    </h3>
                    <div className="space-y-3 text-sm text-slate-600">
                      <p>
                        <strong className="text-slate-900">Example:</strong> If
                        you earn ₦5,000,000 annually:
                      </p>
                      <ul className="ml-4 space-y-2">
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                          <span>
                            First ₦800,000 is{" "}
                            <strong className="text-green-600">tax-free</strong>
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                          <span>
                            Next ₦2,200,000 (₦800,001 to ₦3,000,000) is taxed at{" "}
                            <strong className="text-blue-600">15%</strong> =
                            ₦330,000
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                          <span>
                            Remaining ₦2,000,000 (₦3,000,001 to ₦5,000,000) is
                            taxed at{" "}
                            <strong className="text-indigo-600">18%</strong> =
                            ₦360,000
                          </span>
                        </li>
                      </ul>
                      <p className="pt-2 border-t border-slate-200">
                        <strong className="text-slate-900">Total Tax:</strong>{" "}
                        ₦0 + ₦330,000 + ₦360,000 ={" "}
                        <strong className="text-green-600">₦690,000</strong>{" "}
                        (13.8% effective rate)
                      </p>
                    </div>
                  </div>

                  {/* Allowable Deductions */}
                  <div className="p-6 mt-6 border border-green-200 bg-green-50 rounded-xl">
                    <h3 className="flex items-center mb-4 font-semibold text-slate-900">
                      <svg
                        className="w-5 h-5 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Allowable Deductions
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="p-4 bg-white rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          8%
                        </div>
                        <div className="font-medium text-slate-900">
                          Pension
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Retirement savings contribution
                        </p>
                      </div>
                      <div className="p-4 bg-white rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          2.5%
                        </div>
                        <div className="font-medium text-slate-900">NHF</div>
                        <p className="mt-1 text-xs text-slate-500">
                          National Housing Fund
                        </p>
                      </div>
                      <div className="p-4 bg-white rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          20%
                        </div>
                        <div className="font-medium text-slate-900">
                          Rent Relief
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Max ₦500,000 annually
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
