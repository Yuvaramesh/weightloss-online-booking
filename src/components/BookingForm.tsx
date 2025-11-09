"use client";

import { useState, useEffect } from "react";
import { Calendar, User, Mail, FileText, LogOut } from "lucide-react";

interface FormData {
  patient_name: string;
  patient_email: string;
  issues: string;
  preferred_time: string;
}

interface Message {
  text: string;
  type: string;
}

export default function SimplifiedBookingForm() {
  const [userName, setUserName] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    patient_name: "",
    patient_email: "",
    issues: "",
    preferred_time: "",
  });
  const [message, setMessage] = useState<Message>({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/user");
      const result = await response.json();

      if (result.success) {
        setUserName(result.user.name);
        setFormData((prev) => ({
          ...prev,
          patient_name: result.user.name,
          patient_email: result.user.email,
        }));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleBookAppointment = async (): Promise<void> => {
    // Validate issues field
    if (!formData.issues.trim()) {
      setMessage({
        text: "Please describe your medical issues or symptoms",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/book-appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success && result.scheduling_url) {
        // Show success message
        setMessage({
          text: "Redirecting to Calendly to complete your booking...",
          type: "success",
        });

        // Redirect to Calendly after a brief delay
        setTimeout(() => {
          window.location.href = result.scheduling_url;
        }, 1500);
      } else {
        setMessage({
          text: result.message || "An error occurred. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "Network error. Please check your connection and try again.",
        type: "error",
      });
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const result = await response.json();

      if (result.success) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-purple-600 to-purple-800">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-purple-600" />
              Book Appointment
            </h1>
            {userName && (
              <p className="text-gray-600 text-sm mt-1">Welcome, {userName}!</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <p className="text-center text-gray-600 mb-8 text-sm">
          Fill in your details and click "Book" to schedule your appointment
          with Calendly
        </p>

        {/* Messages */}
        {message.text && (
          <div
            className={`p-4 rounded-lg mb-5 text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <div>
          {/* Patient Name */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2 text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.patient_name}
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base bg-gray-50 cursor-not-allowed text-gray-800"
            />
          </div>

          {/* Patient Email */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2 text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Patient Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.patient_email}
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base bg-gray-50 cursor-not-allowed text-gray-800"
            />
          </div>

          {/* Medical Issues */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Medical Issues / Symptoms <span className="text-red-500">*</span>
            </label>
            <textarea
              name="issues"
              value={formData.issues}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, issues: e.target.value }))
              }
              placeholder="Describe your symptoms or medical concerns in detail"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base transition-all resize-y focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-gray-800"
            />
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📅 Next Step:</strong> After clicking "Book", you'll be
              redirected to Calendly where you can:
            </p>
            <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
              <li>Select your preferred date and time</li>
              <li>Confirm your booking instantly</li>
              <li>Receive a Google Meet link via email</li>
            </ul>
          </div>

          {/* Book Button */}
          <button
            onClick={handleBookAppointment}
            disabled={isSubmitting || !formData.issues.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg text-base font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Book Appointment with Calendly
              </>
            )}
          </button>

          {/* Help Text */}
          <p className="text-center text-gray-500 text-xs mt-4">
            You'll receive a confirmation email once you complete the booking on
            Calendly
          </p>
        </div>
      </div>
    </div>
  );
}
