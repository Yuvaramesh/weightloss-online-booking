// src/components/BookingForm.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function BookingForm() {
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_email: "",
    issues: "",
    preferred_time: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/book-appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ text: result.message, type: "success" });
        setFormData({
          patient_name: "",
          patient_email: "",
          issues: "",
          preferred_time: "",
        });
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
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-purple-600 to-purple-800">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          🏥 Online Doctor Consultation
        </h1>
        <p className="text-center text-gray-600 mb-8 text-sm">
          Book your appointment with our experienced doctors
        </p>

        {message.text && (
          <div
            className={`p-4 rounded-lg mb-5 text-sm animate-slideDown ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6 text-gray-800">
            <label className="block text-gray-800 font-semibold mb-2 text-sm">
              Patient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="patient_name"
              value={formData.patient_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="mb-6 text-gray-800">
            <label className="block text-gray-800 font-semibold mb-2 text-sm">
              Patient Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="patient_email"
              value={formData.patient_email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
              className="w-full px-4 py-3 border-2 text-gray-800 border-gray-300 rounded-lg text-base transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="mb-6 text-gray-800">
            <label className="block text-gray-800 font-semibold mb-2 text-sm">
              Medical Issues / Symptoms <span className="text-red-500">*</span>
            </label>
            <textarea
              name="issues"
              value={formData.issues}
              onChange={handleChange}
              placeholder="Describe your symptoms or medical concerns in detail"
              required
              rows={4}
              className="w-full px-4 py-3 text-gray-800 border-2 border-gray-300 rounded-lg text-base transition-all resize-y focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="mb-6 text-gray-800">
            <label className="block text-gray-800 font-semibold mb-2 text-sm">
              Preferred Time Slot <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="preferred_time"
              value={formData.preferred_time}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              required
              className="w-full px-4 text-gray-800 py-3 border-2 border-gray-300 rounded-lg text-base transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg text-base font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? "Submitting..." : "Book Appointment"}
          </button>
        </form>

        <div className="text-center mt-5">
          <Link
            href="/doctor-dashboard"
            className="text-purple-600 font-semibold hover:underline"
          >
            👨‍⚕️ Doctor Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
