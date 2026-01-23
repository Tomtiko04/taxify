import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { formatCurrency, formatNumberWithCommas, parseFormattedNumber } from "../../utils/taxCalculations";
import toast from "react-hot-toast";

export default function Profile({ userProfile, onProfileUpdate }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || "",
    email: userProfile?.email || "",
    monthly_salary: userProfile?.monthly_salary ? formatNumberWithCommas(userProfile.monthly_salary.toString()) : "",
    company_name: userProfile?.company_name || "",
    business_type: userProfile?.business_type || "",
    annual_turnover: userProfile?.annual_turnover ? formatNumberWithCommas(userProfile.annual_turnover.toString()) : "",
  });

  const isCompany = userProfile?.user_type === "company";

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'monthly_salary' || name === 'annual_turnover') {
      setFormData((prev) => ({ ...prev, [name]: formatNumberWithCommas(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        full_name: formData.full_name,
        ...(isCompany
          ? {
              company_name: formData.company_name,
              business_type: formData.business_type,
              annual_turnover: formData.annual_turnover
                ? parseFormattedNumber(formData.annual_turnover)
                : null,
            }
          : {
              monthly_salary: formData.monthly_salary
                ? parseFormattedNumber(formData.monthly_salary)
                : null,
            }),
      };

      const { error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", userProfile.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setEditing(false);
      if (onProfileUpdate) {
        onProfileUpdate({ ...userProfile, ...updateData });
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        userProfile.email,
        {
          redirectTo: `${import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to send reset email");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="mt-1 text-slate-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
        {/* Profile Header */}
        <div className="p-6 bg-gradient-to-r from-green-600 to-green-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full">
              <span className="text-2xl font-bold text-green-600">
                {userProfile?.full_name?.charAt(0) ||
                  userProfile?.email?.charAt(0) ||
                  "U"}
              </span>
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">
                {userProfile?.full_name || "User"}
              </h2>
              <p className="text-green-100">{userProfile?.email}</p>
            </div>
          </div>
        </div>

        {/* Account Type Badge */}
        <div className="px-6 py-4 border-b bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Account Type</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isCompany
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {isCompany ? "🏢 Business Account" : "👤 Individual Account"}
            </span>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">
              Profile Information
            </h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm font-medium text-green-600 hover:text-green-700"
              >
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-5">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="cursor-not-allowed input-field bg-slate-50 text-slate-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Email cannot be changed
                </p>
              </div>

              {isCompany ? (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-slate-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-slate-700">
                      Business Type
                    </label>
                    <select
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">Select type</option>
                      <option value="sole_proprietorship">
                        Sole Proprietorship
                      </option>
                      <option value="partnership">Partnership</option>
                      <option value="limited_company">
                        Limited Company (Ltd)
                      </option>
                      <option value="plc">Public Limited Company (PLC)</option>
                      <option value="ngo">Non-Profit Organization</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-slate-700">
                      Annual Turnover (₦)
                    </label>
                    <input
                      type="number"
                      name="annual_turnover"
                      value={formData.annual_turnover}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g., 50000000"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700">
                    Monthly Salary (₦)
                  </label>
                  <input
                    type="text"
                    name="monthly_salary"
                    value={formData.monthly_salary}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 500,000"
                  />
                </div>
              )}

              <div className="flex pt-4 space-x-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      full_name: userProfile?.full_name || "",
                      email: userProfile?.email || "",
                      monthly_salary:
                        userProfile?.monthly_salary?.toString() || "",
                      company_name: userProfile?.company_name || "",
                      business_type: userProfile?.business_type || "",
                      annual_turnover:
                        userProfile?.annual_turnover?.toString() || "",
                    });
                  }}
                  className="px-4 py-2.5 text-slate-700 bg-slate-100 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Full Name</span>
                <span className="font-medium text-slate-900">
                  {userProfile?.full_name || "-"}
                </span>
              </div>

              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Email</span>
                <span className="font-medium text-slate-900">
                  {userProfile?.email}
                </span>
              </div>

              {isCompany ? (
                <>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600">Company Name</span>
                    <span className="font-medium text-slate-900">
                      {userProfile?.company_name || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600">Business Type</span>
                    <span className="font-medium capitalize text-slate-900">
                      {userProfile?.business_type?.replace("_", " ") || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between py-3">
                    <span className="text-slate-600">Annual Turnover</span>
                    <span className="font-medium text-slate-900">
                      {userProfile?.annual_turnover
                        ? formatCurrency(userProfile.annual_turnover)
                        : "-"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-3">
                  <span className="text-slate-600">Monthly Salary</span>
                  <span className="font-medium text-slate-900">
                    {userProfile?.monthly_salary
                      ? formatCurrency(userProfile.monthly_salary)
                      : "-"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
        <h3 className="mb-4 font-semibold text-slate-900">Security</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Password</p>
              <p className="text-sm text-slate-500">
                Change your account password
              </p>
            </div>
            <button
              onClick={handlePasswordReset}
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              Reset Password
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900">Email Verification</p>
              <p className="text-sm text-slate-500">
                Your email verification status
              </p>
            </div>
            <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
              ✓ Verified
            </span>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
        <h3 className="mb-4 font-semibold text-slate-900">Data & Privacy</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Export Data</p>
              <p className="text-sm text-slate-500">
                Download all your tax calculations
              </p>
            </div>
            <button className="text-sm font-medium text-green-600 hover:text-green-700">
              Export
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-slate-500">
                Permanently delete your account and data
              </p>
            </div>
            <button className="text-sm font-medium text-red-600 hover:text-red-700">
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tax Year Info */}
      <div className="p-6 border bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border-slate-200">
        <div className="flex items-start space-x-4">
          <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-white rounded-xl">
            <svg
              className="w-6 h-6 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Tax Year 2026</h4>
            <p className="mt-1 text-sm text-slate-600">
              All calculations are based on the Nigeria Tax Act 2025, effective
              January 2026. Stay updated with the latest tax regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
