// src/components/RegisterForm.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    isDoctor: false,
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          isDoctor: formData.isDoctor,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ text: result.message, type: "success" });
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          isDoctor: false,
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setMessage({ text: result.message, type: "error" });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-purple-600 to-purple-800">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          🏥 Create Account
        </h1>
        <p className="text-center text-gray-600 mb-8 text-sm">
          Register for medical consultation services
        </p>

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

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-gray-800 font-semibold mb-2 text-sm">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="mb-5">
            <label className="block text-gray-800 font-semibold mb-2 text-sm">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="mb-5">
            <label className="block text-gray-800 font-semibold mb-2 text-sm">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min 6 characters)"
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="mb-5">
            <label className="block text-gray-800 font-semibold mb-2 text-sm">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isDoctor"
                checked={formData.isDoctor}
                onChange={handleChange}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="ml-3 text-gray-700 text-sm">
                I am a doctor/healthcare provider
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="text-center mt-5">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-purple-600 font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
