// src/components/LoginForm.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          text: "Login successful! Redirecting...",
          type: "success",
        });

        // Check user role and redirect accordingly
        const userResponse = await fetch("/api/auth/user");
        const userData = await userResponse.json();

        if (userData.success) {
          if (userData.user.isDoctor) {
            router.push("/doctor-dashboard");
          } else {
            router.push("/");
          }
        }
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-purple-600 to-purple-800">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          🏥 Welcome Back
        </h1>
        <p className="text-center text-gray-600 mb-8 text-sm">
          Sign in to access your account
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

          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2 text-sm">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-800 transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-5">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-purple-600 font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
